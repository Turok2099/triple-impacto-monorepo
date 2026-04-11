import { Injectable, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { BondaService } from '../bonda/bonda.service';

const bondaAllowedFields = ['email', 'nombre', 'apellido', 'telefono', 'genero', 'fecha_nacimiento', 'provincia', 'localidad', 'code'];

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly bondaService: BondaService,
  ) {}

  async getUsers(page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const { data: users, error, count } = await this.supabaseService.getClient()
      .from('usuarios')
      .select('*, donaciones(estado), usuarios_bonda_afiliados(affiliate_code, bonda_microsite_id, bonda_microsites(nombre), is_active)', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error('Error fetching users from Supabase:', error);
      throw new InternalServerErrorException('Error al obtener usuarios locales');
    }

    const mappedUsers = users.map(u => ({
      ...u,
      role: u.role || 'user',
      status: u.is_active ? 'ACTIVO' : 'INACTIVO (Local)',
      usuarios_bonda_afiliados: u.usuarios_bonda_afiliados?.map((a: any) => ({
         affiliate_code: a.affiliate_code,
         bonda_microsite_id: a.bonda_microsite_id,
         ong_name: (a.bonda_microsites as any)?.nombre || (a.bonda_microsites as any)?.[0]?.nombre || 'Suscripción Bonda',
         is_active: a.is_active !== false // Defaults to true if historically null
      }))
    }));

    return {
      users: mappedUsers,
      total: count,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  }

  async getUserPayments(userId: string) {
    const { data, error } = await this.supabaseService.getClient()
      .from('donaciones')
      .select('id, amount:monto, currency:moneda, status:estado, created_at, organizacion_nombre')
      .eq('usuario_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error('Error fetching user payments', error);
      throw new InternalServerErrorException('Error fetch payments');
    }
    return data;
  }

  async createUser(adminId: string, payload: any) {
    // 1. Crear localmente
    const { data: user, error } = await this.supabaseService.getClient().from('usuarios')
      .insert({
        nombre: payload.nombre,
        email: payload.email,
        telefono: payload.telefono,
        dni: payload.dni,
        is_active: true
      }).select().single();
      
    if (error) throw new BadRequestException('Error insertando usuario local: ' + error.message);
    
    // 2. Registrar en Bonda
    let bondaResponse;
    let isRestored = false;
    try {
       bondaResponse = await this.bondaService.crearAfiliado({
         code: payload.code || payload.dni,
         email: payload.email,
         nombre: payload.nombre,
         telefono: payload.telefono
       }); // Fallback to default env config
       
       if (bondaResponse?.error) {
         if (bondaResponse.error.code === 'HttpPublicResponseException') {
            throw new BadRequestException('Bonda Error: ' + JSON.stringify(bondaResponse.error.detail));
         }
       }
       // If restored, UI should know
       if (bondaResponse?.data?.member) {
          isRestored = true;
       }
    } catch (e: any) {
       this.logger.error('Bonda Request Error:', e);
       // Log to audit locally, continue.
    }
    
    // 3. Log Audit
    await this.logAudit(adminId, user.id, 'CREATE_USER', 'SUCCESS', bondaResponse);

    return { user, isRestored, bondaResponse };
  }

  async updateUser(adminId: string, id: string, payload: any) {
     const bondaPayload: Record<string, any> = {};
     for (const key of Object.keys(payload)) {
       if (bondaAllowedFields.includes(key)) {
         bondaPayload[key] = payload[key];
       }
     }
     
     const bondaAffs = await this.supabaseService.getClient().from('usuarios_bonda_afiliados').select('*').eq('user_id', id);
     if (bondaAffs.data && bondaAffs.data.length > 0) {
       for (const aff of bondaAffs.data) {
         try {
           // We use the raw options or omit them to apply env defaults
           await this.bondaService.actualizarAfiliado(aff.affiliate_code, bondaPayload);
         } catch (e) {
           this.logger.error('Bonda Update Failed for aff ' + aff.affiliate_code, e);
         }
       }
     }

     const { data: updated, error } = await this.supabaseService.getClient().from('usuarios').update({
       nombre: payload.nombre,
       email: payload.email,
       telefono: payload.telefono,
       dni: payload.dni
     }).eq('id', id).select().single();

     if (error) throw new BadRequestException('Error local update: ' + error.message);
     
     await this.logAudit(adminId, id, 'UPDATE_USER', 'SUCCESS');
     return updated;
  }

  async updateUserRole(adminId: string, id: string, role: string) {
     if (!['superadmin', 'admin', 'user'].includes(role)) {
       throw new BadRequestException('Rol no válido');
     }
     
     await this.supabaseService.updateUserRole(id, role);
     await this.logAudit(adminId, id, 'UPDATE_USER_ROLE', 'SUCCESS', { target_role: role });
     
     return { success: true, message: `Rol actualizado a ${role} correctamente` };
  }

  async deleteUser(adminId: string, id: string) {
    const bondaAffs = await this.supabaseService.getClient().from('usuarios_bonda_afiliados').select('*, bonda_microsites(slug)').eq('user_id', id);
    if (bondaAffs.data && bondaAffs.data.length > 0) {
       for (const aff of bondaAffs.data) {
         try {
           const slug = (aff.bonda_microsites as any)?.slug || (aff.bonda_microsites as any)?.[0]?.slug;
           const res = await this.bondaService.eliminarAfiliado(aff.affiliate_code, slug ? { slug } : undefined);
           if ((res as any)?.success === false || (res as any)?.error) throw new Error(JSON.stringify(res));
         } catch (e) {
           this.logger.error('Bonda Soft Delete Failed', e);
         }
       }
    }
    // Cascading soft-delete to local affiliations
    await this.supabaseService.getClient().from('usuarios_bonda_afiliados').update({ is_active: false }).eq('user_id', id);

    const { error } = await this.supabaseService.getClient().from('usuarios').update({ is_active: false }).eq('id', id);
    if (error) throw new InternalServerErrorException('Failed to soft delete local user');
    
    await this.logAudit(adminId, id, 'DELETE_USER', 'SUCCESS');
    return { success: true, message: 'Usuario dado de baja (Soft-delete en Bonda por 30 días activado)' };
  }

  async deleteAffiliate(adminId: string, userId: string, bondaCode: string, micrositeId: string) {
    try {
      // Find the specific slug for this code to satisfy Bonda API requirements
      const { data: microsite } = await this.supabaseService.getClient()
        .from('bonda_microsites')
        .select('slug')
        .eq('id', micrositeId)
        .single();
        
      const slug = microsite?.slug;
      
      const res = await this.bondaService.eliminarAfiliado(bondaCode, slug ? { slug } : undefined);
      if ((res as any)?.success === false || (res as any)?.error) {
        this.logger.warn(`Bonda delete for ${bondaCode} rejected (possibly already deleted or offline). Overriding error to force local sync.`, res);
      }
    } catch (e: any) {
      this.logger.warn(`Bonda Soft Delete Failed for ${bondaCode} at microsite ${micrositeId}. Forcing local sync anyway.`, e.message);
    }

    const { error } = await this.supabaseService.getClient()
      .from('usuarios_bonda_afiliados')
      .update({ is_active: false })
      .match({ user_id: userId, bonda_microsite_id: micrositeId });

    if (error) {
      this.logger.error('Failed to remove affiliate locally', error);
      throw new InternalServerErrorException('Afiliado dado de baja en Bonda exitosamente, pero falló borrado local');
    }

    await this.logAudit(adminId, userId, 'DELETE_AFFILIATE', 'SUCCESS', { affiliate_code: bondaCode });
    return { success: true, message: `Afiliación ${bondaCode} cancelada exitosamente` };
  }

  private async logAudit(adminId: string, targetId: string, action: string, status: string, bondaResponse?: any) {
    const { error } = await this.supabaseService.getClient().from('audit_logs').insert({
      admin_id: adminId || 'SYSTEM',
      target_user_id: targetId,
      action,
      status,
      bonda_response: bondaResponse
    });
    if (error) this.logger.warn('WARNING: audit_logs table missing or failed insertion - ' + error.message);
  }
}

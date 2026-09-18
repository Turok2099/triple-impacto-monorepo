import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { BondaService } from '../bonda/bonda.service';
import * as ExcelJS from 'exceljs';
import { encryptSecret } from '../../common/crypto/cipher';

const bondaAllowedFields = [
  'email',
  'nombre',
  'apellido',
  'telefono',
  'genero',
  'fecha_nacimiento',
  'provincia',
  'localidad',
  'code',
];

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly bondaService: BondaService,
    private readonly configService: ConfigService,
  ) {}

  async getUsers(
    page: number = 1,
    limit: number = 20,
    search?: string,
    ongId?: string,
    bondaStatus?: string,
  ) {
    const offset = (page - 1) * limit;

    let query = this.supabaseService
      .getClient()
      .from('usuarios')
      .select(
        '*, donaciones(monto, moneda, estado, created_at, organizacion_nombre), usuarios_bonda_afiliados(affiliate_code, bonda_microsite_id, bonda_microsites(nombre, organizacion_id), is_active)',
        { count: 'exact' },
      );

    if (search) {
      query = query.or(
        `nombre.ilike.%${search}%,email.ilike.%${search}%,dni.ilike.%${search}%`,
      );
    }

    const {
      data: users,
      error,
      count,
    } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error('Error fetching users from Supabase:', error);
      throw new InternalServerErrorException(
        'Error al obtener usuarios locales',
      );
    }

    let mappedUsers = users.map((u) => ({
      ...u,
      role: u.role || 'user',
      status: u.is_active ? 'ACTIVO' : 'INACTIVO (Local)',
      usuarios_bonda_afiliados: u.usuarios_bonda_afiliados?.map((a: any) => ({
        affiliate_code: a.affiliate_code,
        bonda_microsite_id: a.bonda_microsite_id,
        ong_name:
          a.bonda_microsites?.nombre ||
          a.bonda_microsites?.[0]?.nombre ||
          'Suscripción Bonda',
        organizacion_id:
          a.bonda_microsites?.organizacion_id ||
          a.bonda_microsites?.[0]?.organizacion_id,
        is_active: a.is_active !== false, // Defaults to true if historically null
      })),
    }));

    // Local filtering for JSON relationships (since Supabase PostgREST !inner on arrays can be complex)
    if (ongId) {
      mappedUsers = mappedUsers.filter((u) =>
        u.usuarios_bonda_afiliados?.some(
          (a: any) => a.organizacion_id === ongId,
        ),
      );
    }

    if (bondaStatus === 'activo') {
      mappedUsers = mappedUsers.filter((u) =>
        u.usuarios_bonda_afiliados?.some(
          (a: any) =>
            a.is_active === true && (!ongId || a.organizacion_id === ongId),
        ),
      );
    } else if (bondaStatus === 'inactivo') {
      mappedUsers = mappedUsers.filter((u) =>
        u.usuarios_bonda_afiliados?.some(
          (a: any) =>
            a.is_active === false && (!ongId || a.organizacion_id === ongId),
        ),
      );
    }

    return {
      users: mappedUsers,
      total: count,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  }

  async exportUsersToExcel(
    adminId: string,
    search?: string,
    ongId?: string,
    bondaStatus?: string,
  ): Promise<Buffer> {
    // Fetch all users matching search (no pagination limit for export, or a very high limit)
    // We use a high limit like 100000 to get all without breaking
    const result = await this.getUsers(1, 100000, search, ongId, bondaStatus);
    const users = result.users;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Usuarios Registrados');

    worksheet.columns = [
      { header: 'ID Usuario', key: 'id', width: 36 },
      { header: 'Nombre', key: 'nombre', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'DNI', key: 'dni', width: 15 },
      { header: 'Teléfono', key: 'telefono', width: 20 },
      { header: 'Estado Plataforma', key: 'status', width: 20 },
      { header: 'Fecha de Registro', key: 'created_at', width: 20 },
      { header: 'ONGs Afiliadas (Bonda)', key: 'ongs', width: 40 },
      { header: 'Estado Bonda', key: 'bonda_status', width: 20 },
      { header: 'Total Donaciones', key: 'total_donaciones', width: 20 },
      { header: 'Último Pago', key: 'ultimo_pago', width: 25 },
      { header: 'Monto Último Pago', key: 'monto_ultimo_pago', width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2C8184' },
    };
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    for (const u of users) {
      // Afiliaciones Bonda
      let relevantAffiliations = u.usuarios_bonda_afiliados || [];
      if (ongId) {
        relevantAffiliations = relevantAffiliations.filter(
          (a: any) => a.organizacion_id === ongId,
        );
      }

      const ongsString = relevantAffiliations
        .map((a: any) => a.ong_name)
        .join(', ');

      let bondaState = 'Sin afiliación';
      if (relevantAffiliations.length > 0) {
        const allActive = relevantAffiliations.every((a: any) => a.is_active);
        const someActive = relevantAffiliations.some((a: any) => a.is_active);
        if (allActive) bondaState = 'Activo en todas';
        else if (someActive) bondaState = 'Parcialmente activo';
        else bondaState = 'Inactivo en todas';
      }

      // Donaciones
      const donaciones = u.donaciones || [];
      const successfulDonations = donaciones.filter(
        (d: any) => d.estado === 'COMPLETED',
      );

      const totalPagos = successfulDonations.length;
      let ultimoPagoDate = 'N/A';
      let montoUltimoPago = 'N/A';

      if (successfulDonations.length > 0) {
        // Sort descending by created_at
        successfulDonations.sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        const lastDonation = successfulDonations[0];
        ultimoPagoDate = new Date(lastDonation.created_at).toLocaleDateString();
        montoUltimoPago = `${lastDonation.monto} ${lastDonation.moneda}`;
      }

      worksheet.addRow({
        id: u.id,
        nombre: u.nombre,
        email: u.email,
        dni: u.dni || 'N/A',
        telefono: u.telefono || 'N/A',
        status: u.status,
        created_at: new Date(u.created_at).toLocaleDateString(),
        ongs: ongsString || 'Ninguna',
        bonda_status: bondaState,
        total_donaciones: totalPagos,
        ultimo_pago: ultimoPagoDate,
        monto_ultimo_pago: montoUltimoPago,
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();

    await this.logAudit(adminId, 'SYSTEM', 'EXPORT_USERS', 'SUCCESS', {
      filters: { search, ongId, bondaStatus },
      count: users.length,
    });
    return buffer as any;
  }

  async getUserPayments(userId: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('donaciones')
      .select(
        'id, amount:monto, currency:moneda, status:estado, created_at, organizacion_nombre',
      )
      .eq('usuario_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error('Error fetching user payments', error);
      throw new InternalServerErrorException('Error fetch payments');
    }
    return data;
  }

  // ========================================
  // REPORTE MENSUAL BONDA (altas + pagos)
  // ========================================

  private parseRangoFechas(desde?: string, hasta?: string) {
    const ahora = new Date();
    const inicioDefault = new Date(
      Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), 1),
    );
    const finDefault = new Date(
      Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth() + 1, 1),
    );

    const inicio = desde ? new Date(`${desde}-01T00:00:00Z`) : inicioDefault;
    // "hasta" es un mes YYYY-MM inclusive: el rango llega hasta el primer día del mes siguiente.
    const finBase = hasta ? new Date(`${hasta}-01T00:00:00Z`) : finDefault;
    const fin = new Date(
      Date.UTC(finBase.getUTCFullYear(), finBase.getUTCMonth() + 1, 1),
    );

    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      throw new BadRequestException(
        'Rango de fechas inválido. Usá el formato YYYY-MM.',
      );
    }
    if (inicio >= fin) {
      throw new BadRequestException(
        'El mes "desde" debe ser anterior o igual al mes "hasta".',
      );
    }

    return { inicio, fin };
  }

  private mesKey(fecha: string): string {
    return (fecha || '').slice(0, 7); // "YYYY-MM"
  }

  /**
   * Trae, para un rango de meses (y opcionalmente una sola ONG), las altas de
   * afiliados Bonda y los pagos completados, para armar el resumen mensual y el detalle.
   * No consulta la API de Bonda (rápido) — pensado para la vista en pantalla.
   */
  private async recolectarDatosReporteBonda(
    desde?: string,
    hasta?: string,
    organizacionId?: string,
  ) {
    const { inicio, fin } = this.parseRangoFechas(desde, hasta);
    const client = this.supabaseService.getClient();

    let afiliadosQuery = client
      .from('usuarios_bonda_afiliados')
      .select(
        `
        id, affiliate_code, is_active, created_at,
        usuarios ( id, nombre, email, dni ),
        bonda_microsites!inner ( id, nombre, slug, organizacion_id, organizaciones ( id, nombre ) )
      `,
      )
      .gte('created_at', inicio.toISOString())
      .lt('created_at', fin.toISOString())
      .order('created_at', { ascending: true });

    if (organizacionId) {
      afiliadosQuery = afiliadosQuery.eq(
        'bonda_microsites.organizacion_id',
        organizacionId,
      );
    }

    const { data: afiliados, error: afiliadosError } = await afiliadosQuery;
    if (afiliadosError) {
      this.logger.error('Error obteniendo altas Bonda:', afiliadosError);
      throw new InternalServerErrorException(
        'Error al obtener las altas de Bonda',
      );
    }

    let pagosQuery = client
      .from('donaciones')
      .select(
        'id, usuario_id, monto, moneda, organizacion_id, organizacion_nombre, created_at, usuarios ( nombre, email, dni )',
      )
      .eq('estado', 'completada')
      .gte('created_at', inicio.toISOString())
      .lt('created_at', fin.toISOString())
      .order('created_at', { ascending: true });

    if (organizacionId) {
      pagosQuery = pagosQuery.eq('organizacion_id', organizacionId);
    }

    const { data: pagos, error: pagosError } = await pagosQuery;
    if (pagosError) {
      this.logger.error('Error obteniendo pagos completados:', pagosError);
      throw new InternalServerErrorException(
        'Error al obtener los pagos completados',
      );
    }

    return {
      afiliados: (afiliados || []) as any[],
      pagos: (pagos || []) as any[],
    };
  }

  private armarResumenMensual(afiliados: any[], pagos: any[]) {
    const resumen = new Map<
      string,
      {
        mes: string;
        organizacion_id: string | null;
        organizacion_nombre: string;
        altas_bonda: number;
        pagos_completados: number;
        monto_total: number;
      }
    >();

    const getOrCreate = (
      mes: string,
      organizacionId: string | null,
      organizacionNombre: string,
    ) => {
      const key = `${mes}|${organizacionId || 'sin-ong'}`;
      if (!resumen.has(key)) {
        resumen.set(key, {
          mes,
          organizacion_id: organizacionId,
          organizacion_nombre: organizacionNombre || 'Sin ONG',
          altas_bonda: 0,
          pagos_completados: 0,
          monto_total: 0,
        });
      }
      return resumen.get(key)!;
    };

    for (const a of afiliados) {
      const micrositio = a.bonda_microsites;
      const organizacionId = micrositio?.organizacion_id || null;
      const organizacionNombre =
        micrositio?.organizaciones?.nombre || micrositio?.nombre || 'Sin ONG';
      const fila = getOrCreate(
        this.mesKey(a.created_at),
        organizacionId,
        organizacionNombre,
      );
      fila.altas_bonda += 1;
    }

    for (const p of pagos) {
      const fila = getOrCreate(
        this.mesKey(p.created_at),
        p.organizacion_id || null,
        p.organizacion_nombre || 'Sin ONG',
      );
      fila.pagos_completados += 1;
      fila.monto_total += Number(p.monto) || 0;
    }

    return Array.from(resumen.values()).sort(
      (x, y) =>
        x.mes.localeCompare(y.mes) ||
        x.organizacion_nombre.localeCompare(y.organizacion_nombre),
    );
  }

  private armarDetalle(afiliados: any[], pagos: any[]) {
    // Para cada alta, el pago completado más reciente de ese mismo usuario en la misma ONG.
    const pagosPorUsuarioOrg = new Map<string, any>();
    for (const p of pagos) {
      const key = `${p.usuario_id}|${p.organizacion_id || ''}`;
      const actual = pagosPorUsuarioOrg.get(key);
      if (!actual || new Date(p.created_at) > new Date(actual.created_at)) {
        pagosPorUsuarioOrg.set(key, p);
      }
    }

    return afiliados.map((a) => {
      const micrositio = a.bonda_microsites;
      const organizacionId = micrositio?.organizacion_id || null;
      const pago = pagosPorUsuarioOrg.get(`${a.usuarios?.id}|${organizacionId || ''}`);

      return {
        usuario_id: a.usuarios?.id,
        nombre: a.usuarios?.nombre || '',
        email: a.usuarios?.email || '',
        dni: a.usuarios?.dni || '',
        organizacion_id: organizacionId,
        organizacion_nombre:
          micrositio?.organizaciones?.nombre || micrositio?.nombre || 'Sin ONG',
        micrositio_slug: micrositio?.slug || null,
        fecha_alta_bonda: a.created_at,
        affiliate_code: a.affiliate_code,
        activo_local: !!a.is_active,
        ultimo_pago_monto: pago ? Number(pago.monto) : null,
        ultimo_pago_moneda: pago?.moneda || null,
        ultimo_pago_fecha: pago?.created_at || null,
      };
    });
  }

  /**
   * Vista en pantalla: resumen mensual + detalle, sin consultar Bonda (rápido).
   */
  async getReporteBondaMensual(
    desde?: string,
    hasta?: string,
    organizacionId?: string,
  ) {
    const { afiliados, pagos } = await this.recolectarDatosReporteBonda(
      desde,
      hasta,
      organizacionId,
    );

    return {
      resumen: this.armarResumenMensual(afiliados, pagos),
      detalle: this.armarDetalle(afiliados, pagos),
    };
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Excel de dos hojas (Resumen mensual + Detalle). El detalle incluye una
   * verificación en vivo contra la API de Bonda por cada afiliado (fila por fila,
   * con una pausa entre llamados para no exceder el límite de la API de Bonda) —
   * por eso puede tardar si el rango tiene muchos usuarios.
   */
  async exportReporteBondaMensual(
    adminId: string,
    desde?: string,
    hasta?: string,
    organizacionId?: string,
  ): Promise<Buffer> {
    const { afiliados, pagos } = await this.recolectarDatosReporteBonda(
      desde,
      hasta,
      organizacionId,
    );
    const resumen = this.armarResumenMensual(afiliados, pagos);
    const detalle = this.armarDetalle(afiliados, pagos);

    // Verificación en vivo contra Bonda, fila por fila.
    const estadoBondaPorAfiliado = new Map<string, string>();
    for (const a of afiliados) {
      const organizacionIdFila = a.bonda_microsites?.organizacion_id;
      const key = `${a.usuarios?.id}|${organizacionIdFila || ''}`;
      if (!a.affiliate_code || !organizacionIdFila) {
        estadoBondaPorAfiliado.set(key, 'Sin datos suficientes');
        continue;
      }
      try {
        const bondaUser = await this.bondaService.obtenerAfiliado(
          a.affiliate_code,
          { organizacionId: organizacionIdFila },
        );
        if (bondaUser === null) {
          estadoBondaPorAfiliado.set(key, 'No encontrado en Bonda');
        } else if (bondaUser?.error) {
          estadoBondaPorAfiliado.set(key, 'Error al verificar');
        } else {
          estadoBondaPorAfiliado.set(key, 'Verificado en Bonda');
        }
      } catch (e) {
        estadoBondaPorAfiliado.set(key, 'Error al verificar');
      }
      // Evitar rate-limit de la API de Bonda (mismo criterio que el job de reconciliación).
      await this.delay(300);
    }

    const workbook = new ExcelJS.Workbook();

    const resumenSheet = workbook.addWorksheet('Resumen mensual');
    resumenSheet.columns = [
      { header: 'Mes', key: 'mes', width: 12 },
      { header: 'ONG', key: 'organizacion_nombre', width: 30 },
      { header: 'Altas nuevas en Bonda', key: 'altas_bonda', width: 22 },
      { header: 'Pagos completados', key: 'pagos_completados', width: 20 },
      { header: 'Monto total donado', key: 'monto_total', width: 20 },
    ];
    resumenSheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };
    resumenSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2C8184' },
    };
    for (const fila of resumen) {
      resumenSheet.addRow(fila);
    }

    const detalleSheet = workbook.addWorksheet('Detalle');
    detalleSheet.columns = [
      { header: 'Nombre', key: 'nombre', width: 28 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'DNI', key: 'dni', width: 15 },
      { header: 'ONG', key: 'organizacion_nombre', width: 28 },
      { header: 'Fecha de alta en Bonda', key: 'fecha_alta_bonda', width: 22 },
      { header: 'Código de afiliado', key: 'affiliate_code', width: 18 },
      { header: 'Activo (local)', key: 'activo_local', width: 14 },
      { header: 'Estado en Bonda', key: 'estado_bonda', width: 20 },
      { header: 'Monto último pago', key: 'ultimo_pago_monto', width: 18 },
      { header: 'Fecha último pago', key: 'ultimo_pago_fecha', width: 20 },
    ];
    detalleSheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };
    detalleSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2C8184' },
    };
    for (const fila of detalle) {
      const key = `${fila.usuario_id}|${fila.organizacion_id || ''}`;
      detalleSheet.addRow({
        nombre: fila.nombre,
        email: fila.email,
        dni: fila.dni,
        organizacion_nombre: fila.organizacion_nombre,
        fecha_alta_bonda: new Date(fila.fecha_alta_bonda).toLocaleString(
          'es-AR',
        ),
        affiliate_code: fila.affiliate_code,
        activo_local: fila.activo_local ? 'Sí' : 'No',
        estado_bonda: estadoBondaPorAfiliado.get(key) || 'Sin verificar',
        ultimo_pago_monto: fila.ultimo_pago_monto ?? 'N/A',
        ultimo_pago_fecha: fila.ultimo_pago_fecha
          ? new Date(fila.ultimo_pago_fecha).toLocaleString('es-AR')
          : 'N/A',
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();

    await this.logAudit(adminId, 'SYSTEM', 'EXPORT_REPORTE_BONDA', 'SUCCESS', {
      filters: { desde, hasta, organizacionId },
      altas: afiliados.length,
      pagos: pagos.length,
    });

    return buffer as any;
  }

  async createUser(adminId: string, payload: any) {
    // 1. Crear localmente
    const { data: user, error } = await this.supabaseService
      .getClient()
      .from('usuarios')
      .insert({
        nombre: payload.nombre,
        email: payload.email,
        telefono: payload.telefono,
        dni: payload.dni,
        is_active: true,
      })
      .select()
      .single();

    if (error)
      throw new BadRequestException(
        'Error insertando usuario local: ' + error.message,
      );

    // 2. Registrar en Bonda
    let bondaResponse;
    let isRestored = false;
    try {
      bondaResponse = await this.bondaService.crearAfiliado({
        code: payload.code || payload.dni,
        email: payload.email,
        nombre: payload.nombre,
        telefono: payload.telefono,
      }); // Fallback to default env config

      if (bondaResponse?.error) {
        if (bondaResponse.error.code === 'HttpPublicResponseException') {
          throw new BadRequestException(
            'Bonda Error: ' + JSON.stringify(bondaResponse.error.detail),
          );
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
    await this.logAudit(
      adminId,
      user.id,
      'CREATE_USER',
      'SUCCESS',
      bondaResponse,
    );

    return { user, isRestored, bondaResponse };
  }

  async updateUser(adminId: string, id: string, payload: any) {
    const bondaPayload: Record<string, any> = {};
    for (const key of Object.keys(payload)) {
      if (bondaAllowedFields.includes(key)) {
        bondaPayload[key] = payload[key];
      }
    }

    const bondaAffs = await this.supabaseService
      .getClient()
      .from('usuarios_bonda_afiliados')
      .select('*')
      .eq('user_id', id);
    if (bondaAffs.data && bondaAffs.data.length > 0) {
      for (const aff of bondaAffs.data) {
        try {
          // We use the raw options or omit them to apply env defaults
          await this.bondaService.actualizarAfiliado(
            aff.affiliate_code,
            bondaPayload,
          );
        } catch (e) {
          this.logger.error(
            'Bonda Update Failed for aff ' + aff.affiliate_code,
            e,
          );
        }
      }
    }

    const { data: updated, error } = await this.supabaseService
      .getClient()
      .from('usuarios')
      .update({
        nombre: payload.nombre,
        email: payload.email,
        telefono: payload.telefono,
        dni: payload.dni,
      })
      .eq('id', id)
      .select()
      .single();

    if (error)
      throw new BadRequestException('Error local update: ' + error.message);

    await this.logAudit(adminId, id, 'UPDATE_USER', 'SUCCESS');
    return updated;
  }

  async updateUserRole(adminId: string, id: string, role: string) {
    if (!['admin', 'user'].includes(role)) {
      throw new BadRequestException('Rol no válido');
    }

    await this.supabaseService.updateUserRole(id, role);
    await this.logAudit(adminId, id, 'UPDATE_USER_ROLE', 'SUCCESS', {
      target_role: role,
    });

    return {
      success: true,
      message: `Rol actualizado a ${role} correctamente`,
    };
  }

  async deleteUser(adminId: string, id: string) {
    const bondaAffs = await this.supabaseService
      .getClient()
      .from('usuarios_bonda_afiliados')
      .select('*, bonda_microsites(slug)')
      .eq('user_id', id);
    if (bondaAffs.data && bondaAffs.data.length > 0) {
      for (const aff of bondaAffs.data) {
        try {
          const slug =
            aff.bonda_microsites?.slug || aff.bonda_microsites?.[0]?.slug;
          const res = await this.bondaService.eliminarAfiliado(
            aff.affiliate_code,
            slug ? { slug } : undefined,
          );
          if ((res as any)?.success === false || (res as any)?.error)
            throw new Error(JSON.stringify(res));
        } catch (e) {
          this.logger.error('Bonda Soft Delete Failed', e);
        }
      }
    }
    // Cascading soft-delete to local affiliations
    await this.supabaseService
      .getClient()
      .from('usuarios_bonda_afiliados')
      .update({ is_active: false })
      .eq('user_id', id);

    // Cancelar suscripciones activas vinculadas al usuario
    await this.supabaseService
      .getClient()
      .from('suscripciones')
      .update({ estado: 'cancelada' })
      .eq('usuario_id', id)
      .eq('estado', 'activa');

    const { error } = await this.supabaseService
      .getClient()
      .from('usuarios')
      .update({ is_active: false })
      .eq('id', id);
    if (error)
      throw new InternalServerErrorException(
        'Failed to soft delete local user',
      );

    await this.logAudit(adminId, id, 'DELETE_USER', 'SUCCESS');
    return {
      success: true,
      message:
        'Usuario dado de baja (Soft-delete en Bonda por 30 días activado)',
    };
  }

  async deleteAffiliate(
    adminId: string,
    userId: string,
    bondaCode: string,
    micrositeId: string,
  ) {
    let microsite: any = null;
    try {
      // Find the specific slug for this code to satisfy Bonda API requirements
      const response = await this.supabaseService
        .getClient()
        .from('bonda_microsites')
        .select('slug, organizacion_id')
        .eq('id', micrositeId)
        .single();
      microsite = response.data;

      const slug = microsite?.slug;

      const res = await this.bondaService.eliminarAfiliado(
        bondaCode,
        slug ? { slug } : undefined,
      );
      if ((res as any)?.success === false || (res as any)?.error) {
        this.logger.warn(
          `Bonda delete for ${bondaCode} rejected (possibly already deleted or offline). Overriding error to force local sync.`,
          res,
        );
      }
    } catch (e: any) {
      this.logger.warn(
        `Bonda Soft Delete Failed for ${bondaCode} at microsite ${micrositeId}. Forcing local sync anyway.`,
        e.message,
      );
    }

    const { error } = await this.supabaseService
      .getClient()
      .from('usuarios_bonda_afiliados')
      .update({ is_active: false })
      .match({ user_id: userId, bonda_microsite_id: micrositeId });

    if (error) {
      this.logger.error('Failed to remove affiliate locally', error);
      throw new InternalServerErrorException(
        'Afiliado dado de baja en Bonda exitosamente, pero falló borrado local',
      );
    }

    if (microsite?.organizacion_id) {
      await this.supabaseService
        .getClient()
        .from('suscripciones')
        .update({ estado: 'cancelada' })
        .eq('usuario_id', userId)
        .eq('organizacion_id', microsite.organizacion_id)
        .eq('estado', 'activa');
    }

    await this.logAudit(adminId, userId, 'DELETE_AFFILIATE', 'SUCCESS', {
      affiliate_code: bondaCode,
    });
    return {
      success: true,
      message: `Afiliación ${bondaCode} cancelada exitosamente`,
    };
  }

  private async logAudit(
    adminId: string,
    targetId: string,
    action: string,
    status: string,
    bondaResponse?: any,
  ) {
    const { error } = await this.supabaseService
      .getClient()
      .from('audit_logs')
      .insert({
        admin_id: adminId || 'SYSTEM',
        target_user_id: targetId,
        action,
        status,
        bonda_response: bondaResponse,
      });
    if (error)
      this.logger.warn(
        'WARNING: audit_logs table missing or failed insertion - ' +
          error.message,
      );
  }

  // ==========================================
  // ONGs / ORGANIZACIONES
  // ==========================================

  async uploadLogo(file: any) {
    const client = this.supabaseService.getClient();
    // Normalize filename
    const ext = file.originalname.split('.').pop() || 'png';
    const cleanName = file.originalname
      .replace(/[^a-zA-Z0-9]/g, '-')
      .toLowerCase();
    const fileName = `logo-${Date.now()}-${cleanName}.${ext}`;

    const { data, error } = await client.storage
      .from('ong-logos')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
        cacheControl: '31536000',
      });

    if (error) {
      throw new InternalServerErrorException(
        'Error uploading to Supabase: ' + error.message,
      );
    }

    const { data: publicUrlData } = client.storage
      .from('ong-logos')
      .getPublicUrl(fileName);

    return { url: publicUrlData.publicUrl };
  }

  async getOrganizaciones() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('organizaciones')
      .select('*, bonda_microsites(*)')
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error('Error fetching organizaciones:', error);
      throw new InternalServerErrorException('Error al obtener ONGs');
    }
    return (data || []).map((org: any) => this.toOrganizacionResponse(org));
  }

  /**
   * Nunca devolver fiserv_shared_secret crudo al navegador del admin — solo un
   * booleano de si está configurado, más el link de donación calculado server-side.
   */
  private toOrganizacionResponse(org: any) {
    const { fiserv_shared_secret, ...rest } = org;
    return {
      ...rest,
      fiserv_shared_secret_configurado: !!fiserv_shared_secret,
      has_fiserv_config: !!(
        org.fiserv_activo &&
        org.fiserv_store_id &&
        fiserv_shared_secret
      ),
      donacion_url: this.buildDonacionUrl(org.slug),
    };
  }

  private buildDonacionUrl(slug: string | null | undefined): string | null {
    if (!slug) return null;
    const frontendUrl = (
      this.configService.get<string>('frontendUrl') || ''
    ).replace(/\/$/, '');
    return `${frontendUrl}/donar/${slug}`;
  }

  private encryptFiservSecret(plainText: string): string {
    const key = this.configService.get<string>(
      'security.fiservSecretEncryptionKey',
    );
    if (!key) {
      throw new InternalServerErrorException(
        'FISERV_SECRET_ENCRYPTION_KEY no está configurada en el servidor.',
      );
    }
    return encryptSecret(plainText, key);
  }

  private assertFiservCompleto(
    fiservActivo: boolean,
    storeId: string | null | undefined,
    sharedSecret: string | null | undefined,
  ) {
    if (!fiservActivo) return;
    const storeIdOk = !!storeId && storeId.trim() !== '';
    const secretOk = !!sharedSecret && sharedSecret.trim() !== '';
    if (!storeIdOk || !secretOk) {
      throw new BadRequestException(
        'Para activar Fiserv hay que completar el Store ID y el Shared Secret.',
      );
    }
  }

  private normalizeSlug(raw: string | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim().toLowerCase();
    if (!trimmed) return null;

    if (trimmed.length < 3 || trimmed.length > 80) {
      throw new BadRequestException(
        'El slug debe tener entre 3 y 80 caracteres.',
      );
    }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(trimmed)) {
      throw new BadRequestException(
        'El slug solo puede contener letras minúsculas, números y guiones simples, sin empezar ni terminar con guión.',
      );
    }
    return trimmed;
  }

  private slugifyNombre(nombre: string): string {
    const base = (nombre || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '') // quitar acentos (á, ñ, etc.)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
    return base || 'ong';
  }

  /**
   * Genera un slug único a partir del nombre de la ONG (agregando -2, -3...
   * si hace falta) para habilitar el link de donación exclusivo sin que el
   * admin tenga que escribirlo a mano.
   */
  private async generarSlugUnico(
    client: ReturnType<SupabaseService['getClient']>,
    nombre: string,
    excludeId?: string,
  ): Promise<string> {
    const base = this.slugifyNombre(nombre);
    let candidate = base;
    let suffix = 2;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      let query = client
        .from('organizaciones')
        .select('id')
        .ilike('slug', candidate);
      if (excludeId) query = query.neq('id', excludeId);
      const { data, error } = await query.maybeSingle();
      if (error) {
        this.logger.error('Error generando slug único:', error);
        throw new InternalServerErrorException(
          'Error al generar el link de donación',
        );
      }
      if (!data) return candidate;
      candidate = `${base}-${suffix}`;
      suffix++;
    }
  }

  private async assertSlugDisponible(
    client: ReturnType<SupabaseService['getClient']>,
    slug: string,
    excludeId?: string,
  ) {
    let query = client.from('organizaciones').select('id').ilike('slug', slug);
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    const { data, error } = await query.maybeSingle();

    if (error) {
      this.logger.error('Error verificando disponibilidad de slug:', error);
      throw new InternalServerErrorException(
        'Error al verificar disponibilidad del slug',
      );
    }
    if (data) {
      throw new BadRequestException(
        'Ese slug ya está en uso por otra organización.',
      );
    }
  }

  async createOrganizacion(adminId: string, payload: any) {
    if (
      (payload.monto_fijo_1 !== undefined &&
        payload.monto_fijo_1 !== null &&
        payload.monto_fijo_1 < 10000) ||
      (payload.monto_fijo_2 !== undefined &&
        payload.monto_fijo_2 !== null &&
        payload.monto_fijo_2 < 10000) ||
      (payload.monto_fijo_3 !== undefined &&
        payload.monto_fijo_3 !== null &&
        payload.monto_fijo_3 < 10000)
    ) {
      throw new BadRequestException(
        'Los montos fijos sugeridos no pueden ser menores a $10.000',
      );
    }

    const client = this.supabaseService.getClient();

    let slug = this.normalizeSlug(payload.slug);
    if (slug) {
      await this.assertSlugDisponible(client, slug);
    }

    const fiservActivo = payload.fiserv_activo ?? false;
    const fiservStoreId =
      typeof payload.fiserv_store_id === 'string'
        ? payload.fiserv_store_id.trim()
        : payload.fiserv_store_id;
    const fiservSharedSecretCifrado = payload.fiserv_shared_secret
      ? this.encryptFiservSecret(payload.fiserv_shared_secret)
      : null;
    this.assertFiservCompleto(
      fiservActivo,
      fiservStoreId,
      fiservSharedSecretCifrado,
    );

    // Fiserv activo sin slug propio: generar el link de donación automáticamente.
    if (!slug && fiservActivo) {
      slug = await this.generarSlugUnico(client, payload.nombre);
    }

    // 1. Crear Organización
    const { data: org, error: orgError } = await client
      .from('organizaciones')
      .insert({
        nombre: payload.nombre,
        descripcion: payload.descripcion,
        logo_url: payload.logo_url,
        website_url: payload.website_url,
        email: payload.email,
        telefono: payload.telefono,
        direccion: payload.direccion,
        monto_minimo: payload.monto_minimo,
        monto_fijo_1: payload.monto_fijo_1 || 10000,
        monto_fijo_2: payload.monto_fijo_2 || 20000,
        monto_fijo_3: payload.monto_fijo_3 || 30000,
        activa: payload.activa ?? true,
        verificada: payload.verificada ?? false,
        fiserv_activo: fiservActivo,
        fiserv_store_id: fiservStoreId,
        fiserv_shared_secret: fiservSharedSecretCifrado,
        slug,
      })
      .select()
      .single();

    if (orgError) {
      throw new BadRequestException(
        'Error al crear la organización local: ' + orgError.message,
      );
    }

    // 2. Crear Micrositio Bonda (opcional pero esperado)
    if (payload.bonda_slug && payload.bonda_api_token) {
      const { error: bondaError } = await client
        .from('bonda_microsites')
        .insert({
          organizacion_id: org.id,
          nombre: payload.nombre,
          slug: payload.bonda_slug,
          api_token: payload.bonda_api_token,
          api_token_nominas: payload.bonda_api_token_nominas,
          microsite_id: payload.bonda_microsite_id,
          activo: true,
        });

      if (bondaError) {
        this.logger.error('Error insertando Bonda microsite:', bondaError);
      }
    }

    await this.logAudit(adminId, org.id, 'CREATE_ORG', 'SUCCESS');
    return this.toOrganizacionResponse(org);
  }

  async updateOrganizacion(adminId: string, id: string, payload: any) {
    if (
      (payload.monto_fijo_1 !== undefined &&
        payload.monto_fijo_1 !== null &&
        payload.monto_fijo_1 < 10000) ||
      (payload.monto_fijo_2 !== undefined &&
        payload.monto_fijo_2 !== null &&
        payload.monto_fijo_2 < 10000) ||
      (payload.monto_fijo_3 !== undefined &&
        payload.monto_fijo_3 !== null &&
        payload.monto_fijo_3 < 10000)
    ) {
      throw new BadRequestException(
        'Los montos fijos sugeridos no pueden ser menores a $10.000',
      );
    }

    const client = this.supabaseService.getClient();

    const { data: existing, error: existingError } = await client
      .from('organizaciones')
      .select('nombre, slug, fiserv_activo, fiserv_store_id, fiserv_shared_secret')
      .eq('id', id)
      .maybeSingle();

    if (existingError || !existing) {
      throw new BadRequestException('Organización no encontrada.');
    }

    let slug = this.normalizeSlug(payload.slug);
    if (slug) {
      await this.assertSlugDisponible(client, slug, id);
    }

    // El admin deja el campo de secret en blanco cuando no quiere cambiarlo
    // (nunca se le muestra el valor real); si escribió uno nuevo, se cifra acá.
    const fiservSharedSecretCifrado = payload.fiserv_shared_secret
      ? this.encryptFiservSecret(payload.fiserv_shared_secret)
      : existing.fiserv_shared_secret;
    const fiservActivo = payload.fiserv_activo ?? existing.fiserv_activo;
    const fiservStoreId =
      payload.fiserv_store_id !== undefined
        ? typeof payload.fiserv_store_id === 'string'
          ? payload.fiserv_store_id.trim()
          : payload.fiserv_store_id
        : existing.fiserv_store_id;

    this.assertFiservCompleto(
      fiservActivo,
      fiservStoreId,
      fiservSharedSecretCifrado,
    );

    // Se está activando Fiserv y la ONG todavía no tiene slug propio:
    // generar el link de donación automáticamente en vez de dejarlo sin link.
    if (!slug && !existing.slug && fiservActivo) {
      slug = await this.generarSlugUnico(
        client,
        payload.nombre || existing.nombre,
        id,
      );
    }

    const { data: org, error: orgError } = await client
      .from('organizaciones')
      .update({
        nombre: payload.nombre,
        descripcion: payload.descripcion,
        logo_url: payload.logo_url,
        website_url: payload.website_url,
        email: payload.email,
        telefono: payload.telefono,
        direccion: payload.direccion,
        monto_minimo: payload.monto_minimo,
        monto_fijo_1: payload.monto_fijo_1,
        monto_fijo_2: payload.monto_fijo_2,
        monto_fijo_3: payload.monto_fijo_3,
        activa: payload.activa,
        verificada: payload.verificada,
        fiserv_activo: fiservActivo,
        fiserv_store_id: fiservStoreId,
        fiserv_shared_secret: fiservSharedSecretCifrado,
        slug,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (orgError) {
      throw new BadRequestException(
        'Error al actualizar organización: ' + orgError.message,
      );
    }

    // El slug cambió: dejar registro para poder redirigir el link viejo al nuevo.
    if (existing.slug && slug && existing.slug !== slug) {
      const { error: historialError } = await client
        .from('organizacion_slugs_historicos')
        .insert({
          organizacion_id: id,
          slug_anterior: existing.slug,
        });
      if (historialError) {
        this.logger.warn(
          'No se pudo registrar el historial de slug (¿falta la tabla organizacion_slugs_historicos?): ' +
            historialError.message,
        );
      }
    }

    // Actualizar Bonda Microsite asociado si se pasaron datos
    if (payload.bonda_slug || payload.bonda_api_token) {
      const bondaData: any = {};
      if (payload.bonda_slug) bondaData.slug = payload.bonda_slug;
      if (payload.bonda_api_token)
        bondaData.api_token = payload.bonda_api_token;
      if (payload.bonda_api_token_nominas !== undefined)
        bondaData.api_token_nominas = payload.bonda_api_token_nominas;
      if (payload.bonda_microsite_id)
        bondaData.microsite_id = payload.bonda_microsite_id;

      // Buscar si existe
      const { data: existingBonda } = await client
        .from('bonda_microsites')
        .select('id')
        .eq('organizacion_id', id)
        .maybeSingle();

      if (existingBonda) {
        await client
          .from('bonda_microsites')
          .update(bondaData)
          .eq('id', existingBonda.id);
      } else {
        await client.from('bonda_microsites').insert({
          organizacion_id: id,
          nombre: payload.nombre,
          activo: true,
          ...bondaData,
        });
      }
    }

    await this.logAudit(adminId, id, 'UPDATE_ORG', 'SUCCESS');
    return this.toOrganizacionResponse(org);
  }

  async deleteOrganizacion(adminId: string, id: string) {
    const client = this.supabaseService.getClient();

    // Solo borrado lógico (desactivar) por seguridad
    const { error } = await client
      .from('organizaciones')
      .update({ activa: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new InternalServerErrorException(
        'Error al desactivar la organización',
      );
    }

    // Desactivar el micrositio de bonda asociado
    await client
      .from('bonda_microsites')
      .update({ activo: false })
      .eq('organizacion_id', id);

    await this.logAudit(adminId, id, 'DELETE_ORG', 'SUCCESS');
    return { success: true, message: 'Organización desactivada correctamente' };
  }

  async permanentDeleteOrganizacion(adminId: string, id: string) {
    const client = this.supabaseService.getClient();

    // Eliminar el micrositio de bonda asociado primero por las claves foraneas
    await client.from('bonda_microsites').delete().eq('organizacion_id', id);

    // Eliminar la organización
    const { error } = await client.from('organizaciones').delete().eq('id', id);

    if (error) {
      throw new InternalServerErrorException(
        'Error al eliminar la organización de forma permanente',
      );
    }

    await this.logAudit(adminId, id, 'DELETE_ORG_PERMANENT', 'SUCCESS');
    return { success: true, message: 'Organización eliminada permanentemente' };
  }

  // ==========================================
  // BANNERS
  // ==========================================

  async getBanners() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('banners')
      .select('*')
      .order('order', { ascending: true });

    if (error) {
      this.logger.error('Error fetching banners:', error);
      throw new InternalServerErrorException('Error al obtener banners');
    }
    return data;
  }

  async uploadBannerImage(file: any) {
    const client = this.supabaseService.getClient();
    const ext = file.originalname.split('.').pop() || 'png';
    const cleanName = file.originalname
      .replace(/[^a-zA-Z0-9]/g, '-')
      .toLowerCase();
    const fileName = `banner-${Date.now()}-${cleanName}.${ext}`;

    // Using 'home-banners' bucket. Note: This bucket must exist in Supabase
    const { data, error } = await client.storage
      .from('home-banners')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
        cacheControl: '31536000',
      });

    if (error) {
      // Fallback to 'ong-logos' if 'home-banners' doesn't exist, or just throw error
      // For now, let's throw error so the user knows they need to create the bucket
      this.logger.error(
        'Error uploading banner to home-banners bucket:',
        error,
      );
      throw new InternalServerErrorException(
        'Error uploading to Supabase bucket "home-banners". Asegúrate de que el bucket exista.',
      );
    }

    const { data: publicUrlData } = client.storage
      .from('home-banners')
      .getPublicUrl(fileName);

    return { url: publicUrlData.publicUrl };
  }

  async createBanner(adminId: string, payload: any) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('banners')
      .insert({
        title: payload.title,
        image_url: payload.image_url,
        device_type: payload.device_type || 'desktop',
        link_url: payload.link_url,
        is_active: payload.is_active ?? true,
        order: payload.order ?? 0,
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(
        'Error al crear el banner: ' + error.message,
      );
    }

    await this.logAudit(adminId, data.id, 'CREATE_BANNER', 'SUCCESS');
    return data;
  }

  async updateBanner(adminId: string, id: string, payload: any) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('banners')
      .update({
        title: payload.title,
        image_url: payload.image_url,
        device_type: payload.device_type,
        link_url: payload.link_url,
        is_active: payload.is_active,
        order: payload.order,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(
        'Error al actualizar banner: ' + error.message,
      );
    }

    await this.logAudit(adminId, id, 'UPDATE_BANNER', 'SUCCESS');
    return data;
  }

  async deleteBanner(adminId: string, id: string) {
    const { error } = await this.supabaseService
      .getClient()
      .from('banners')
      .delete()
      .eq('id', id);

    if (error) {
      throw new InternalServerErrorException('Error al eliminar el banner');
    }

    await this.logAudit(adminId, id, 'DELETE_BANNER', 'SUCCESS');
    return { success: true };
  }

  // ==========================================
  // BULK UPLOAD EXCEL
  // ==========================================

  async generateBulkUploadTemplate() {
    const ExcelJS = require('exceljs');
    const { data: ongs } = await this.supabaseService
      .getClient()
      .from('organizaciones')
      .select('nombre')
      .eq('activa', true)
      .order('nombre');

    const ongNames = (ongs || []).map((o) => o.nombre);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Usuarios');

    // Configurar columnas
    sheet.columns = [
      { header: 'nombre', key: 'nombre', width: 20 },
      { header: 'apellido', key: 'apellido', width: 20 },
      { header: 'email', key: 'email', width: 30 },
      { header: 'dni', key: 'dni', width: 15 },
      { header: 'ong', key: 'ong', width: 30 },
      { header: 'telefono', key: 'telefono', width: 15 },
    ];

    // Dar algo de estilo al header
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF40A8AB' },
    };
    sheet.getRow(1).font.color = { argb: 'FFFFFFFF' };

    // Hoja oculta para lista de ONGs
    if (ongNames.length > 0) {
      const listSheet = workbook.addWorksheet('ONGs', { state: 'hidden' });
      ongNames.forEach((name: string, i: number) => {
        listSheet.getCell(`A${i + 1}`).value = name;
      });

      // Añadir validación de datos en la columna 'ong' (E)
      // Desde la fila 2 hasta la 1000
      for (let i = 2; i <= 1000; i++) {
        sheet.getCell(`E${i}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`ONGs!$A$1:$A$${ongNames.length}`],
          showErrorMessage: true,
          errorTitle: 'ONG Inválida',
          error: 'Por favor selecciona una ONG válida de la lista.',
        };
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  async processBulkUpload(adminId: string, fileBuffer: Buffer) {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);
    const sheet = workbook.getWorksheet(1);

    if (!sheet) {
      throw new BadRequestException('El archivo Excel no tiene hojas válidas');
    }

    const headers: string[] = [];
    const rows: any[] = [];

    sheet.eachRow((row: any, rowNumber: number) => {
      if (rowNumber === 1) {
        row.eachCell((cell: any, colNumber: number) => {
          headers[colNumber] = cell.value?.toString().toLowerCase().trim();
        });
      } else {
        const rowData: any = {};
        row.eachCell(
          { includeEmpty: false },
          (cell: any, colNumber: number) => {
            const header = headers[colNumber];
            if (header) {
              rowData[header] = cell.value?.toString().trim();
            }
          },
        );
        if (rowData.email || rowData.dni) {
          rows.push(rowData);
        }
      }
    });

    if (rows.length === 0) {
      throw new BadRequestException('El archivo no contiene datos de usuarios');
    }

    // Procesar asíncronamente
    this.processUsersAsync(adminId, rows).catch((e) =>
      this.logger.error('Background bulk upload error', e),
    );

    return {
      success: true,
      message: `Archivo recibido correctamente. Se procesarán ${rows.length} usuarios en segundo plano.`,
    };
  }

  private async processUsersAsync(adminId: string, rows: any[]) {
    try {
      const client = this.supabaseService.getClient();
      const { data: ongs } = await client
        .from('organizaciones')
        .select('id, nombre');

      const ongMap = new Map();
      if (ongs) {
        for (const ong of ongs) {
          ongMap.set(ong.nombre.trim().toLowerCase(), ong.id);
        }
      }

      let successCount = 0;
      let errorCount = 0;
      const errors: any[] = [];

      for (const row of rows) {
        try {
          const { nombre, apellido, email, dni, ong, telefono } = row;

          if (!email || !dni || !nombre || !apellido || !ong) {
            throw new Error('Faltan campos obligatorios en la fila');
          }

          const ongNameLower = ong.toLowerCase();
          const orgId = ongMap.get(ongNameLower);

          if (!orgId) {
            throw new Error(`La ONG "${ong}" no fue encontrada.`);
          }

          // Verificar si usuario ya existe
          let userId;
          const { data: existingUser } = await client
            .from('usuarios')
            .select('id')
            .eq('email', email)
            .maybeSingle();

          if (existingUser) {
            userId = existingUser.id;
            // Opcional: actualizar el DNI u otros datos si se quiere
          } else {
            const { data: newUser, error: createError } = await client
              .from('usuarios')
              .insert({
                nombre: `${nombre} ${apellido}`.trim(),
                email: email.toLowerCase(),
                dni,
                telefono,
                is_active: true,
              })
              .select('id')
              .single();

            if (createError)
              throw new Error('Error local: ' + createError.message);
            userId = newUser.id;
          }

          // Bonda Integración
          const { data: bondaMicrosite } = await client
            .from('bonda_microsites')
            .select('*')
            .eq('organizacion_id', orgId)
            .maybeSingle();

          if (bondaMicrosite && bondaMicrosite.api_token_nominas) {
            const payload = {
              code: dni,
              email,
              nombre,
              apellido,
              telefono,
              send_welcome_email: true,
            };

            try {
              const res = await this.bondaService.crearAfiliado(payload, {
                organizacionId: orgId,
              });
              if (
                (res as any)?.error &&
                (res as any).error.code !== 'HttpPublicResponseException'
              ) {
                this.logger.warn(`Bonda bulk upload issue for ${email}:`, res);
              }
            } catch (bondaError: any) {
              this.logger.error(
                `Bonda error in bulk upload for ${email}`,
                bondaError.message,
              );
            }

            await client.from('usuarios_bonda_afiliados').upsert(
              {
                user_id: userId,
                bonda_microsite_id: bondaMicrosite.id,
                affiliate_code: dni,
                is_active: true,
              },
              { onConflict: 'user_id, bonda_microsite_id' },
            );
          }

          successCount++;
        } catch (error: any) {
          errorCount++;
          errors.push({ rowData: row, error: error.message });
        }
      }

      await this.logAudit(
        adminId,
        'BULK_UPLOAD',
        'BULK_UPLOAD_COMPLETED',
        'SUCCESS',
        {
          successCount,
          errorCount,
          errors,
        },
      );

      this.logger.log(
        `Bulk upload finished: ${successCount} success, ${errorCount} errors`,
      );
    } catch (e: any) {
      this.logger.error('Fatal error in processUsersAsync:', e);
      await this.logAudit(
        adminId,
        'BULK_UPLOAD',
        'BULK_UPLOAD_FAILED',
        'ERROR',
        { error: e.message },
      );
    }
  }
}

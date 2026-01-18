import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private supabaseClient: SupabaseClient;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const supabaseUrl = this.configService.get<string>('supabase.url');
    const supabaseServiceKey = this.configService.get<string>(
      'supabase.serviceRoleKey',
    );

    if (!supabaseUrl || !supabaseServiceKey) {
      this.logger.warn(
        '⚠️ Supabase credentials not configured. Some features may not work.',
      );
      return;
    }

    this.supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    this.logger.log('✅ Supabase client initialized successfully');
  }

  /**
   * Obtiene el cliente de Supabase
   * IMPORTANTE: Este cliente usa el service_role_key con permisos completos
   */
  getClient(): SupabaseClient {
    if (!this.supabaseClient) {
      throw new Error('Supabase client not initialized');
    }
    return this.supabaseClient;
  }

  /**
   * Acceso directo a una tabla
   * @param table Nombre de la tabla
   */
  from(table: string) {
    return this.getClient().from(table);
  }

  // ========================================
  // MÉTODOS DE CONVENIENCIA PARA USUARIOS
  // ========================================

  /**
   * Buscar un usuario por email
   */
  async findUserByEmail(email: string) {
    const { data, error } = await this.from('usuarios')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      this.logger.error('Error al buscar usuario por email:', error);
      throw error;
    }

    return data;
  }

  /**
   * Buscar un usuario por código de afiliado de Bonda
   */
  async findUserByBondaCode(bondaCode: string) {
    const { data, error } = await this.from('usuarios')
      .select('*')
      .eq('bonda_affiliate_code', bondaCode)
      .single();

    if (error && error.code !== 'PGRST116') {
      this.logger.error('Error al buscar usuario por bonda_code:', error);
      throw error;
    }

    return data;
  }

  /**
   * Crear un nuevo usuario
   */
  async createUser(userData: {
    nombre: string;
    email: string;
    telefono?: string;
    provincia?: string;
    localidad?: string;
    password_hash?: string;
    bonda_affiliate_code: string;
  }) {
    const { data, error } = await this.from('usuarios')
      .insert({
        ...userData,
        bonda_sync_status: 'pending',
      })
      .select()
      .single();

    if (error) {
      this.logger.error('Error al crear usuario:', error);
      throw error;
    }

    this.logger.log(`✅ Usuario creado: ${data.email}`);
    return data;
  }

  /**
   * Actualizar estado de sincronización con Bonda
   */
  async updateBondaSyncStatus(
    userId: string,
    status: 'pending' | 'synced' | 'error',
  ) {
    const updateData: any = {
      bonda_sync_status: status,
    };

    if (status === 'synced') {
      updateData.bonda_synced_at = new Date().toISOString();
    }

    const { data, error } = await this.from('usuarios')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      this.logger.error('Error al actualizar sync status:', error);
      throw error;
    }

    return data;
  }

  // ========================================
  // MÉTODOS PARA LOGS DE SINCRONIZACIÓN
  // ========================================

  /**
   * Registrar una operación con Bonda
   */
  async logBondaOperation(logData: {
    usuario_id?: string;
    operacion: string;
    endpoint?: string;
    request_data?: any;
    response_data?: any;
    exitoso: boolean;
    error_message?: string;
    http_status_code?: number;
  }) {
    const { error } = await this.from('logs_sync_bonda').insert(logData);

    if (error) {
      this.logger.error('Error al registrar log de Bonda:', error);
    }
  }

  // ========================================
  // MÉTODOS PARA DONACIONES
  // ========================================

  /**
   * Crear una donación
   */
  async createDonacion(donacionData: {
    usuario_id: string;
    monto: number;
    moneda?: string;
    metodo_pago?: string;
    organizacion_id?: string;
    organizacion_nombre?: string;
  }) {
    const { data, error } = await this.from('donaciones')
      .insert({
        ...donacionData,
        estado: 'pendiente',
      })
      .select()
      .single();

    if (error) {
      this.logger.error('Error al crear donación:', error);
      throw error;
    }

    this.logger.log(`✅ Donación creada: $${data.monto} ${data.moneda}`);
    return data;
  }

  // ========================================
  // MÉTODOS PARA ORGANIZACIONES
  // ========================================

  /**
   * Obtener organizaciones activas
   */
  async getOrganizacionesActivas() {
    const { data, error } = await this.from('organizaciones')
      .select('*')
      .eq('activa', true)
      .order('nombre', { ascending: true });

    if (error) {
      this.logger.error('Error al obtener organizaciones:', error);
      throw error;
    }

    return data;
  }
}

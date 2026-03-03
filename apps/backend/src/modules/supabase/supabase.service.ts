import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private supabaseClient: SupabaseClient;

  constructor(private readonly configService: ConfigService) { }

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
   * Buscar un usuario por código de afiliado de Bonda (tabla usuarios_bonda_afiliados)
   */
  async findUserByBondaCode(bondaCode: string) {
    const { data: afiliado, error: errAfiliado } = await this.from(
      'usuarios_bonda_afiliados',
    )
      .select('user_id')
      .eq('affiliate_code', bondaCode)
      .maybeSingle();

    if (errAfiliado) {
      this.logger.error('Error al buscar afiliado por código:', errAfiliado);
      throw errAfiliado;
    }
    if (!afiliado?.user_id) return null;

    const { data: usuario, error } = await this.from('usuarios')
      .select('*')
      .eq('id', afiliado.user_id)
      .single();

    if (error && error.code !== 'PGRST116') {
      this.logger.error('Error al buscar usuario por bonda_code:', error);
      throw error;
    }
    return usuario;
  }

  /**
   * Actualizar datos de perfil del usuario (sin DNI ni password_hash)
   */
  async updateUserProfile(
    userId: string,
    data: {
      nombre?: string;
      email?: string;
      telefono?: string;
      provincia?: string;
      localidad?: string;
    },
  ) {
    const { data: updated, error } = await this.from('usuarios')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      this.logger.error('Error al actualizar perfil:', error);
      throw error;
    }

    return updated;
  }

  /**
   * Actualizar el hash de contraseña del usuario
   */
  async updateUserPassword(userId: string, passwordHash: string) {
    const { error } = await this.from('usuarios')
      .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      this.logger.error('Error al actualizar contraseña:', error);
      throw error;
    }
  }

  /**
   * Crear un nuevo usuario (sin códigos Bonda; se asignan por ONG tras el pago)
   */
  async createUser(userData: {
    nombre: string;
    email: string;
    telefono?: string;
    dni?: string;
    provincia?: string;
    localidad?: string;
    password_hash?: string;
  }) {
    const { data, error } = await this.from('usuarios')
      .insert(userData)
      .select()
      .single();

    if (error) {
      this.logger.error('Error al crear usuario:', error);
      throw error;
    }

    this.logger.log(`✅ Usuario creado: ${data.email}`);
    return data;
  }

  // ========================================
  // USUARIOS_BONDA_AFILIADOS (afiliado por micrositio/ONG)
  // ========================================

  /**
   * Obtener el affiliate_code del usuario para un micrositio Bonda.
   * Devuelve null si aún no tiene afiliado en ese micrositio.
   */
  async getAffiliateForUserAndMicrosite(
    userId: string,
    bondaMicrositeId: string,
  ): Promise<{ affiliate_code: string } | null> {
    const { data, error } = await this.from('usuarios_bonda_afiliados')
      .select('affiliate_code')
      .eq('user_id', userId)
      .eq('bonda_microsite_id', bondaMicrositeId)
      .maybeSingle();

    if (error) {
      this.logger.error('Error al obtener afiliado usuario+micrositio:', error);
      throw error;
    }
    return data ? { affiliate_code: data.affiliate_code } : null;
  }

  /**
   * Crear o ignorar afiliado (user_id + bonda_microsite_id + affiliate_code).
   * Idempotente: si ya existe la fila para (user_id, bonda_microsite_id), no sobrescribe.
   */
  async upsertAffiliateForUser(
    userId: string,
    bondaMicrositeId: string,
    affiliateCode: string,
  ) {
    const { data, error } = await this.from('usuarios_bonda_afiliados')
      .upsert(
        {
          user_id: userId,
          bonda_microsite_id: bondaMicrositeId,
          affiliate_code: affiliateCode,
        },
        {
          onConflict: 'user_id,bonda_microsite_id',
          ignoreDuplicates: true,
        },
      )
      .select()
      .maybeSingle();

    if (error) {
      this.logger.error(
        'Error al insertar afiliado usuario+micrositio:',
        error,
      );
      throw error;
    }
    this.logger.log(
      `✅ Afiliado registrado: user=${userId} microsite=${bondaMicrositeId} code=${affiliateCode}`,
    );
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
   * Buscar un usuario por ID
   */
  async findUserById(userId: string) {
    const { data, error } = await this.from('usuarios')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      this.logger.error('Error al buscar usuario por id:', error);
      throw error;
    }
    return data;
  }

  // ========================================
  // PAYMENT_ATTEMPTS (intentos de pago Fiserv)
  // ========================================

  /**
   * Crear un intento de pago (Fiserv). order_id debe enviarse como oid/merchantTransactionId a Connect.
   */
  async createPaymentAttempt(data: {
    user_id: string;
    order_id: string;
    store_id: string;
    amount: number;
    currency: string;
    organizacion_id?: string;
    installments?: number;
  }) {
    const { data: row, error } = await this.from('payment_attempts')
      .insert({
        user_id: data.user_id,
        order_id: data.order_id,
        store_id: data.store_id,
        amount: data.amount,
        currency: data.currency,
        organizacion_id: data.organizacion_id ?? null,
        installments: data.installments ?? 1,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      this.logger.error('Error al crear payment_attempt:', error);
      throw error;
    }
    this.logger.log(`✅ Payment attempt creado: order_id=${data.order_id}`);
    return row;
  }

  /**
   * Buscar intento de pago por order_id (oid enviado a Fiserv).
   */
  async getPaymentAttemptByOrderId(orderId: string) {
    const { data, error } = await this.from('payment_attempts')
      .select('*')
      .eq('order_id', orderId)
      .maybeSingle();

    if (error) {
      this.logger.error('Error al buscar payment_attempt por order_id:', error);
      throw error;
    }
    return data;
  }

  /**
   * Actualizar estado y respuesta raw de un intento de pago.
   */
  async updatePaymentAttempt(
    id: string,
    updates: { status: string; fiserv_raw_response?: object },
  ) {
    const { data, error } = await this.from('payment_attempts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error('Error al actualizar payment_attempt:', error);
      throw error;
    }
    return data;
  }

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
    estado?: string;
    payment_id?: string;
    payment_status?: string;
  }) {
    const { data, error } = await this.from('donaciones')
      .insert({
        ...donacionData,
        estado: donacionData.estado ?? 'pendiente',
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
   * Indica si el usuario tiene al menos una donación completada.
   * Usar para decidir si mostrar códigos en cupones Bonda (Estado 3) o filtrarlos (Estado 2).
   */
  async hasUserPaid(userId: string): Promise<boolean> {
    const { data, error } = await this.from('donaciones')
      .select('id')
      .eq('usuario_id', userId)
      .eq('estado', 'completada')
      .limit(1);

    if (error) {
      this.logger.error('Error al verificar donaciones del usuario:', error);
      return false;
    }

    return Array.isArray(data) && data.length > 0;
  }

  /**
   * [DEPRECADO] Obtener cupones desde tabla local public_coupons.
   * 
   * ⚠️ Este método ya no se usa. Los cupones ahora se obtienen directamente
   * de Bonda API en tiempo real a través de /public/cupones-bonda
   * 
   * La tabla public_coupons se mantiene para sincronizaciones programadas
   * pero NO se usa en el flujo principal del frontend.
   */
  async getPublicCoupons() {
    const { data, error } = await this.from('public_coupons')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true });

    if (error) {
      this.logger.error('Error al obtener cupones públicos:', error);
      throw error;
    }

    return data;
  }

  /**
   * Obtener una organización por ID (incluye monto_minimo, monto_sugerido).
   */
  async getOrganizacionById(organizacionId: string): Promise<{
    id: string;
    nombre: string;
    monto_minimo: number | null;
    monto_sugerido: number | null;
    [key: string]: unknown;
  } | null> {
    const { data, error } = await this.from('organizaciones')
      .select('*')
      .eq('id', organizacionId)
      .maybeSingle();

    if (error) {
      this.logger.error('Error al obtener organizacion por id:', error);
      throw error;
    }
    return data;
  }

  /**
   * Obtener organizaciones activas (incluye monto_minimo, monto_sugerido).
   */
  async getOrganizacionesActivas() {
    // Obtener organizaciones con micrositios de Bonda activos
    // Esto muestra las ONGs que tienen APIs de Bonda configuradas
    const { data, error } = await this.from('bonda_microsites')
      .select(
        `
        id,
        nombre,
        slug,
        organizacion_id,
        organizaciones (
          id,
          nombre,
          descripcion,
          logo_url,
          website_url,
          email,
          telefono,
          direccion,
          monto_minimo,
          monto_sugerido,
          verificada,
          created_at,
          updated_at
        )
      `,
      )
      .eq('activo', true)
      .order('nombre', { ascending: true });

    if (error) {
      this.logger.error('Error al obtener organizaciones con Bonda:', error);
      throw error;
    }

    // Mapear los datos para retornar en el formato esperado
    return data.map((microsite: any) => {
      // Type assertion para el JOIN (Supabase retorna objeto, no array)
      const org = microsite.organizaciones;

      return {
        id: microsite.organizacion_id || microsite.id,
        bonda_microsite_id: microsite.id,
        nombre: org?.nombre || microsite.nombre,
        descripcion:
          org?.descripcion || `Micrositio Bonda: ${microsite.nombre}`,
        logo_url: org?.logo_url || null,
        website_url: org?.website_url || null,
        email: org?.email || null,
        telefono: org?.telefono || null,
        direccion: org?.direccion || null,
        monto_minimo: org?.monto_minimo || 5000,
        monto_sugerido: org?.monto_sugerido || 10000,
        slug: microsite.slug,
        activa: true,
        verificada: org?.verificada || false,
        created_at: org?.created_at || new Date().toISOString(),
        updated_at: org?.updated_at || new Date().toISOString(),
      };
    });
  }

  // ========================================
  // CONFIG BONDA (bonda_microsites)
  // ========================================

  /**
   * Obtener config de Bonda por slug del micrositio.
   * Usar para resolver token + microsite_id al llamar a la API de Bonda.
   */
  async getBondaMicrositeBySlug(slug: string): Promise<{
    id: string;
    slug: string;
    nombre: string;
    api_token: string;
    api_token_nominas: string | null;
    microsite_id: string | null;
    organizacion_id: string | null;
    activo: boolean;
  } | null> {
    const { data, error } = await this.from('bonda_microsites')
      .select(
        'id, slug, nombre, api_token, api_token_nominas, microsite_id, organizacion_id, activo',
      )
      .eq('slug', slug)
      .eq('activo', true)
      .maybeSingle();

    if (error) {
      this.logger.error('Error al obtener bonda_microsite por slug:', error);
      throw error;
    }

    return data;
  }

  /**
   * Obtener config de Bonda por organizacion_id.
   */
  async getBondaMicrositeByOrganizacionId(organizacionId: string): Promise<{
    id: string;
    slug: string;
    nombre: string;
    api_token: string;
    api_token_nominas: string | null;
    microsite_id: string | null;
    organizacion_id: string | null;
    activo: boolean;
  } | null> {
    const { data, error } = await this.from('bonda_microsites')
      .select(
        'id, slug, nombre, api_token, api_token_nominas, microsite_id, organizacion_id, activo',
      )
      .eq('organizacion_id', organizacionId)
      .eq('activo', true)
      .maybeSingle();

    if (error) {
      this.logger.error(
        'Error al obtener bonda_microsite por organizacion_id:',
        error,
      );
      throw error;
    }

    return data;
  }

  /**
   * Obtener el siguiente micrositio para sync round-robin.
   * Selecciona el micrositio activo con last_synced_at más antiguo (o NULL si nunca fue sincronizado).
   * Esto asegura rotación equitativa entre micrositios.
   */
  async getNextMicrositeForSync(): Promise<{
    id: string;
    slug: string;
    nombre: string;
    api_token: string;
    api_token_nominas: string | null;
    microsite_id: string | null;
    organizacion_id: string | null;
    last_synced_at: string | null;
  } | null> {
    const { data, error } = await this.from('bonda_microsites')
      .select(
        'id, slug, nombre, api_token, api_token_nominas, microsite_id, organizacion_id, last_synced_at',
      )
      .eq('activo', true)
      .order('last_synced_at', { ascending: true, nullsFirst: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      this.logger.error(
        'Error al obtener siguiente micrositio para sync:',
        error,
      );
      throw error;
    }

    return data;
  }

  /**
   * Actualizar last_synced_at de un micrositio a NOW().
   * Llamar después de un sync exitoso para marcar que ya fue procesado.
   */
  async updateMicrositeLastSynced(micrositeId: string): Promise<void> {
    const { error } = await this.from('bonda_microsites')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', micrositeId);

    if (error) {
      this.logger.error(
        'Error al actualizar last_synced_at del micrositio:',
        error,
      );
      throw error;
    }

    this.logger.log(`✅ Micrositio ${micrositeId} marcado como sincronizado`);
  }

  // ========================================
  // CUPONES SOLICITADOS POR USUARIO (Dashboard)
  // ========================================

  /**
   * Guardar un cupón solicitado por el usuario (con código visible)
   */
  async guardarCuponSolicitado(cuponData: {
    usuario_id: string;
    bonda_cupon_id: string;
    nombre: string;
    descuento: string;
    empresa_nombre: string;
    empresa_id?: string;
    codigo?: string;
    codigo_id?: string;
    codigo_afiliado: string;
    micrositio_slug?: string;
    bonda_microsite_id?: string;
    mensaje?: string;
    operadora?: string;
    celular?: string;
    imagen_thumbnail?: string;
    imagen_principal?: string;
    imagen_apaisada?: string;
    expires_at?: string;
    bonda_raw_data?: any;
  }) {
    const { data, error } = await this.from('usuario_cupones_solicitados')
      .insert({
        usuario_id: cuponData.usuario_id,
        bonda_cupon_id: cuponData.bonda_cupon_id,
        nombre: cuponData.nombre,
        descuento: cuponData.descuento,
        empresa_nombre: cuponData.empresa_nombre,
        empresa_id: cuponData.empresa_id,
        codigo: cuponData.codigo,
        codigo_id: cuponData.codigo_id,
        codigo_afiliado: cuponData.codigo_afiliado,
        micrositio_slug: cuponData.micrositio_slug,
        bonda_microsite_id: cuponData.bonda_microsite_id,
        estado: 'activo',
        mensaje: cuponData.mensaje,
        operadora: cuponData.operadora,
        celular: cuponData.celular,
        imagen_thumbnail: cuponData.imagen_thumbnail,
        imagen_principal: cuponData.imagen_principal,
        imagen_apaisada: cuponData.imagen_apaisada,
        expires_at: cuponData.expires_at,
        bonda_raw_data: cuponData.bonda_raw_data,
      })
      .select()
      .single();

    if (error) {
      this.logger.error('Error al guardar cupón solicitado:', error);
      throw error;
    }

    this.logger.log(
      `✅ Cupón solicitado guardado: ${cuponData.nombre} para usuario ${cuponData.usuario_id}`,
    );
    return data;
  }

  /**
   * Verificar si el usuario puede solicitar un cupón (sin duplicados activos)
   */
  async puedeSolicitarCupon(
    usuarioId: string,
    bondaCuponId: string,
  ): Promise<boolean> {
    const { data } = await this.getClient().rpc('puede_solicitar_cupon', {
      p_usuario_id: usuarioId,
      p_bonda_cupon_id: bondaCuponId,
    });

    return data === true;
  }

  /**
   * Obtener cupones activos del usuario
   */
  async getCuponesActivosUsuario(usuarioId: string) {
    const { data, error } = await this.from('usuario_cupones_solicitados')
      .select('*')
      .eq('usuario_id', usuarioId)
      .eq('estado', 'activo')
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error('Error al obtener cupones activos del usuario:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Obtener historial completo de cupones del usuario con paginación
   */
  async getHistorialCuponesUsuario(
    usuarioId: string,
    opciones: {
      pagina?: number;
      limite?: number;
      estado?: 'activo' | 'usado' | 'vencido' | 'cancelado' | 'todos';
    } = {},
  ) {
    const pagina = opciones.pagina || 1;
    const limite = opciones.limite || 20;
    const offset = (pagina - 1) * limite;

    let query = this.from('usuario_cupones_solicitados')
      .select('*', { count: 'exact' })
      .eq('usuario_id', usuarioId);

    // Filtrar por estado si no es 'todos'
    if (opciones.estado && opciones.estado !== 'todos') {
      query = query.eq('estado', opciones.estado);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limite - 1);

    if (error) {
      this.logger.error(
        'Error al obtener historial de cupones del usuario:',
        error,
      );
      throw error;
    }

    return {
      cupones: data || [],
      total: count || 0,
      pagina,
      limite,
      totalPaginas: Math.ceil((count || 0) / limite),
    };
  }

  /**
   * Obtener estadísticas de cupones del usuario
   */
  async getEstadisticasCuponesUsuario(usuarioId: string) {
    const { data, error } = await this.from('usuario_estadisticas_cupones')
      .select('*')
      .eq('usuario_id', usuarioId)
      .maybeSingle();

    if (error) {
      this.logger.error(
        'Error al obtener estadísticas de cupones del usuario:',
        error,
      );
      // Si no existe, devolver estadísticas vacías
      return {
        cupones_activos: 0,
        cupones_usados: 0,
        total_cupones_solicitados: 0,
        ultimo_cupon_solicitado: null,
      };
    }

    return (
      data || {
        cupones_activos: 0,
        cupones_usados: 0,
        total_cupones_solicitados: 0,
        ultimo_cupon_solicitado: null,
      }
    );
  }

  /**
   * Marcar un cupón como usado
   */
  async marcarCuponComoUsado(cuponId: string, usuarioId: string) {
    const { data } = await this.getClient().rpc('marcar_cupon_como_usado', {
      p_cupon_id: cuponId,
      p_usuario_id: usuarioId,
    });

    if (!data) {
      throw new Error('No se pudo marcar el cupón como usado');
    }

    this.logger.log(`✅ Cupón ${cuponId} marcado como usado`);
    return true;
  }

  /**
   * Obtener total donado por el usuario
   */
  async getTotalDonadoUsuario(usuarioId: string): Promise<number> {
    const { data, error } = await this.from('donaciones')
      .select('monto')
      .eq('usuario_id', usuarioId)
      .eq('estado', 'completada');

    if (error) {
      this.logger.error('Error al obtener total donado:', error);
      return 0;
    }

    if (!data || data.length === 0) return 0;

    return data.reduce((sum, d) => sum + Number(d.monto), 0);
  }

  /**
   * Obtener fundaciones/micrositios a los que el usuario ha donado
   */
  async getFundacionesUsuario(usuarioId: string) {
    const { data, error } = await this.from('usuarios_bonda_afiliados')
      .select(`
        affiliate_code,
        created_at,
        bonda_microsite_id,
        bonda_microsites (
          id,
          nombre,
          slug
        )
      `)
      .eq('user_id', usuarioId);

    if (error) {
      this.logger.error('Error al obtener fundaciones del usuario:', error);
      throw error;
    }

    return (data || []).map((row: any) => ({
      affiliate_code: row.affiliate_code,
      created_at: row.created_at,
      bonda_microsite_id: row.bonda_microsites.id,
      micrositio_nombre: row.bonda_microsites.nombre,
      micrositio_slug: row.bonda_microsites.slug,
    }));
  }

  /**
   * Obtener código de afiliado de un usuario para un micrositio específico
   */
  async getAffiliateBondaByUser(usuarioId: string, bondaMicrositeId: string) {
    const { data, error } = await this.from('usuarios_bonda_afiliados')
      .select('*')
      .eq('user_id', usuarioId)
      .eq('bonda_microsite_id', bondaMicrositeId)
      .maybeSingle();

    if (error) {
      this.logger.error('Error al obtener código de afiliado:', error);
      throw error;
    }

    return data;
  }

  /**
   * Obtener IDs de micrositios (ONGs) a los que el usuario tiene acceso
   * Basado en las donaciones completadas del usuario
   */
  async getMicrositiosUsuario(usuarioId: string): Promise<string[]> {
    // Obtener organizaciones a las que el usuario ha donado
    const { data: donaciones, error: donacionesError } = await this.from('donaciones')
      .select('organizacion_id')
      .eq('usuario_id', usuarioId)
      .eq('estado', 'completada')
      .not('organizacion_id', 'is', null);

    if (donacionesError) {
      this.logger.error('Error al obtener donaciones del usuario:', donacionesError);
      throw donacionesError;
    }

    // Si no tiene donaciones, devolver array vacío
    if (!donaciones || donaciones.length === 0) {
      return [];
    }

    // Extraer IDs únicos de organizaciones
    const organizacionIds = [...new Set(donaciones.map(d => d.organizacion_id))];

    // Obtener micrositios de esas organizaciones
    const { data: micrositios, error: micrositiosError } = await this.from('bonda_microsites')
      .select('id')
      .in('organizacion_id', organizacionIds)
      .eq('activo', true);

    if (micrositiosError) {
      this.logger.error('Error al obtener micrositios:', micrositiosError);
      throw micrositiosError;
    }

    return (micrositios || []).map(m => m.id);
  }

  // ========================================
  // PUBLIC_COUPONS_V2 (Sincronización desde Bonda)
  // ========================================

  /**
   * Obtener cupones públicos desde public_coupons_v2 con filtros
   */
  async getPublicCouponsV2(opciones: {
    categoria?: string;
    busqueda?: string;
    limite?: number;
    offset?: number;
    soloActivos?: boolean;
    micrositeIds?: string[];
  } = {}) {
    let query = this.from('public_coupons_v2').select('*', { count: 'exact' });

    // Filtrar solo activos por defecto
    if (opciones.soloActivos !== false) {
      query = query.eq('activo', true);
    }

    // Filtrar por micrositios específicos (ONGs del usuario)
    if (opciones.micrositeIds && opciones.micrositeIds.length > 0) {
      query = query.in('bonda_microsite_id', opciones.micrositeIds);
    }

    // Filtrar por categoría principal
    if (opciones.categoria && opciones.categoria !== 'Todo') {
      query = query.eq('categoria_principal', opciones.categoria);
    }

    // Búsqueda por texto en nombre o empresa
    if (opciones.busqueda) {
      query = query.or(
        `nombre.ilike.%${opciones.busqueda}%,empresa_nombre.ilike.%${opciones.busqueda}%`,
      );
    }

    // Filtrar cupones no vencidos
    query = query.or(`fecha_vencimiento.is.null,fecha_vencimiento.gte.${new Date().toISOString()}`);

    // Ordenar por fecha de sincronización (más recientes primero)
    query = query.order('synced_at', { ascending: false });

    // Paginación
    if (opciones.limite) {
      const offset = opciones.offset || 0;
      query = query.range(offset, offset + opciones.limite - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      this.logger.error('Error al obtener cupones públicos v2:', error);
      throw error;
    }

    return {
      cupones: data || [],
      total: count || 0,
    };
  }

  /**
   * Insertar o actualizar cupones en public_coupons_v2 (upsert por bonda_cupon_id)
   */
  async upsertPublicCouponsV2(cupones: Array<{
    bonda_cupon_id: string;
    bonda_microsite_id?: string;
    nombre: string;
    descuento?: string;
    descripcion_breve?: string;
    empresa_nombre?: string;
    empresa_id?: string;
    empresa_logo_url?: string;
    empresa_data?: object;
    imagen_principal_url?: string;
    imagen_thumbnail_url?: string;
    imagenes?: object;
    descripcion_micrositio?: string;
    usage_instructions?: string;
    legales?: string;
    categorias?: object;
    categoria_principal?: string;
    fecha_vencimiento?: string;
    activo?: boolean;
    usar_en?: object;
    permitir_sms?: boolean;
    orden?: number;
  }>) {
    if (!cupones || cupones.length === 0) {
      this.logger.warn('No hay cupones para insertar en public_coupons_v2');
      return { count: 0 };
    }

    // Agregar timestamp de sincronización
    const cuponesConTimestamp = cupones.map((cupon) => ({
      ...cupon,
      synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      activo: cupon.activo !== false, // Por defecto true
    }));

    const { data, error } = await this.from('public_coupons_v2')
      .upsert(cuponesConTimestamp, {
        onConflict: 'bonda_cupon_id',
        ignoreDuplicates: false, // Actualizar si ya existe
      })
      .select();

    if (error) {
      this.logger.error('Error al insertar cupones en public_coupons_v2:', error);
      throw error;
    }

    this.logger.log(`✅ ${data?.length || 0} cupones sincronizados en public_coupons_v2`);
    return { count: data?.length || 0 };
  }

  /**
   * Eliminar cupones antiguos/vencidos de public_coupons_v2
   */
  async limpiarCuponesVencidosV2(): Promise<number> {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 7); // Eliminar vencidos hace más de 7 días

    const { data, error } = await this.from('public_coupons_v2')
      .delete()
      .lt('fecha_vencimiento', fechaLimite.toISOString())
      .select();

    if (error) {
      this.logger.error('Error al limpiar cupones vencidos:', error);
      throw error;
    }

    const count = data?.length || 0;
    if (count > 0) {
      this.logger.log(`✅ ${count} cupones vencidos eliminados de public_coupons_v2`);
    }
    return count;
  }

  /**
   * Obtener estadísticas de public_coupons_v2
   */
  async getEstadisticasCuponesV2() {
    const { count: totalActivos } = await this.from('public_coupons_v2')
      .select('*', { count: 'exact', head: true })
      .eq('activo', true);

    const { count: totalVencidos } = await this.from('public_coupons_v2')
      .select('*', { count: 'exact', head: true })
      .lt('fecha_vencimiento', new Date().toISOString());

    const { data: ultimoSync } = await this.from('public_coupons_v2')
      .select('synced_at')
      .order('synced_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      total_activos: totalActivos || 0,
      total_vencidos: totalVencidos || 0,
      ultima_sincronizacion: ultimoSync?.synced_at || null,
    };
  }
}

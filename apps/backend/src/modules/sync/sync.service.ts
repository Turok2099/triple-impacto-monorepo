import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BondaService } from '../bonda/bonda.service';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly bondaService: BondaService,
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Sincronizar todos los cupones desde Bonda API a Supabase
   * Hace llamadas paginadas hasta obtener todos los cupones disponibles
   */
  async sincronizarCuponesDesdeBonda(micrositeId?: string): Promise<{
    total_cupones: number;
    total_paginas: number;
    tiempo_total_ms: number;
    errores: string[];
  }> {
    const startTime = Date.now();
    const errores: string[] = [];
    let totalCupones = 0;
    let totalPaginas = 0;

    try {
      this.logger.log('🔄 Iniciando sincronización de cupones desde Bonda...');

      // Obtener micrositio para sincronizar
      let microsite: any;

      if (micrositeId) {
        const { data, error } = await this.supabaseService
          .from('bonda_microsites')
          .select('*')
          .eq('id', micrositeId)
          .eq('activo', true)
          .single();

        if (error || !data) {
          throw new Error(
            `No se encontró el micrositio con id: ${micrositeId}`,
          );
        }
        microsite = data;
      } else {
        microsite = await this.supabaseService.getNextMicrositeForSync();
      }

      if (!microsite) {
        throw new Error('No hay micrositios activos para sincronizar');
      }

      this.logger.log(
        `📡 Sincronizando micrositio: ${microsite.nombre} (${microsite.slug})`,
      );

      // Configuración de Bonda para este micrositio
      const codigoAfiliado =
        this.configService.get<string>('BONDA_CODIGO_AFILIADO') || '';

      // Primera llamada para saber cuántos cupones hay en total
      this.logger.log('📥 Obteniendo primera página...');
      let paginaActual = 1;
      let hayMasPaginas = true;
      const todosCupones: any[] = [];

      while (hayMasPaginas) {
        try {
          // Llamar a Bonda API con paginación
          const response = await this.bondaService.obtenerCupones(
            codigoAfiliado,
            {
              slug: microsite.slug,
              subcategories: true,
              orderBy: 'relevant',
              page: paginaActual, // IMPORTANTE: Pasar número de página
            },
          );

          this.logger.log(
            `📄 Página ${paginaActual}: ${response.cupones.length} cupones`,
          );

          // Agregar cupones de esta página
          todosCupones.push(...response.cupones);
          totalPaginas++;

          // Verificar si hay más páginas usando el campo "next" de la respuesta
          // Si next existe y no es null, hay más páginas
          hayMasPaginas = !!response.next;

          if (hayMasPaginas) {
            paginaActual++;
          }

          // Delay entre requests para no saturar el API
          if (hayMasPaginas) {
            await this.delay(500); // 500ms entre llamadas
          }
        } catch (error) {
          this.logger.error(
            `❌ Error en página ${paginaActual}: ${error.message}`,
          );
          errores.push(`Página ${paginaActual}: ${error.message}`);
          break; // Salir del loop si hay un error
        }
      }

      totalCupones = todosCupones.length;
      this.logger.log(`✅ Total de cupones obtenidos: ${totalCupones}`);

      // Mapeo de IDs de categorías padre a nombres de categorías principales
      const CATEGORIAS_PRINCIPALES_MAP: Record<string, string> = {
        '13': 'Compras',
        '12': 'Gastronomía',
        '6': 'Indumentaria, Calzado y Moda',
        '14': 'Educación',
        '8': 'Servicios',
        '11': 'Turismo',
        '16': 'Gimnasios y Deportes',
        '7': 'Belleza y Salud',
        '17': 'Entretenimientos',
        '18': 'Motos',
        '19': 'Teatros',
        '20': 'Autos',
        '21': 'Cines',
        '22': 'Inmobiliarias',
        '23': 'Inmuebles',
      };

      // Transformar cupones a formato de Supabase
      const cuponesParaSupabase = todosCupones.map((cupon) => {
        // Determinar la categoría principal desde parent_id o el nombre de la categoría
        let categoriaPrincipal: string | null = null;
        if (cupon.categorias && cupon.categorias.length > 0) {
          const primeraCategoria = cupon.categorias[0];
          if (primeraCategoria.parent_id) {
            // Es una subcategoría, buscar el nombre de la categoría padre
            categoriaPrincipal =
              CATEGORIAS_PRINCIPALES_MAP[
                primeraCategoria.parent_id.toString()
              ] || null;
          } else {
            // Es una categoría principal
            categoriaPrincipal = primeraCategoria.nombre;
          }
        }

        // Si no se pudo determinar la categoría, intentar inferir por nombre/empresa
        if (!categoriaPrincipal) {
          const nombreLower = (cupon.nombre || '').toLowerCase();
          const empresaLower = (cupon.empresa?.nombre || '').toLowerCase();
          const descripcionLower = (cupon.descripcion || '').toLowerCase();
          const texto = `${nombreLower} ${empresaLower} ${descripcionLower}`;

          // Inferencias por palabras clave (ordenadas por especificidad)
          if (texto.includes('cine')) {
            categoriaPrincipal = 'Cines';
          } else if (texto.includes('teatro')) {
            categoriaPrincipal = 'Teatros';
          } else if (texto.includes('moto') || texto.includes('motocicleta')) {
            categoriaPrincipal = 'Motos';
          } else if (
            texto.includes('auto') ||
            texto.includes('automóvil') ||
            texto.includes('taller mecánico') ||
            texto.includes('lubricentro') ||
            texto.includes('lavadero')
          ) {
            categoriaPrincipal = 'Autos';
          } else if (texto.includes('inmobiliaria')) {
            categoriaPrincipal = 'Inmobiliarias';
          } else if (
            texto.includes('inmueble') ||
            texto.includes('departamento') ||
            texto.includes('alquiler') ||
            texto.includes('propiedad')
          ) {
            categoriaPrincipal = 'Inmuebles';
          } else if (
            texto.includes('restaurant') ||
            texto.includes('restaurante') ||
            texto.includes('comida') ||
            texto.includes('café') ||
            texto.includes('cafetería') ||
            texto.includes('parrilla') ||
            texto.includes('pizza') ||
            texto.includes('bar') ||
            texto.includes('gastronomía')
          ) {
            categoriaPrincipal = 'Gastronomía';
          } else if (
            texto.includes('gym') ||
            texto.includes('gimnasio') ||
            texto.includes('deporte') ||
            texto.includes('fitness') ||
            texto.includes('entrenamiento') ||
            texto.includes('crossfit')
          ) {
            categoriaPrincipal = 'Gimnasios y Deportes';
          } else if (
            texto.includes('viaje') ||
            texto.includes('hotel') ||
            texto.includes('turismo') ||
            texto.includes('hostel') ||
            texto.includes('hospedaje') ||
            texto.includes('alojamiento')
          ) {
            categoriaPrincipal = 'Turismo';
          } else if (
            texto.includes('spa') ||
            texto.includes('peluquería') ||
            texto.includes('salón') ||
            texto.includes('belleza') ||
            texto.includes('masaje') ||
            texto.includes('estética') ||
            texto.includes('salud') ||
            texto.includes('clínica')
          ) {
            categoriaPrincipal = 'Belleza y Salud';
          } else if (
            texto.includes('ropa') ||
            texto.includes('calzado') ||
            texto.includes('zapatilla') ||
            texto.includes('moda') ||
            texto.includes('fashion') ||
            texto.includes('jean') ||
            texto.includes('remera') ||
            texto.includes('indumentaria')
          ) {
            categoriaPrincipal = 'Indumentaria, Calzado y Moda';
          } else if (
            texto.includes('curso') ||
            texto.includes('escuela') ||
            texto.includes('instituto') ||
            texto.includes('capacitación') ||
            texto.includes('formación') ||
            texto.includes('educación') ||
            texto.includes('academia')
          ) {
            categoriaPrincipal = 'Educación';
          } else if (
            texto.includes('tienda') ||
            texto.includes('shop') ||
            texto.includes('comercio') ||
            texto.includes('compra')
          ) {
            categoriaPrincipal = 'Compras';
          }
        }

        return {
          bonda_cupon_id: cupon.id.toString(),
          bonda_microsite_id: microsite.id,
          nombre: cupon.nombre || '',
          descuento: cupon.descuento || null,
          descripcion_breve: cupon.descripcionBreve || null,
          empresa_nombre: cupon.empresa?.nombre || null,
          empresa_id: cupon.empresa?.id?.toString() || null,
          empresa_logo_url: cupon.empresa?.logoThumbnail?.['90x90'] || null,
          empresa_data: cupon.empresa || null,
          imagen_principal_url:
            cupon.imagenes?.principal?.['280x190'] ||
            cupon.imagenes?.principal?.original ||
            null,
          imagen_thumbnail_url:
            cupon.imagenes?.thumbnail?.['90x90'] ||
            cupon.imagenes?.thumbnail?.original ||
            null,
          imagenes: cupon.imagenes || null,
          descripcion_micrositio: cupon.descripcionMicrositio || null,
          usage_instructions: cupon.usageInstructions || null,
          legales: cupon.legales || null,
          categorias: cupon.categorias || null,
          categoria_principal: categoriaPrincipal || undefined,
          fecha_vencimiento: cupon.fechaVencimiento || null,
          activo: true,
          usar_en: cupon.usarEn || null,
          permitir_sms: cupon.permitirSms || false,
          orden: 0,
        };
      });

      // Insertar cupones en Supabase (upsert)
      this.logger.log('💾 Guardando cupones en Supabase...');
      const { count } =
        await this.supabaseService.upsertPublicCouponsV2(cuponesParaSupabase);

      // Actualizar timestamp de última sincronización del micrositio
      await this.supabaseService.updateMicrositeLastSynced(microsite.id);

      // Limpiar cupones vencidos antiguos
      await this.supabaseService.limpiarCuponesVencidosV2();

      const tiempoTotal = Date.now() - startTime;
      this.logger.log(
        `✅ Sincronización completada en ${tiempoTotal}ms (${totalPaginas} páginas, ${totalCupones} cupones)`,
      );

      // Registrar log de sincronización
      await this.supabaseService.logBondaOperation({
        operacion: 'sincronizar_cupones_completo',
        endpoint: '/api/cupones',
        exitoso: true,
        request_data: {
          microsite_id: microsite.id,
          total_paginas: totalPaginas,
        },
        response_data: {
          total_cupones: totalCupones,
          cupones_guardados: count,
        },
      });

      return {
        total_cupones: totalCupones,
        total_paginas: totalPaginas,
        tiempo_total_ms: tiempoTotal,
        errores,
      };
    } catch (error) {
      const tiempoTotal = Date.now() - startTime;
      this.logger.error(`❌ Error en sincronización: ${error.message}`);

      // Registrar log de error
      await this.supabaseService.logBondaOperation({
        operacion: 'sincronizar_cupones_completo',
        endpoint: '/api/cupones',
        exitoso: false,
        error_message: error.message,
        request_data: { microsite_id: micrositeId },
      });

      throw error;
    }
  }

  /**
   * Helper para delay entre requests
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Sincronizar el catálogo maestro usando un único micrositio
   * para evitar duplicar más de 20,000 cupones innecesariamente.
   */
  async sincronizarTodosMicrositios(): Promise<{
    total_micrositios: number;
    resultados: Array<{
      microsite_nombre: string;
      exito: boolean;
      total_cupones?: number;
      error?: string;
    }>;
  }> {
    this.logger.log(
      '🔄 Sincronizando catálogo global de Bonda usando micrositio maestro...',
    );

    // Trataremos de usar "Beneficios La Guarida" porque en las pruebas nos devolvió 1672 cupones
    // (el máximo de catálogo disponible) o caer en el primero activo
    const { data: masterMicrosites } = await this.supabaseService
      .from('bonda_microsites')
      .select('id, nombre, slug')
      .eq('activo', true)
      .limit(10);

    if (!masterMicrosites || masterMicrosites.length === 0) {
      this.logger.warn(
        '⚠️ No hay micrositios activos para utilizar como maestro',
      );
      return { total_micrositios: 0, resultados: [] };
    }

    // Priorizar Beneficios La Guarida (o Fundación Padres)
    const masterMicrosite =
      masterMicrosites.find((m) => m.slug === 'beneficios-la-guarida') ||
      masterMicrosites.find((m) => m.slug === 'beneficios-fundacion-padres') ||
      masterMicrosites[0];

    const resultados: Array<{
      microsite_nombre: string;
      exito: boolean;
      total_cupones?: number;
      error?: string;
    }> = [];

    try {
      this.logger.log(
        `\n📡 Sincronizando catálogo usando maestro: ${masterMicrosite.nombre}...`,
      );

      const resultado = await this.sincronizarCuponesDesdeBonda(
        masterMicrosite.id,
      );

      resultados.push({
        microsite_nombre: masterMicrosite.nombre,
        exito: true,
        total_cupones: resultado.total_cupones,
      });
    } catch (error: any) {
      this.logger.error(
        `❌ Error sincronizando catálogo maestro (${masterMicrosite.nombre}): ${error.message}`,
      );
      resultados.push({
        microsite_nombre: masterMicrosite.nombre,
        exito: false,
        error: error.message,
      });
    }

    return {
      total_micrositios: 1, // Se reporta como 1 porque se sincronizó un catálogo global
      resultados,
    };
  }

  /**
   * Cron job: Sincronizar cupones diariamente a las 3 AM Argentina (UTC-3)
   *
   * Horario Argentina (ART): 3:00 AM
   * Horario UTC: 6:00 AM
   *
   * Cron expression: '0 6 * * *' (A las 6:00 AM UTC todos los días)
   */
  @Cron('0 6 * * *', {
    name: 'sincronizar_cupones_diario',
    timeZone: 'UTC',
  })
  async sincronizacionAutomaticaDiaria() {
    this.logger.log(
      '⏰ Cron job iniciado: Sincronización diaria de cupones (3 AM Argentina)',
    );

    try {
      const resultado = await this.sincronizarTodosMicrositios();

      this.logger.log(
        `✅ Cron job completado: ${resultado.total_micrositios} micrositios sincronizados`,
      );

      // Log en base de datos
      await this.supabaseService.logBondaOperation({
        operacion: 'cron_sincronizacion_diaria',
        exitoso: true,
        response_data: resultado,
      });
    } catch (error) {
      this.logger.error(
        `❌ Error en cron job de sincronización: ${error.message}`,
      );

      // Log de error en base de datos
      await this.supabaseService.logBondaOperation({
        operacion: 'cron_sincronizacion_diaria',
        exitoso: false,
        error_message: error.message,
      });
    }
  }

  /**
   * Cron job: Suspender usuarios localmente y en Bonda según Regla del Mes
   * Se ejecuta diariamente a las 2 AM Argentina (UTC-3)
   */
  @Cron('0 5 * * *', {
    name: 'suspender_usuarios_expirados_mes',
    timeZone: 'UTC',
  })
  async suspenderUsuariosExpirados() {
    this.logger.log('⏰ Iniciando Suspensión de Usuarios Expirados (Regla de 1 Mes)');
    try {
      // 1. Obtener usuarios afiliados que figuran is_active=true
      const { data: afiliados } = await this.supabaseService.getClient()
        .from('usuarios_bonda_afiliados')
        .select('user_id, bonda_microsite_id, affiliate_code, is_active')
        .eq('is_active', true);

      if (!afiliados || afiliados.length === 0) return;

      let expirados = 0;
      let fallos = 0;
      const ahora = new Date();

      for (const aff of afiliados) {
        try {
           // Obtener el último pago completado para el usuario/micrositio
           // (El bonda_microsite_id se conecta con el organizacion_id en la tabla bonda_microsites)
           const { data: microsite } = await this.supabaseService.from('bonda_microsites').select('organizacion_id, slug').eq('id', aff.bonda_microsite_id).maybeSingle();
           
           if (!microsite?.organizacion_id) continue;
           
           const { data: donacion } = await this.supabaseService.from('donaciones')
             .select('created_at')
             .eq('usuario_id', aff.user_id)
             .eq('organizacion_id', microsite.organizacion_id)
             .eq('estado', 'completada')
             .order('created_at', { ascending: false })
             .limit(1)
             .maybeSingle();
             
           // Si no tiene pagos o su último pago expiró
           let isExpired = true;
           if (donacion?.created_at) {
              const fechaUltimoPago = new Date(donacion.created_at);
              const fechaVencimiento = new Date(fechaUltimoPago);
              
              const expectedMonth = fechaVencimiento.getMonth() + 1;
              fechaVencimiento.setMonth(expectedMonth);
              
              // Ajuste en caso de saltar el mes
              if (fechaVencimiento.getMonth() > expectedMonth % 12) {
                fechaVencimiento.setDate(0); 
              }
              
              fechaVencimiento.setHours(23, 59, 59, 999);
              isExpired = ahora > fechaVencimiento;
           }

           if (isExpired) {
              this.logger.log(`Usuario ${aff.user_id} expirado para ONG. Suspendiendo en Bonda...`);
              
              // Soft delete en Bonda
              try {
                await this.bondaService.eliminarAfiliado(aff.affiliate_code, { slug: microsite.slug });
              } catch (bondaError: any) {
                // Si retorna 404 o Not Found se asume que ya estaba borrado
                if (!bondaError?.message?.includes('404') && !bondaError?.message?.includes('Not Found')) {
                   this.logger.warn(`Aviso Bonda Delete: ${bondaError?.message}`);
                }
              }
              
              // Actualizar localmente a inactivo
              await this.supabaseService.getClient().from('usuarios_bonda_afiliados')
                 .update({ is_active: false })
                 .eq('user_id', aff.user_id)
                 .eq('bonda_microsite_id', aff.bonda_microsite_id);

              await this.supabaseService.getClient().from('usuarios')
                 .update({ is_active: false })
                 .eq('id', aff.user_id);
                 
              expirados++;
           }
        } catch (e: any) {
           this.logger.error(`Error procesando expiración para usuario ${aff.user_id}: ${e.message}`);
           fallos++;
        }
        // Evitar rate-limit Bonda
        await this.delay(100);
      }

      this.logger.log(`✅ Job Soft-Delete Expirados completado: ${expirados} suspendidos. Fallos: ${fallos}`);
    } catch (e: any) {
      this.logger.error('❌ Error general en job de suspensión de expirados:', e.message);
    }
  }

  /**
   * Cron job: Reconciliar estados de usuarios (Supabase vs Bonda)
   * Se ejecuta diariamente a las 4 AM Argentina (UTC-3)
   */
  @Cron('0 7 * * *', {
    name: 'reconciliar_usuarios_bonda',
    timeZone: 'UTC',
  })
  async reconciliarUsuariosBonda() {
    this.logger.log('⏰ Iniciando Reconciliación de Usuarios (Local vs Bonda)');
    try {
      // 1. Obtener batch de usuarios locales activos
      const { data: usuarios } = await this.supabaseService.getClient()
        .from('usuarios')
        .select('id, dni, email, is_active, usuarios_bonda_afiliados(affiliate_code, bonda_microsite_id)')
        .eq('is_active', true)
        .limit(100);

      if (!usuarios || usuarios.length === 0) return;

      let fallos = 0;
      let desincronizados = 0;

      for (const usuario of usuarios) {
        if (!usuario.usuarios_bonda_afiliados?.length) continue;
        
        for (const aff of usuario.usuarios_bonda_afiliados as any[]) {
          try {
             const bondaUser = await this.bondaService.obtenerAfiliado(aff.affiliate_code, { slug: aff.bonda_microsite_id || 'ctfin' });
             
             // Si retorna null (soft-deleteado) o error
             if (bondaUser === null || bondaUser?.error?.code === 'USER_NOT_FOUND') {
                this.logger.warn(`Desincronización detectada: Usuario ${usuario.id} está Activo Local pero Soft-Deleteado/No Encontrado en Bonda.`);
                // Marcar alerta o desactivar
                await this.supabaseService.getClient().from('usuarios').update({ is_active: false }).eq('id', usuario.id);
                desincronizados++;
             }
          } catch (e) {
             fallos++;
          }
          // Evitar rate-limit Bonda
          await this.delay(300);
        }
      }

      this.logger.log(`✅ Reconciliación completada: ${desincronizados} usuarios desactivados tras revisión. Fallos/Throttles: ${fallos}`);
    } catch (e: any) {
      this.logger.error('❌ Error general en job de reconciliación:', e.message);
    }
  }
}

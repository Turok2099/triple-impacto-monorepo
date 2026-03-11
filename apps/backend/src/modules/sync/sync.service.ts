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
}

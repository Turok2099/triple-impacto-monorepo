import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { BondaService } from '../src/modules/bonda/bonda.service';
import { SupabaseService } from '../src/modules/supabase/supabase.service';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Script para analizar TODOS los cupones de TODOS los micrositios de Bonda.
 * Extrae las marcas/empresas que participan y genera un CSV con estadísticas.
 * 
 * Uso: npm run analizar-bonda
 */

interface MarcaAnalisis {
  empresa: string;
  apariciones: number;
  micrositios: Set<string>;
  descuentos: string[];
  descuentoPromedio: number | null;
}

async function bootstrap() {
  console.log('🔍 Iniciando análisis de cupones Bonda...\n');

  // Crear aplicación NestJS standalone
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const bondaService = app.get(BondaService);
  const supabaseService = app.get(SupabaseService);

  try {
    // 1. Obtener todos los micrositios activos
    console.log('📡 Obteniendo micrositios activos de Supabase...');
    const { data: micrositios, error } = await supabaseService
      .from('bonda_microsites')
      .select('id, nombre, slug, api_token, microsite_id, activo')
      .eq('activo', true)
      .order('nombre');

    if (error) {
      throw new Error(`Error al obtener micrositios: ${error.message}`);
    }

    if (!micrositios || micrositios.length === 0) {
      console.log('⚠️ No hay micrositios activos en la base de datos.');
      await app.close();
      return;
    }

    console.log(`✅ Encontrados ${micrositios.length} micrositios activos\n`);

    // 2. Recopilar cupones de todos los micrositios
    const marcasMap = new Map<string, MarcaAnalisis>();
    const DEMO_AFFILIATE_CODE = '22380612';
    let totalCupones = 0;
    let micrositiosExitosos = 0;

    for (const microsite of micrositios) {
      console.log(`📦 Procesando: ${microsite.nombre} (${microsite.slug})...`);

      try {
        const response = await bondaService.obtenerCupones(
          DEMO_AFFILIATE_CODE,
          { slug: microsite.slug },
        );

        if (!response || !response.cupones || response.cupones.length === 0) {
          console.log(`   ⚠️ Sin cupones disponibles`);
          continue;
        }

        console.log(`   ✓ ${response.cupones.length} cupones obtenidos`);
        totalCupones += response.cupones.length;
        micrositiosExitosos++;

        // Procesar cada cupón
        for (const cupon of response.cupones) {
          const empresaNombre = cupon.empresa.nombre;

          if (!marcasMap.has(empresaNombre)) {
            marcasMap.set(empresaNombre, {
              empresa: empresaNombre,
              apariciones: 0,
              micrositios: new Set<string>(),
              descuentos: [],
              descuentoPromedio: null,
            });
          }

          const marca = marcasMap.get(empresaNombre)!;
          marca.apariciones++;
          marca.micrositios.add(microsite.nombre);
          marca.descuentos.push(cupon.descuento);
        }
      } catch (err) {
        console.log(`   ❌ Error: ${err.message}`);
      }
    }

    console.log(`\n📊 Resumen:`);
    console.log(`   Total cupones: ${totalCupones}`);
    console.log(`   Micrositios exitosos: ${micrositiosExitosos}/${micrositios.length}`);
    console.log(`   Marcas únicas: ${marcasMap.size}\n`);

    // 3. Calcular promedios y ordenar
    const marcasAnalisis = Array.from(marcasMap.values()).map((marca) => {
      // Calcular descuento promedio (solo si son porcentajes numéricos)
      const descuentosNumericos = marca.descuentos
        .map((d) => {
          const match = d.match(/(\d+)%/);
          return match ? parseInt(match[1]) : null;
        })
        .filter((n) => n !== null) as number[];

      if (descuentosNumericos.length > 0) {
        marca.descuentoPromedio =
          descuentosNumericos.reduce((a, b) => a + b, 0) /
          descuentosNumericos.length;
      }

      return marca;
    });

    // Ordenar por apariciones (más popular primero)
    marcasAnalisis.sort((a, b) => b.apariciones - a.apariciones);

    // 4. Generar CSV
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const csvPath = path.join(outputDir, `marcas-bonda-${timestamp}.csv`);
    const jsonPath = path.join(outputDir, `analisis-completo-${timestamp}.json`);

    // Crear CSV
    const csvLines = [
      'Empresa,Apariciones,Micrositios,Descuento_Promedio,Descuentos_Unicos',
    ];

    for (const marca of marcasAnalisis) {
      const descuentosUnicos = [...new Set(marca.descuentos)].join(' | ');
      const descuentoProm = marca.descuentoPromedio
        ? `${marca.descuentoPromedio.toFixed(1)}%`
        : 'N/A';
      const micrositiosStr = Array.from(marca.micrositios).join(' | ');

      csvLines.push(
        `"${marca.empresa}",${marca.apariciones},"${micrositiosStr}","${descuentoProm}","${descuentosUnicos}"`,
      );
    }

    fs.writeFileSync(csvPath, csvLines.join('\n'), 'utf-8');

    // Crear JSON completo
    const jsonData = {
      fecha_analisis: new Date().toISOString(),
      total_micrositios: micrositios.length,
      micrositios_exitosos: micrositiosExitosos,
      total_cupones: totalCupones,
      marcas_unicas: marcasMap.size,
      micrositios: micrositios.map((m) => ({
        nombre: m.nombre,
        slug: m.slug,
      })),
      marcas: marcasAnalisis.map((m) => ({
        empresa: m.empresa,
        apariciones: m.apariciones,
        micrositios: Array.from(m.micrositios),
        descuento_promedio: m.descuentoPromedio,
        descuentos: [...new Set(m.descuentos)],
      })),
    };

    fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), 'utf-8');

    // 5. Mostrar resultados en consola
    console.log('📋 Top 10 Marcas:\n');
    for (let i = 0; i < Math.min(10, marcasAnalisis.length); i++) {
      const marca = marcasAnalisis[i];
      const descProm = marca.descuentoPromedio
        ? `${marca.descuentoPromedio.toFixed(1)}%`
        : 'N/A';
      console.log(
        `   ${i + 1}. ${marca.empresa.padEnd(25)} - ${marca.apariciones} cupones, ${marca.micrositios.size} micrositios, promedio: ${descProm}`,
      );
    }

    console.log(`\n✅ Archivos generados:`);
    console.log(`   CSV:  ${csvPath}`);
    console.log(`   JSON: ${jsonPath}\n`);
  } catch (error) {
    console.error('❌ Error crítico:', error.message);
    console.error(error.stack);
  } finally {
    await app.close();
  }
}

bootstrap();

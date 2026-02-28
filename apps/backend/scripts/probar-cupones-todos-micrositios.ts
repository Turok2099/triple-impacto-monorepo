/**
 * Script para probar consulta de cupones en todos los micrositios
 * 
 * Este script consulta los cupones disponibles usando los afiliados
 * de prueba creados en cada micrositio
 * 
 * Uso: npx ts-node scripts/probar-cupones-todos-micrositios.ts
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const BONDA_API_URL = 'https://apiv1.cuponstar.com';

const MICROSITIOS = [
  {
    nombre: 'Club de Impacto Proyectar',
    id: '911436',
    api_key: 'DbMd4IZG6S6d9fAQ4Uro0J5EPjf9fZwC2256liZXrwkJg9i3HDXZuCbdZzED62Rg',
  },
  {
    nombre: 'Biblioteca Rurales Argentinas',
    id: '911406',
    api_key: 'HzSJ8ja5ntXOPsjYxnlOsaTALKnv6tAjnVwPZow8ZdVJ820eGSTkt91hTOQ23qmW',
  },
  {
    nombre: 'Haciendo Camino',
    id: '911405',
    api_key: 'yX2bueZCYRdaXEqYOAGdv7qwvGyisuALGhoVx3MfYSZnAkk4zgUzjdKUfckUzwFR',
  },
  {
    nombre: 'Mamis Solidarias',
    id: '911340',
    api_key: 'cdE7XhhpkkU9amSJ9sPuI1LFkMRzrMOzgeuXNaYsFjMidj2GGd38YwqlCEaOsWrM',
  },
  {
    nombre: 'Plato Lleno',
    id: '911322',
    api_key: 's2uwjlmPcWsQmy9pEJFSmm2Zm8qNs8oUwA9G69hdVNdGwGOMSJ1NLtPUHeF1OzXC',
  },
  {
    nombre: 'Monte Adentro',
    id: '911321',
    api_key: 'JABu8vQxB6ptpic1MaBdQkMnlPdDnxDM70zNkm1WWCynKFhrrYJ5wgTEZFXcIkwk',
  },
  {
    nombre: 'Fundación Padres',
    id: '911299',
    api_key: 'DG7xN1fp5wmr60YnPizhhEbYCT4ivTOiVDYoLXdKEn9Zhb1nipHIJEDHuyn69bWq',
  },
  {
    nombre: 'Proactiva',
    id: '911265',
    api_key: 'lsmiw3D8zyCwk7ssUMNgbq1lksesHFi8ZcWvPJy67Jtr9fNSHeGPZDWYP1p2AqCp',
  },
  {
    nombre: 'La Guarida',
    id: '911249',
    api_key: 'WAjqgmfu8zn8PynyOcZ87RNc46GmW1MK1rULVnwl9xCdBFs1Ptqo37nBSqCzgRqg',
  },
  {
    nombre: 'Techo',
    id: '911215',
    api_key: 'gyAYd2JAdGWPiQnVoE8guA35kSeENpnJP1YirBgJFc5CVcAwYYNuCEiOXWAqWQ3r',
  },
  {
    nombre: 'Regenerar Club',
    id: '911193',
    api_key: '79BdxcA9dsUyOQgde5LHqwxn4k7wLp6s7OyJuZwlG84to7E6lJxOMDoomAVSAhfs',
  },
  {
    nombre: 'Loros Parlantes',
    id: '911192',
    api_key: 'Khh70AhvxXNuhP72xP9u2upzzQ0YLqHl2BnOdweJl9chUUVfan1P2HyLz7iaXr65',
  },
];

async function consultarCupones(microsite: typeof MICROSITIOS[0]) {
  const dniBase = 12345678;
  const affiliateCode = String(dniBase + parseInt(microsite.id.slice(-2)));

  try {
    const response = await axios.get(
      `${BONDA_API_URL}/api/cupones`,
      {
        params: {
          key: microsite.api_key,
          micrositio_id: microsite.id,
          codigo_afiliado: affiliateCode,
          subcategories: true,
          orderBy: 'relevant',
        },
      }
    );

    const cupones = response.data?.results || [];
    const totalCount = response.data?.count || cupones.length;
    const categorias = [...new Set(cupones.map((c: any) => c.categoria))];

    return {
      status: 'SUCCESS',
      affiliate_code: affiliateCode,
      total_cupones: totalCount,
      primera_pagina: cupones.length,
      categorias: categorias.length,
      ejemplos: cupones.slice(0, 3).map((c: any) => ({
        titulo: c.titulo || c.nombre,
        empresa: c.empresa || c.nombre,
        categoria: c.categoria,
      })),
    };
  } catch (error: any) {
    if (error.response?.data) {
      return {
        status: 'ERROR',
        affiliate_code: affiliateCode,
        mensaje: error.response.data.error?.detail || 'Error desconocido',
        error_code: error.response.data.error?.code,
      };
    }

    return {
      status: 'NETWORK_ERROR',
      affiliate_code: affiliateCode,
      mensaje: error.message,
    };
  }
}

async function main() {
  console.log('🚀 Consultando cupones en todos los micrositios...\n');
  console.log('='.repeat(80));

  const resultados: any[] = [];

  for (const microsite of MICROSITIOS) {
    console.log(`\n🔍 ${microsite.nombre} (ID: ${microsite.id})`);

    const resultado = await consultarCupones(microsite);
    resultados.push({
      microsite: microsite.nombre,
      id: microsite.id,
      ...resultado,
    });

    if (resultado.status === 'SUCCESS') {
      console.log(`   ✅ ${resultado.total_cupones.toLocaleString('es-AR')} cupones disponibles (primera página: ${resultado.primera_pagina})`);
      console.log(`   📁 ${resultado.categorias} categorías`);
    } else {
      console.log(`   ❌ ${resultado.mensaje}`);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Resumen final
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 RESUMEN FINAL\n');

  const exitosos = resultados.filter(r => r.status === 'SUCCESS');
  const conErrores = resultados.filter(r => r.status !== 'SUCCESS');

  console.log(`✅ Micrositios exitosos: ${exitosos.length}`);
  console.log(`❌ Micrositios con errores: ${conErrores.length}`);

  if (exitosos.length > 0) {
    const totalCupones = exitosos.reduce((sum, r) => sum + r.total_cupones, 0);
    const promedio = Math.round(totalCupones / exitosos.length);
    console.log(`\n📦 Total cupones: ${totalCupones}`);
    console.log(`📊 Promedio por micrositio: ${promedio}`);
  }

  // Generar MD
  const mdContent = generarMarkdown(resultados);
  const outputPath = path.join(__dirname, '..', 'RESULTADO-PRUEBA-CUPONES.md');
  fs.writeFileSync(outputPath, mdContent);
  console.log(`\n📝 Reporte guardado en: ${outputPath}`);

  console.log('\n' + '='.repeat(80));
}

function generarMarkdown(resultados: any[]): string {
  const exitosos = resultados.filter(r => r.status === 'SUCCESS');
  const totalCupones = exitosos.reduce((sum, r) => sum + r.total_cupones, 0);
  const promedio = exitosos.length > 0 ? Math.round(totalCupones / exitosos.length) : 0;

  let md = `# 📊 Resultado Prueba de Cupones - Bonda API\n\n`;
  md += `**Fecha:** ${new Date().toLocaleString('es-AR')}\n\n`;
  md += `---\n\n`;

  md += `## 📈 Resumen General\n\n`;
  md += `- **Micrositios probados:** ${resultados.length}\n`;
  md += `- **Exitosos:** ${exitosos.length}\n`;
  md += `- **Con errores:** ${resultados.length - exitosos.length}\n`;
  md += `- **Total cupones:** ${totalCupones.toLocaleString('es-AR')}\n`;
  md += `- **Promedio por micrositio:** ${promedio}\n\n`;

  md += `---\n\n`;

  md += `## ✅ Resultados por Micrositio\n\n`;
  md += `| Micrositio | ID | Código Afiliado | Total Cupones | Categorías | Status |\n`;
  md += `|------------|----|-----------------|--------------:|------------:|--------|\n`;

  resultados.forEach(r => {
    const icon = r.status === 'SUCCESS' ? '✅' : '❌';
    const cupones = r.total_cupones || 0;
    const categorias = r.categorias || 0;
    md += `| ${r.microsite} | ${r.id} | \`${r.affiliate_code}\` | ${cupones.toLocaleString('es-AR')} | ${categorias} | ${icon} |\n`;
  });

  md += `\n---\n\n`;

  // Top 5 micrositios con más cupones
  if (exitosos.length > 0) {
    const top5 = [...exitosos]
      .sort((a, b) => b.total_cupones - a.total_cupones)
      .slice(0, 5);

    md += `## 🏆 Top 5 - Micrositios con Más Cupones\n\n`;
    top5.forEach((r, index) => {
      md += `${index + 1}. **${r.microsite}** - ${r.total_cupones.toLocaleString('es-AR')} cupones\n`;
    });
    md += `\n`;
  }

  // Errores (si hay)
  const conErrores = resultados.filter(r => r.status !== 'SUCCESS');
  if (conErrores.length > 0) {
    md += `---\n\n`;
    md += `## ❌ Errores Detectados\n\n`;
    conErrores.forEach(r => {
      md += `### ${r.microsite}\n`;
      md += `- **Error:** ${r.mensaje}\n`;
      if (r.error_code) {
        md += `- **Código:** \`${r.error_code}\`\n`;
      }
      md += `\n`;
    });
  }

  return md;
}

main()
  .then(() => {
    console.log('\n✅ Análisis completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });

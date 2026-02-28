/**
 * Script para probar creación de afiliados en todos los micrositios
 * 
 * Este script intenta crear un afiliado de prueba en cada micrositio
 * para identificar cuáles tienen permisos habilitados
 * 
 * Uso: npx ts-node -r tsconfig-paths/register scripts/probar-creacion-todos-micrositios.ts
 */

import axios from 'axios';

const BONDA_API_URL = 'https://apiv1.cuponstar.com';

const MICROSITIOS = [
  {
    nombre: 'Club de Impacto Proyectar',
    id: '911436',
    api_key: 'Bp3Sz4bxCMc9tePqRqnmCvzlsKJjPpteSiPggDG4oZCO9PC7s21XAdO7tJ8IfqNm',
  },
  {
    nombre: 'Biblioteca Rurales Argentinas',
    id: '911406',
    api_key: '9Gsz0fIrrUhRGUnNIvFdj7l5WDCKFWPTJPiQj3xzybqU9CVr5IIppMPS3smEUqjn',
  },
  {
    nombre: 'Haciendo Camino',
    id: '911405',
    api_key: 'uTkzCTveSSCl11xd0ZywYV1GVezUCTAQdNdic0SOcgKFo2DD4sak6EMXWHEePor4',
  },
  {
    nombre: 'Mamis Solidarias',
    id: '911340',
    api_key: 'RuD6YsWfclvYLYK7DHtBMNeKD2S8CfXVVSWKIJRADrhafr1NYZ6XhlgfKZ3lLKs7',
  },
  {
    nombre: 'Plato Lleno',
    id: '911322',
    api_key: 'e3pWzTpjqrgD7lN7BSNhqaVMrbXULZGOu7AsOwFDF9ZmsPJJ0fkehvk4LEbMUm4i',
  },
  {
    nombre: 'Monte Adentro',
    id: '911321',
    api_key: 'Gs4ayhroSG3jNqxNqoEXvHQUsNsyAayyAjZZUVaSisACaEZTwkwx3OPA8DjxBn8d',
  },
  {
    nombre: 'Fundación Padres',
    id: '911299',
    api_key: 'egNtOqB6R5fc5NdxmE45wWWNW0zp5TRNho6SjvcomgYhTGN75Er4CfCrVuOW9JzW',
  },
  {
    nombre: 'Proactiva',
    id: '911265',
    api_key: 'ugLPJmETYY88X0cm7iHcpPCraM8LwwR8rgp4ACO7zgDUUo7Rf7KsGQC1rEzG0L56',
  },
  {
    nombre: 'La Guarida',
    id: '911249',
    api_key: 'CNOrS9D29aW50tycbwlSfXJm4WsEsRHJzHyZFNte4mTdVB3YvvkDNQGE6JCQI0tC',
  },
  {
    nombre: 'Techo',
    id: '911215',
    api_key: '8WFFVmkzoW2mHR2k3a5DLj4HyBu1Gwt1gA67vbf6rjQ4aDjlqMMXEPw4plzxQuPD',
  },
  {
    nombre: 'Regenerar Club',
    id: '911193',
    api_key: 'NpITgultyMAzb31m3sd5NMpYOnJjiJVCjoUy44ed1e9xMBbFipvH4laEfsA466IW',
  },
  {
    nombre: 'Loros Parlantes',
    id: '911192',
    api_key: 'd55lDV26VvmvfT0tXnuL5Y5Uw4kPKSzk2ffGD6n8Dtg05GTJ2yPcpk0uCzY7nx2k',
  },
];

async function probarMicrositio(microsite: typeof MICROSITIOS[0]) {
  // IMPORTANTE: Según Bonda, el DNI debe ir en el campo "code"
  // Usamos un DNI diferente por micrositio para evitar duplicados
  const dniBase = 12345678;
  const codigo = String(dniBase + parseInt(microsite.id.slice(-2)));  // DNI único por micrositio
  
  try {
    const response = await axios.post(
      `${BONDA_API_URL}/api/v2/microsite/${microsite.id}/affiliates`,
      {
        code: codigo,  // DNI en el campo code
        email: 'test@tripleimpacto.local',
        nombre: 'Usuario de Prueba',
      },
      {
        headers: {
          'token': microsite.api_key,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.success) {
      return {
        status: 'SUCCESS',
        mensaje: 'Afiliado creado exitosamente',
        codigo: codigo,
        member_id: response.data.data?.member?.id,
      };
    } else {
      // Analizar error en respuesta exitosa de HTTP pero con success:false
      const errorData = response.data;
      if (errorData.error?.code === 'HttpPublicResponseException') {
        const detail = errorData.error.detail;
        if (detail?.dni) {
          return {
            status: 'VALIDATION_ERROR',
            mensaje: 'Campo DNI requerido',
            error: detail.dni.join(', '),
          };
        }
      }
      
      return {
        status: 'ERROR',
        mensaje: 'Respuesta sin éxito',
        error: response.data,
      };
    }
  } catch (error: any) {
    if (error.response?.data) {
      const errorData = error.response.data;
      
      // Analizar tipo de error
      if (errorData.error?.code === 'AuthorizationException') {
        return {
          status: 'AUTH_ERROR',
          mensaje: 'Error de autorización - Sin permisos',
          error: errorData.error.detail,
        };
      } else if (errorData.error?.code === 'HttpPublicResponseException') {
        const detail = errorData.error.detail;
        
        // Si el error es sobre el DNI
        if (detail?.dni) {
          return {
            status: 'VALIDATION_ERROR',
            mensaje: 'Campo DNI requerido',
            error: detail.dni.join(', '),
          };
        }
        
        // Si el error es sobre código duplicado
        if (detail?.code) {
          return {
            status: 'DUPLICATE',
            mensaje: 'Código duplicado (puede ser un éxito anterior)',
            error: detail.code.join(', '),
          };
        }
        
        return {
          status: 'VALIDATION_ERROR',
          mensaje: 'Error de validación',
          error: detail,
        };
      }
      
      return {
        status: 'ERROR',
        mensaje: 'Error desconocido',
        error: errorData,
      };
    }
    
    return {
      status: 'NETWORK_ERROR',
      mensaje: 'Error de red o timeout',
      error: error.message,
    };
  }
}

async function main() {
  console.log('🚀 Probando creación de afiliados en todos los micrositios...\n');
  console.log('=' .repeat(80));
  
  const resultados: Array<{
    microsite: string;
    id: string;
    status: string;
    mensaje: string;
    codigo?: string;
    member_id?: string;
    error?: any;
  }> = [];
  
  for (const microsite of MICROSITIOS) {
    console.log(`\n🔍 ${microsite.nombre} (ID: ${microsite.id})`);
    console.log('   Probando...');
    
    const resultado = await probarMicrositio(microsite);
    resultados.push({
      microsite: microsite.nombre,
      id: microsite.id,
      ...resultado,
    });
    
    // Mostrar resultado inmediato
    const iconos: Record<string, string> = {
      SUCCESS: '✅',
      DUPLICATE: '✓ ',
      AUTH_ERROR: '🔒',
      VALIDATION_ERROR: '⚠️ ',
      ERROR: '❌',
      NETWORK_ERROR: '🌐',
    };
    
    const icon = iconos[resultado.status] || '❓';
    console.log(`   ${icon} ${resultado.mensaje}`);
    
    if (resultado.error) {
      const errorStr = typeof resultado.error === 'string' 
        ? resultado.error 
        : JSON.stringify(resultado.error).substring(0, 100);
      console.log(`      ${errorStr}`);
    }
    
    if (resultado.codigo) {
      console.log(`      Código creado: ${resultado.codigo}`);
    }
    
    // Pequeña pausa entre requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Resumen final
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 RESUMEN FINAL\n');
  
  const exitosos = resultados.filter(r => r.status === 'SUCCESS').length;
  const duplicados = resultados.filter(r => r.status === 'DUPLICATE').length;
  const authErrors = resultados.filter(r => r.status === 'AUTH_ERROR').length;
  const validationErrors = resultados.filter(r => r.status === 'VALIDATION_ERROR').length;
  const otrosErrors = resultados.filter(r => 
    r.status !== 'SUCCESS' && 
    r.status !== 'DUPLICATE' && 
    r.status !== 'AUTH_ERROR' && 
    r.status !== 'VALIDATION_ERROR'
  ).length;
  
  console.log(`✅ Exitosos: ${exitosos}`);
  console.log(`✓  Duplicados: ${duplicados}`);
  console.log(`🔒 Sin permisos: ${authErrors}`);
  console.log(`⚠️  Validación: ${validationErrors}`);
  console.log(`❌ Otros errores: ${otrosErrors}`);
  
  // Detalles por categoría
  if (exitosos > 0) {
    console.log('\n✅ Micrositios con ÉXITO:');
    resultados
      .filter(r => r.status === 'SUCCESS')
      .forEach(r => {
        console.log(`   - ${r.microsite} (${r.id})`);
        if (r.codigo) console.log(`     Código: ${r.codigo}`);
      });
  }
  
  if (validationErrors > 0) {
    console.log('\n⚠️  Micrositios que REQUIEREN DNI:');
    resultados
      .filter(r => r.status === 'VALIDATION_ERROR' && r.mensaje.includes('DNI'))
      .forEach(r => console.log(`   - ${r.microsite} (${r.id})`));
  }
  
  if (authErrors > 0) {
    console.log('\n🔒 Micrositios SIN PERMISOS:');
    resultados
      .filter(r => r.status === 'AUTH_ERROR')
      .forEach(r => console.log(`   - ${r.microsite} (${r.id})`));
  }
  
  console.log('\n' + '='.repeat(80));
  
  // Recomendaciones
  if (exitosos === 0 && validationErrors > 0) {
    console.log('\n💡 RECOMENDACIÓN:');
    console.log('   Algunos micrositios requieren el campo DNI.');
    console.log('   Prueba agregando: dni: 12345678');
  }
  
  if (exitosos === 0 && authErrors === MICROSITIOS.length) {
    console.log('\n⚠️  ALERTA:');
    console.log('   NINGÚN micrositio tiene permisos de creación habilitados.');
    console.log('   Contacta a Bonda para habilitar los permisos en las API keys.');
  }
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

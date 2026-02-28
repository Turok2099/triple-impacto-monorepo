/**
 * Script simple para crear un afiliado en Bonda API
 * 
 * Este script crea un afiliado en un micrositio específico de Bonda
 * 
 * Uso: npx ts-node -r tsconfig-paths/register scripts/crear-afiliado-simple.ts
 */

import axios from 'axios';

// ============================================
// CONFIGURACIÓN - EDITAR ESTOS VALORES
// ============================================

// URL base de Bonda API
const BONDA_API_URL = 'https://apiv1.cuponstar.com';

// Micrositio donde crear el afiliado
const MICROSITE_ID = '911436'; // Club de Impacto Proyectar (requiere DNI)
const API_KEY = 'Bp3Sz4bxCMc9tePqRqnmCvzlsKJjPpteSiPggDG4oZCO9PC7s21XAdO7tJ8IfqNm'; // API Key de Nóminas

// Datos del afiliado a crear
// IMPORTANTE: Según Bonda, el DNI debe ir en el campo "code" (no como campo separado)
const AFILIADO = {
  code: '12346000',                  // DNI del usuario (8 dígitos) - NUEVO USUARIO
  email: 'test.proyectar@tripleimpacto.local',
  nombre: 'Usuario Prueba Proyectar',
};

// ============================================
// SCRIPT
// ============================================

async function crearAfiliado() {
  console.log('🚀 Creando afiliado en Bonda API...\n');
  
  console.log('📋 Configuración:');
  console.log(`   Micrositio ID: ${MICROSITE_ID}`);
  console.log(`   API Key: ${API_KEY.substring(0, 20)}...`);
  console.log(`   URL: ${BONDA_API_URL}/api/v2/microsite/${MICROSITE_ID}/affiliates`);
  
  console.log('\n📝 Datos del afiliado:');
  console.log(`   Código (DNI): ${AFILIADO.code}`);
  console.log(`   Email: ${AFILIADO.email}`);
  console.log(`   Nombre: ${AFILIADO.nombre}`);
  
  console.log('\n📤 Payload JSON exacto que se enviará:');
  console.log(JSON.stringify(AFILIADO, null, 2));
  
  console.log('\n🔄 Enviando request...\n');

  try {
    const response = await axios.post(
      `${BONDA_API_URL}/api/v2/microsite/${MICROSITE_ID}/affiliates`,
      AFILIADO,
      {
        headers: {
          'token': API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('📦 Respuesta completa:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('\n✅ ÉXITO - Afiliado creado correctamente');
      
      if (response.data.data?.member) {
        console.log('\n✨ Resumen:');
        console.log(`   ID: ${response.data.data.member.id}`);
        console.log(`   Código: ${response.data.data.member.code}`);
      }
      
      return response.data;
    } else {
      console.log('\n❌ ERROR - Bonda respondió con success: false');
      throw new Error('Bonda respondió con success: false');
    }
  } catch (error: any) {
    console.error('❌ ERROR al crear afiliado\n');
    
    if (error.response) {
      console.error('📦 Respuesta del servidor:');
      console.error(JSON.stringify(error.response.data, null, 2));
      console.error(`\n📊 Status Code: ${error.response.status}`);
      
      // Análisis del error
      if (error.response.data?.error?.detail) {
        console.error('\n🔍 Detalle del error:');
        const detail = error.response.data.error.detail;
        
        if (typeof detail === 'object') {
          Object.keys(detail).forEach(campo => {
            console.error(`   - Campo "${campo}": ${detail[campo].join(', ')}`);
          });
        } else {
          console.error(`   ${detail}`);
        }
      }
    } else if (error.request) {
      console.error('❌ No se recibió respuesta del servidor');
      console.error('   Verifica tu conexión a internet');
    } else {
      console.error('❌ Error al configurar la request:', error.message);
    }
    
    throw error;
  }
}

// ============================================
// EJECUCIÓN
// ============================================

crearAfiliado()
  .then(() => {
    console.log('\n✅ Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script terminado con errores');
    process.exit(1);
  });

/**
 * Script para crear usuario de prueba en todos los micrositios de Bonda
 * 
 * Este script:
 * 1. Crea un usuario en Supabase
 * 2. Crea afiliados en Bonda API para los 12 micrositios
 * 3. Inserta relaciones en usuarios_bonda_afiliados
 * 
 * Uso: npx ts-node -r tsconfig-paths/register scripts/crear-usuario-prueba-todos-micrositios.ts
 */

import axios from 'axios';
import * as bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Configuración
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const BONDA_API_URL = 'https://apiv1.cuponstar.com';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Variables de entorno SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas');
  console.error(`   SUPABASE_URL: ${SUPABASE_URL ? 'OK' : 'FALTA'}`);
  console.error(`   SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY ? 'OK' : 'FALTA'}`);
  process.exit(1);
}

// Datos del usuario de prueba
const USUARIO_PRUEBA = {
  nombre: 'Usuario de Prueba',
  email: 'test_unique_' + Date.now() + '@tripleimpacto.local',  // Email único para evitar duplicados
  password: 'prueba123',
  dni: '40123456',  // DNI de prueba (string de 8 dígitos)
  telefono: '+54 9 11 1234-5678',
  provincia: 'Buenos Aires',
  localidad: 'CABA',
};

// Micrositios con sus credenciales (API Key de Nóminas)
// Los slugs deben coincidir exactamente con los de bonda_microsites en Supabase
const MICROSITIOS = [
  {
    nombre: 'Club de Impacto Proyectar',
    slug: 'club-impacto-proyectar',
    microsite_id: '911436',
    api_key_nominas: 'Bp3Sz4bxCMc9tePqRqnmCvzlsKJjPpteSiPggDG4oZCO9PC7s21XAdO7tJ8IfqNm',
  },
  {
    nombre: 'Beneficios Biblioteca Rurales Argentinas',
    slug: 'beneficios-biblioteca-rurales',
    microsite_id: '911406',
    api_key_nominas: '9Gsz0fIrrUhRGUnNIvFdj7l5WDCKFWPTJPiQj3xzybqU9CVr5IIppMPS3smEUqjn',
  },
  {
    nombre: 'Beneficios Haciendo Camino',
    slug: 'beneficios-haciendo-camino',
    microsite_id: '911405',
    api_key_nominas: 'uTkzCTveSSCl11xd0ZywYV1GVezUCTAQdNdic0SOcgKFo2DD4sak6EMXWHEePor4',
  },
  {
    nombre: 'Comunidad Mamis Solidarias',
    slug: 'comunidad-mamis-solidarias',
    microsite_id: '911340',
    api_key_nominas: 'e3pWzTpjqrgD7lN7BSNhqaVMrbXULZGOu7AsOwFDF9ZmsPJJ0fkehvk4LEbMUm4i',
  },
  {
    nombre: 'Club Plato Lleno',
    slug: 'club-plato-lleno',
    microsite_id: '911322',
    api_key_nominas: 'Gs4ayhroSG3jNqxNqoEXvHQUsNsyAayyAjZZUVaSisACaEZTwkwx3OPA8DjxBn8d',
  },
  {
    nombre: 'Beneficios Monte Adentro',
    slug: 'beneficios-monte-adentro',
    microsite_id: '911321',
    api_key_nominas: 'egNtOqB6R5fc5NdxmE45wWWNW0zp5TRNho6SjvcomgYhTGN75Er4CfCrVuOW9JzW',
  },
  {
    nombre: 'Beneficios Fundación Padres',
    slug: 'beneficios-fundacion-padres',
    microsite_id: '911299',
    api_key_nominas: 'ugLPJmETYY88X0cm7iHcpPCraM8LwwR8rgp4ACO7zgDUUo7Rf7KsGQC1rEzG0L56',
  },
  {
    nombre: 'Club Proactiva',
    slug: 'club-proactiva',
    microsite_id: '911265',
    api_key_nominas: 'CNOrS9D29aW50tycbwlSfXJm4WsEsRHJzHyZFNte4mTdVB3YvvkDNQGE6JCQI0tC',
  },
  {
    nombre: 'Beneficios La Guarida',
    slug: 'beneficios-la-guarida',
    microsite_id: '911249',
    api_key_nominas: '8WFFVmkzoW2mHR2k3a5DLj4HyBu1Gwt1gA67vbf6rjQ4aDjlqMMXEPw4plzxQuPD',
  },
  {
    nombre: 'Comunidad Techo',
    slug: 'comunidad-techo',
    microsite_id: '911215',
    api_key_nominas: 'NpITgultyMAzb31m3sd5NMpYOnJjiJVCjoUy44ed1e9xMBbFipvH4laEfsA466IW',
  },
  {
    nombre: 'Regenerar Club',
    slug: 'regenerar-club',
    microsite_id: '911193',
    api_key_nominas: 'd55lDV26VvmvfT0tXnuL5Y5Uw4kPKSzk2ffGD6n8Dtg05GTJ2yPcpk0uCzY7nx2k',
  },
  {
    nombre: 'Beneficios Loros Parlantes',
    slug: 'beneficios-loros-parlantes',
    microsite_id: '911192',
    api_key_nominas: 'Khh70AhvxXNuhP72xP9u2upzzQ0YLqHl2BnOdweJl9chUUVfan1P2HyLz7iaXr65',
  },
];

// Función para generar código de afiliado único
function generarCodigoAfiliado(email: string, micrositeSlug: string): string {
  const emailPart = email
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 5);
  const slugPart = micrositeSlug
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 8);
  const timestamp = Date.now().toString(36).slice(-4);
  const random = Math.random().toString(36).slice(2, 5);
  return `${emailPart}_${slugPart}_${timestamp}${random}`;
}

// Función principal
async function main() {
  console.log('🚀 Iniciando creación de usuario de prueba...\n');

  // 1. Conectar a Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  console.log('✅ Conectado a Supabase');

  // 2. Verificar si el usuario ya existe
  const { data: existingUser } = await supabase
    .from('usuarios')
    .select('id, email')
    .eq('email', USUARIO_PRUEBA.email)
    .single();

  let userId: string;

  if (existingUser) {
    console.log(`⚠️  Usuario ya existe: ${existingUser.email} (ID: ${existingUser.id})`);
    userId = existingUser.id;
  } else {
    // 3. Crear usuario en Supabase
    console.log(`\n📝 Creando usuario en Supabase...`);
    const passwordHash = await bcrypt.hash(USUARIO_PRUEBA.password, 10);

    const { data: newUser, error: createError } = await supabase
      .from('usuarios')
      .insert({
        nombre: USUARIO_PRUEBA.nombre,
        email: USUARIO_PRUEBA.email,
        telefono: USUARIO_PRUEBA.telefono,
        provincia: USUARIO_PRUEBA.provincia,
        localidad: USUARIO_PRUEBA.localidad,
        password_hash: passwordHash,
      })
      .select()
      .single();

    if (createError || !newUser) {
      console.error('❌ Error al crear usuario:', createError);
      process.exit(1);
    }

    userId = newUser.id;
    console.log(`✅ Usuario creado en Supabase (ID: ${userId})`);
  }

  // 4. Crear afiliados en Bonda y guardar en usuarios_bonda_afiliados
  console.log(`\n🔗 Creando afiliados en Bonda API (12 micrositios)...\n`);

  const resultados: Array<{
    micrositio: string;
    status: string;
    codigo?: string;
    mensaje?: string;
    error?: any;
  }> = [];

  for (const microsite of MICROSITIOS) {
    console.log(`\n--- ${microsite.nombre} (${microsite.slug}) ---`);

    try {
      // 4.1 Verificar si el micrositio existe en bonda_microsites
      const { data: micrositeDB } = await supabase
        .from('bonda_microsites')
        .select('id')
        .eq('microsite_id', microsite.microsite_id)
        .single();

      if (!micrositeDB) {
        console.warn(`⚠️  Micrositio no encontrado en DB, saltando...`);
        resultados.push({
          micrositio: microsite.nombre,
          status: 'SKIP',
          mensaje: 'Micrositio no existe en bonda_microsites',
        });
        continue;
      }

      const micrositeDbId = micrositeDB.id;

      // 4.2 Verificar si ya existe el afiliado
      const { data: existingAffiliate } = await supabase
        .from('usuarios_bonda_afiliados')
        .select('affiliate_code')
        .eq('user_id', userId)
        .eq('bonda_microsite_id', micrositeDbId)
        .single();

      if (existingAffiliate) {
        console.log(`✓ Afiliado ya existe: ${existingAffiliate.affiliate_code}`);
        resultados.push({
          micrositio: microsite.nombre,
          status: 'EXISTS',
          codigo: existingAffiliate.affiliate_code,
        });
        continue;
      }

      // 4.3 Generar código único
      const affiliateCode = generarCodigoAfiliado(USUARIO_PRUEBA.email, microsite.slug);
      console.log(`  Código generado: ${affiliateCode}`);

      // 4.4 Crear afiliado en Bonda API
      // IMPORTANTE: Según Bonda, el DNI debe ir en el campo "code" (no como campo separado)
      console.log(`  Creando en Bonda API...`);
      const requestPayload = {
        code: USUARIO_PRUEBA.dni,  // DNI en el campo code
        email: USUARIO_PRUEBA.email,
        nombre: USUARIO_PRUEBA.nombre,
      };
      console.log(`  URL: ${BONDA_API_URL}/api/v2/microsite/${microsite.microsite_id}/affiliates`);
      console.log(`  Payload:`, JSON.stringify(requestPayload, null, 2));
      console.log(`  API Key (primeros 20 chars): ${microsite.api_key_nominas.substring(0, 20)}...`);
      
      const bondaResponse = await axios.post(
        `${BONDA_API_URL}/api/v2/microsite/${microsite.microsite_id}/affiliates`,
        requestPayload,
        {
          headers: {
            token: microsite.api_key_nominas,
            'Content-Type': 'application/json',
          },
        },
      );

      if (bondaResponse.data.success) {
        console.log(`  ✓ Afiliado creado en Bonda`);
        console.log(`  Respuesta:`, JSON.stringify(bondaResponse.data, null, 2));

        // 4.5 Guardar en usuarios_bonda_afiliados
        const { error: insertError } = await supabase
          .from('usuarios_bonda_afiliados')
          .insert({
            user_id: userId,
            bonda_microsite_id: micrositeDbId,
            affiliate_code: affiliateCode,
          });

        if (insertError) {
          console.error(`  ❌ Error al guardar en DB:`, insertError.message);
          resultados.push({
            micrositio: microsite.nombre,
            status: 'ERROR_DB',
            codigo: affiliateCode,
            error: insertError.message,
          });
        } else {
          console.log(`  ✓ Relación guardada en usuarios_bonda_afiliados`);
          resultados.push({
            micrositio: microsite.nombre,
            status: 'SUCCESS',
            codigo: affiliateCode,
          });
        }
      } else {
        console.error(`  ❌ Error en Bonda:`, JSON.stringify(bondaResponse.data, null, 2));
        resultados.push({
          micrositio: microsite.nombre,
          status: 'ERROR_BONDA',
          error: bondaResponse.data,
        });
      }
    } catch (error: any) {
      console.error(`  ❌ Error:`, error.response?.data || error.message);
      resultados.push({
        micrositio: microsite.nombre,
        status: 'ERROR',
        error: error.response?.data || error.message,
      });
    }
  }

  // 5. Resumen final
  console.log('\n\n===========================================');
  console.log('📊 RESUMEN DE RESULTADOS');
  console.log('===========================================\n');

  console.log(`Usuario: ${USUARIO_PRUEBA.email}`);
  console.log(`ID: ${userId}`);
  console.log(`Password: ${USUARIO_PRUEBA.password}\n`);

  const exitosos = resultados.filter((r) => r.status === 'SUCCESS').length;
  const existentes = resultados.filter((r) => r.status === 'EXISTS').length;
  const errores = resultados.filter((r) => r.status.includes('ERROR')).length;

  console.log(`✅ Exitosos: ${exitosos}`);
  console.log(`✓  Ya existían: ${existentes}`);
  console.log(`❌ Errores: ${errores}\n`);

  console.log('Detalle por micrositio:\n');
  resultados.forEach((r) => {
    const icon = r.status === 'SUCCESS' ? '✅' : r.status === 'EXISTS' ? '✓ ' : '❌';
    console.log(`${icon} ${r.micrositio}`);
    if (r.codigo) console.log(`   Código: ${r.codigo}`);
    if (r.error) console.log(`   Error: ${JSON.stringify(r.error).substring(0, 100)}`);
  });

  console.log('\n===========================================');
  console.log('✅ SCRIPT COMPLETADO');
  console.log('===========================================\n');

  console.log('🔐 Credenciales de acceso:');
  console.log(`   Email: ${USUARIO_PRUEBA.email}`);
  console.log(`   Password: ${USUARIO_PRUEBA.password}`);
  console.log(`\n🌐 Puedes iniciar sesión en: http://localhost:3001/login`);
}

// Ejecutar script
main()
  .then(() => {
    console.log('\n✅ Proceso completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });

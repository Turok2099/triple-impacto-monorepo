import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bondaUrl = process.env.BONDA_API_URL || 'https://apiv1.cuponstar.com';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan credenciales de Supabase en el .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDniInBonda(dni: string) {
  console.log(`\n🔍 Buscando afiliado con DNI: ${dni} en todos los micrositios de Bonda...`);
  
  // 1. Obtener todos los micrositios de Bonda
  const { data: micrositios, error } = await supabase
    .from('bonda_microsites')
    .select('*')
    .not('api_token', 'is', null)
    .not('microsite_id', 'is', null);
    
  if (error || !micrositios || micrositios.length === 0) {
    console.error('❌ Error al obtener micrositios o no hay configurados:', error);
    return;
  }
  
  console.log(`\n📡 Se encontraron ${micrositios.length} micrositios configurados. Consultando API de Bonda...\n`);
  
  for (const microsite of micrositios) {
    try {
      const url = `${bondaUrl}/api/v2/microsite/${microsite.microsite_id}/affiliates/${dni}`;
      const response = await axios.get(url, {
        headers: {
          'token': microsite.api_token_nominas || microsite.api_token
        }
      });
      
      if (response.data?.success) {
        console.log(`✅ ENCONTRADO EN: ${microsite.slug}`);
        console.log(`=======================================================`);
        console.log(JSON.stringify(response.data.data, null, 2));
        console.log(`=======================================================\n`);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        // No está en este micrositio, seguimos
      } else {
        console.log(`⚠️ Error al consultar ${microsite.slug}:`, err.response?.data || err.message);
      }
    }
  }
  
  console.log(`🏁 Búsqueda finalizada.\n`);
}

const dni = process.argv[2];
if (!dni) {
  console.error('❌ Por favor, proporciona un DNI. Uso: npx ts-node get-bonda-user.ts <DNI>');
  process.exit(1);
}

checkDniInBonda(dni);

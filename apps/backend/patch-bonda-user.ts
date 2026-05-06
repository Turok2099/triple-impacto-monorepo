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

async function patchDniInBonda(dni: string, nombre: string, apellido: string) {
  console.log(`\n✏️ Actualizando afiliado con DNI: ${dni} a nombre: "${nombre} ${apellido}" en Bonda...`);
  
  const { data: micrositios, error } = await supabase
    .from('bonda_microsites')
    .select('*')
    .not('api_token', 'is', null)
    .not('microsite_id', 'is', null);
    
  if (error || !micrositios || micrositios.length === 0) {
    console.error('❌ Error al obtener micrositios:', error);
    return;
  }
  
  for (const microsite of micrositios) {
    try {
      const url = `${bondaUrl}/api/v2/microsite/${microsite.microsite_id}/affiliates/${dni}`;
      const response = await axios.patch(url, {
        nombre: nombre,
        apellido: apellido
      }, {
        headers: {
          'token': microsite.api_token_nominas || microsite.api_token,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data?.success) {
        console.log(`✅ ACTUALIZADO EN: ${microsite.slug}`);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        // No existe en este micrositio, omitimos en silencio
      } else {
        console.log(`⚠️ Error al actualizar en ${microsite.slug}:`, err.response?.data || err.message);
      }
    }
  }
  
  console.log(`\n🏁 Actualización finalizada.\n`);
}

patchDniInBonda('22380612', 'Mariano', 'Leguizamón');

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const lines = env.split('\n');
let url = '';
let key = '';
for (const line of lines) {
    if (line.startsWith('SUPABASE_URL=')) url = line.split('=')[1].trim();
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=')[1].trim();
}

const supabase = createClient(url, key);

async function check() {
    console.log('Buscando afiliados bonda del usuario...');
    const { data: affiliates } = await supabase.from('user_bonda_affiliates').select('*').eq('user_id', 'dff53336-184f-4516-83a2-9e993763f43c');
    
    console.log('Affiliates:', affiliates);
}

check().catch(console.error);

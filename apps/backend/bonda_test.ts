import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const lines = env.split('\n');
let url = '', key = '';
for (const line of lines) {
    if (line.startsWith('SUPABASE_URL=')) url = line.split('=')[1].trim();
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=')[1].trim();
}

async function testGet() {
    const supabase = createClient(url, key);
    const { data: all } = await supabase.from('user_bonda_affiliates').select('bonda_code, user_id');
    console.log('All bonded affiliates:', all?.length ? all : 'None');
}
testGet();

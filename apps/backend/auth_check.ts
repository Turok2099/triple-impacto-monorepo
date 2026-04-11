import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const lines = env.split('\n');
let url = '', key = '';
for (const line of lines) {
    if (line.startsWith('SUPABASE_URL=')) url = line.split('=')[1].trim();
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=')[1].trim();
}

async function checkAuthUsers() {
    const supabase = createClient(url, key);
    // Find local user IDs and see if they exist in auth
    const { data: localUsers } = await supabase.from('usuarios').select('id, email, nombre');
    
    let allAuthUsers: any[] = [];
    let page = 1;
    while (true) {
        const { data } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
        if (!data || !data.users || data.users.length === 0) break;
        allAuthUsers = allAuthUsers.concat(data.users);
        if (data.users.length < 1000) break;
        page++;
    }

    console.log(`Local users count: ${localUsers?.length}`);
    console.log(`Auth users count: ${allAuthUsers.length}`);

    for (const l of localUsers || []) {
        const authUserById = allAuthUsers.find(a => a.id === l.id);
        const authUserByEmail = allAuthUsers.find(a => a.email === l.email);
        
        let status = 'MISSING IN AUTH';
        if (authUserById) status = 'MATCH ID';
        else if (authUserByEmail) status = 'MATCH EMAIL (ID MISMATCH)';

        console.log(`- Local [${l.id}] ${l.email} -> ${status}`);
    }
}
checkAuthUsers();

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Cargar variables de entorno del backend local
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Buscando las últimas 5 transacciones (select *)...\n");
    const { data, error } = await supabase
        .from('payment_attempts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error:", error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.log("No se encontraron intentos de pago recientes.");
        return;
    }

    data.forEach((p, index) => {
        console.log(`[${index + 1}] Fecha: ${new Date(p.created_at).toLocaleString()}`);
        console.log(`    Status BD: ${p.status}`);
        console.log(`    Monto: $${p.amount}`);
        console.log(`    OID (Fiserv): ${p.order_id || p.oid || 'No generado'}`);

        let approvalCode = 'N/A';
        if (p.fiserv_raw_response && typeof p.fiserv_raw_response === 'object') {
            const raw = p.fiserv_raw_response as any;
            approvalCode = raw.approval_code || 'N/A';
            console.log(`    Approval Code: ${approvalCode}`);
            console.log(`    Oid in Raw: ${raw.oid || 'N/A'}`);
        }
        console.log("--------------------------------------------------");
    });
}
check();

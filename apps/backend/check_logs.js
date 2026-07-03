const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Fetching latest logs_sync_bonda...");
  const { data: logs } = await supabase
    .from('logs_sync_bonda')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  console.log("Latest Logs:", JSON.stringify(logs, null, 2));

  console.log("Fetching latest payment_attempts...");
  const { data: payments } = await supabase
    .from('payment_attempt')
    .select('id, user_id, amount, status, created_at, store_id')
    .order('created_at', { ascending: false })
    .limit(5);
  console.log("Latest Payments:", JSON.stringify(payments, null, 2));
}

main();

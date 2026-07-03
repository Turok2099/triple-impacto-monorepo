const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Checking users with name JORGE...");
  const { data: usersJorge } = await supabase
    .from('usuarios')
    .select('id, nombre, email, dni')
    .ilike('nombre', '%jorge%');
  console.log(usersJorge);

  console.log("Checking bonda affiliates...");
  const { data: affiliates } = await supabase
    .from('usuarios_bonda_afiliados')
    .select('user_id, bonda_microsite_id, affiliate_code, is_active')
    .limit(10);
  console.log(affiliates);

  // Lets find all payment attempts
  const { data: payments } = await supabase
    .from('payment_attempt')
    .select('id, user_id, amount, status, created_at, fiserv_raw_response')
    .order('created_at', { ascending: false })
    .limit(3);
  console.log(payments);
}

main();

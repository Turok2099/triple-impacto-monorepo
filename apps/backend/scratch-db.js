require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDb() {
  console.log('Fetching bonda_microsites...');
  const { data, error } = await supabase.from('bonda_microsites').select('*');
  if (error) {
    console.error('Error fetching:', error);
    return;
  }
  
  data.forEach(row => {
    console.log(`\nMicrosite: ${row.slug}`);
    console.log(`  api_token: ${row.api_token}`);
    console.log(`  microsite_id: ${row.microsite_id}`);
    
    // Compare with the known good token
    const isCorrect = row.api_token === 'DG7xN1fp5wmr60YnPizhhEbYCT4ivTOiVDYoLXdKEn9Zhb1nipHIJEDHuyn69bWq';
    console.log(`  Token matches expected .env key? ${isCorrect}`);
  });
}

checkDb();

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching plan:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('Columns in plans table:', Object.keys(data[0]));
  } else {
    console.log('No data found in plans table.');
  }
}

checkColumns();

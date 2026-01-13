const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// You'll need to add your Supabase credentials here or in .env
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('Testing connection to drivers_uk table...');
    
    const { data, error } = await supabase
      .from('drivers_uk')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Success! Sample data:', data);
      if (data && data.length > 0) {
        console.log('Column names:', Object.keys(data[0]));
      }
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

testConnection();

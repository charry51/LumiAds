const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Parse .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  if (line.trim().startsWith('#')) return;
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
  }
});

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

async function run() {
  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error fetching profile:", error);
  } else {
    console.log("Columns in perfiles:", Object.keys(data[0] || {}));
  }
}

run();

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local
const envPath = path.join(__dirname, '..', '.env.local');
let envContent = '';
try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (e) {
  console.error("Could not read .env.local", e);
  process.exit(1);
}

const env = {};
envContent.split(/\r?\n/).forEach(line => {
  if (line.trim().startsWith('#')) return;
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
    env[key] = value;
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseServiceKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false
  }
})

async function run() {
  console.log("Checking profiles with NULL organizacion_id...")
  const { data: profiles, error } = await supabase
    .from('perfiles')
    .select('id, email')
    .is('organizacion_id', null)

  if (error) {
    console.error("Error fetching profiles:", error)
    return
  }

  console.log(`Found ${profiles.length} profiles with NULL organizacion_id.`)

  for (const profile of profiles) {
    console.log(`Creating organization for profile ${profile.email || profile.id}...`)
    
    // Create organization
    const { data: org, error: orgError } = await supabase
      .from('organizaciones')
      .insert({ nombre: `Organización de ${profile.email || profile.id}` })
      .select('id')
      .single()

    if (orgError || !org) {
      console.error(`Error creating organization for ${profile.id}:`, orgError)
      continue
    }

    // Link profile to organization
    const { error: updateError } = await supabase
      .from('perfiles')
      .update({ organizacion_id: org.id })
      .eq('id', profile.id)

    if (updateError) {
      console.error(`Error updating profile ${profile.id} with org ${org.id}:`, updateError)
    } else {
      console.log(`Successfully linked profile ${profile.id} to org ${org.id}`)
    }
  }

  console.log("Done!")
}

run()

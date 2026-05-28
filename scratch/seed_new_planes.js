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
  // Ignore comments
  if (line.trim().startsWith('#')) return;
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
    env[key] = value;
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local", { supabaseUrl: !!supabaseUrl, supabaseKey: !!supabaseKey });
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const newPlanes = [
    {
      id: 'basic',
      nombre: 'Plan Básico',
      precio_mensual: 0.00,
      max_campanas: 1,
      max_pantallas: 1,
      max_duracion_segundos: 10,
      prioridad: 'baja',
      frecuencia_relativa: 1,
      color_hex: '#94a3b8'
    },
    {
      id: 'premium',
      nombre: 'Plan Premium',
      precio_mensual: 20.00,
      max_campanas: 5,
      max_pantallas: 5,
      max_duracion_segundos: 20,
      prioridad: 'estandar',
      frecuencia_relativa: 2,
      color_hex: '#7C3CFF'
    },
    {
      id: 'gold',
      nombre: 'Plan Gold',
      precio_mensual: 50.00,
      max_campanas: 9999,
      max_pantallas: 9999,
      max_duracion_segundos: 30,
      prioridad: 'maxima',
      frecuencia_relativa: 4,
      color_hex: '#D4AF37'
    }
  ];

  console.log("Seeding new plans into database...");
  for (const plane of newPlanes) {
    const { error } = await supabase
      .from('planes')
      .upsert(plane, { onConflict: 'id' });
    
    if (error) {
      console.error(`Error inserting plane ${plane.id}:`, error);
    } else {
      console.log(`Plan ${plane.id} upserted successfully.`);
    }
  }
  console.log("Seeding complete.");
}

run();

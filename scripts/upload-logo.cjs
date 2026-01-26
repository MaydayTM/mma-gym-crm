const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env file manually
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

async function upload() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const filePath = path.join(__dirname, '../public/images/freshYellowRCN 2.png');
  const fileContent = fs.readFileSync(filePath);

  console.log('Uploading logo from:', filePath);

  const { data, error } = await supabase.storage
    .from('assets')
    .upload('logo-reconnect.png', fileContent, {
      contentType: 'image/png',
      upsert: true
    });

  if (error) {
    console.error('Upload error:', error);
    process.exit(1);
  }

  console.log('Uploaded successfully:', data);

  const { data: urlData } = supabase.storage.from('assets').getPublicUrl('logo-reconnect.png');
  console.log('\nPublic URL:', urlData.publicUrl);
}

upload();

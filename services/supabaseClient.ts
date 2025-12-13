import { createClient } from '@supabase/supabase-js';

// Retrieve environment variables using Vite's import.meta.env
const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseKey = import.meta.env.SUPABASE_ANON_KEY;

// Validate that required environment variables are present
if (!supabaseUrl || !supabaseKey) {
  console.error(
    '❌ SUPABASE CONFIGURATION ERROR\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    'Missing required Supabase environment variables!\n\n' +
    'Please add the following to your .env.local file:\n' +
    '  SUPABASE_URL=your-project-url\n' +
    '  SUPABASE_ANON_KEY=your-anon-key\n\n' +
    'Get these values from: https://app.supabase.com/project/_/settings/api\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
  );
  throw new Error('Supabase configuration is incomplete. Check console for details.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

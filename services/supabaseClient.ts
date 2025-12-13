import { createClient } from '@supabase/supabase-js';

// Retrieve environment variables using Vite's import.meta.env
let supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseKey = import.meta.env.SUPABASE_ANON_KEY;

// Ensure URL has https:// prefix if it doesn't
if (supabaseUrl && !supabaseUrl.startsWith('http')) {
  supabaseUrl = `https://${supabaseUrl}`;
}

// Validate that required environment variables are present
if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Database configuration missing. Some features may not work.');
  // Create a dummy client to prevent crashes - will fail on actual requests
  supabaseUrl = 'https://placeholder.supabase.co';
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

import { createClient } from '@supabase/supabase-js'

// Replace these with your actual Supabase project URL and anon key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if environment variables are defined
if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your_supabase_project_url_here') {
  console.error('❌ Supabase environment variables are not properly configured!');
  console.error('Please check your .env file and ensure you have:');
  console.error('- VITE_SUPABASE_URL=your_actual_supabase_url');
  console.error('- VITE_SUPABASE_ANON_KEY=your_actual_anon_key');
  console.error('See SUPABASE_SETUP.md for detailed instructions.');
} else {
  console.log('✅ Supabase configuration found');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
)

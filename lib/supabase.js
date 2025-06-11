import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  },
  global: {
    // Add longer timeout for slow connections
    fetch: (url, options) => {
      return fetch(url, {
        ...options,
        signal: AbortSignal.timeout(20000) // 20 second timeout
      });
    }
  }
});

export async function testSupabaseConnection() {
  try {
    // Simple query to test connection
    const { data, error } = await supabase
      .from('nationality')
      .select('*')
      .limit(1)
      .maybeSingle();
      
    if (error && !error.message.includes('does not exist')) {
      throw error;
    }
    
    return {
      success: true,
      message: 'Supabase connection successful!',
      data: {
        current_time: new Date().toISOString(),
        database_version: 'PostgreSQL (via Supabase)',
        connection_type: 'Supabase Client'
      }
    };
  } catch (error) {
    console.error('Supabase connection error:', error);
    return {
      success: false,
      error: error && error.message ? error.message : String(error),
      message: 'Supabase connection failed!'
    };
  }
}

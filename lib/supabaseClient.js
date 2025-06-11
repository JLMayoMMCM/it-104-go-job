  import { createClient } from '@supabase/supabase-js'

  export const supabase = createClient(environment.NEXT_PUBLIC_SUPABASE_URL, environment.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
    },
    global: {
      headers: {
        'x-client-info': 'supabase-js/2.0.0',
      },
    },
  });
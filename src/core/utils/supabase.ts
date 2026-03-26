import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/core/types/supabase';

let _supabase: SupabaseClient<Database> | null = null;

export const supabase: SupabaseClient<Database> = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    if (!_supabase) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase environment variables');
      }
      _supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
    }
    return (_supabase as never)[prop];
  },
});

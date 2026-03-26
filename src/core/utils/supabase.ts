import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/core/types/supabase';

let _supabase: SupabaseClient<Database> | null = null;

try {
  _supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
} catch {
  // During SSG build, env vars may not be available — safe to skip
}

export const supabase = _supabase as SupabaseClient<Database>;

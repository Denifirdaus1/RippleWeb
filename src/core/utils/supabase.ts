import { createClient } from '@supabase/supabase-js';
import { Database } from '@/core/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

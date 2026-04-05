import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/core/types/supabase';

let supabaseClient: SupabaseClient<Database> | null | undefined;
let hasLoggedSupabaseInitError = false;

const logSupabaseInitError = (error: unknown) => {
  if (hasLoggedSupabaseInitError) return;
  hasLoggedSupabaseInitError = true;
  console.error('Supabase client initialization failed.', error);
};

export const getSupabaseClient = (): SupabaseClient<Database> | null => {
  if (typeof supabaseClient !== 'undefined') {
    return supabaseClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    supabaseClient = null;
    return supabaseClient;
  }

  try {
    supabaseClient = createClient<Database>(url, anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    });
  } catch (error) {
    supabaseClient = null;
    logSupabaseInitError(error);
  }

  return supabaseClient;
};

export const isSupabaseAvailable = () => getSupabaseClient() !== null;

export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop, receiver) {
    const client = getSupabaseClient();

    if (!client) {
      throw new Error(
        'Supabase client is unavailable. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
      );
    }

    return Reflect.get(client as unknown as object, prop, receiver);
  },
}) as SupabaseClient<Database>;

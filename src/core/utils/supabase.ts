import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/core/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

function createNoopClient(): SupabaseClient<Database> {
  const noopResult = {
    data: { user: null, session: null, subscription: { unsubscribe: () => {} } },
    error: null,
  };
  const noopFn = () => Object.assign(Promise.resolve(noopResult), noopResult);
  const chainProxy: ProxyHandler<object> = { get: () => noopFn };
  const handler: ProxyHandler<object> = {
    get(_t, prop) {
      if (prop === 'auth' || prop === 'from') {
        return new Proxy(() => new Proxy({}, chainProxy), chainProxy);
      }
      return noopFn;
    },
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Proxy({}, handler) as any as SupabaseClient<Database>;
}

export const supabase: SupabaseClient<Database> = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : createNoopClient();

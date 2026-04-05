import { AuthChangeEvent, User } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/core/utils/supabase';
import { getSiteUrl } from '@/core/utils/site-url';

const createNoopAuthSubscription = () => ({
  data: {
    subscription: {
      unsubscribe() {},
    },
  },
});

export class AuthService {
  /**
   * Sign in with Google using Supabase OAuth.
   */
  static async signInWithGoogle() {
    const supabase = getSupabaseClient();

    if (!supabase) {
      throw new Error('Authentication is temporarily unavailable. Please refresh and try again.');
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getSiteUrl('/auth/callback'),
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) throw error;
    return data;
  }

  static async signOut() {
    const supabase = getSupabaseClient();

    if (!supabase) {
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  static async getCurrentUser() {
    const supabase = getSupabaseClient();

    if (!supabase) {
      return null;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user;
  }

  static onAuthStateChange(callback: (user: User | null) => void) {
    const supabase = getSupabaseClient();

    if (!supabase) {
      return createNoopAuthSubscription();
    }

    return supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session) => {
      callback(session?.user ?? null);
    });
  }
}

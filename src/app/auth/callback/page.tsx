'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/core/utils/supabase';

const readAuthCallbackError = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));

  const errorDescription =
    searchParams.get('error_description') ?? hashParams.get('error_description');
  const errorCode = searchParams.get('error_code') ?? hashParams.get('error_code');
  const error = searchParams.get('error') ?? hashParams.get('error');

  return errorDescription ?? errorCode ?? error;
};

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const authError = readAuthCallbackError();

    if (authError) {
      router.replace(`/login?error=${encodeURIComponent(authError)}`);
      return;
    }

    const supabase = getSupabaseClient();

    if (!supabase) {
      router.replace('/login?error=Authentication%20is%20temporarily%20unavailable.');
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || session) {
        router.replace('/');
      }
    });

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (session) {
          router.replace('/');
          return;
        }

        router.replace('/login');
      })
      .catch((error) => {
        console.error('Failed to complete auth callback.', error);
        router.replace('/login?error=Failed%20to%20complete%20sign-in.%20Please%20try%20again.');
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 shadow-xl" />
        <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-sm">
          Authenticating...
        </p>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/presentation/hooks/useAuth';
import { FocusSessionScreen } from '@/features/focus/presentation/components/FocusSessionScreen';
import { parseFocusSessionLaunchConfig } from '@/features/focus/presentation/utils/focusSessionLaunch';

export function FocusSessionPageClient({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const launchConfig = useMemo(() => parseFocusSessionLaunchConfig(searchParams), [searchParams]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, router, user]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[#FFB74D]" />
      </div>
    );
  }

  return <FocusSessionScreen userId={user.id} launchConfig={launchConfig} />;
}

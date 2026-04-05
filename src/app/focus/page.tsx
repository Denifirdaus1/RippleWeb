'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/presentation/hooks/useAuth';
import { FocusSetupScreen } from '@/features/focus/presentation/components/FocusSetupScreen';

export default function FocusPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

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

  return <FocusSetupScreen userId={user.id} />;
}

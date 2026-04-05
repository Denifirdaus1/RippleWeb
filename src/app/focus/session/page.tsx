import { Suspense } from 'react';
import { FocusSessionPageClient } from '@/features/focus/presentation/components/FocusSessionPageClient';

interface FocusSessionPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const LoadingFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[#FFB74D]" />
  </div>
);

export default async function FocusSessionPage({ searchParams }: FocusSessionPageProps) {
  const resolvedSearchParams = await searchParams;

  return (
    <Suspense fallback={<LoadingFallback />}>
      <FocusSessionPageClient searchParams={resolvedSearchParams} />
    </Suspense>
  );
}

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, Folder } from 'lucide-react';
import { useAuth } from '@/features/auth/presentation/hooks/useAuth';
import { usePocketData } from '@/features/profile/presentation/hooks/usePocketData';

const contentDomain = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

export function PocketPageClient() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { folders, selectedFolderId, contents, loading, error, selectFolder } = usePocketData(user?.id);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, router, user]);

  if (authLoading || loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[#7AB7E8]" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center gap-4">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-300"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Ripple Links</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Browse the links saved in your Ripple pocket.
            </p>
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <p className="px-2 pb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Folders</p>
            <div className="space-y-2">
              {folders.length === 0 ? (
                <div className="rounded-[22px] bg-slate-50 px-4 py-6 text-center text-sm font-medium text-slate-500">
                  No folders yet.
                </div>
              ) : (
                folders.map((folder) => (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => void selectFolder(folder.id)}
                    className={`flex w-full items-center gap-3 rounded-[22px] px-4 py-4 text-left transition ${
                      selectedFolderId === folder.id
                        ? 'bg-[#EFF6FF] text-[#2563EB]'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white">
                      <Folder size={18} />
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-black">{folder.name}</span>
                      <span className="mt-1 block text-xs font-medium text-slate-400">
                        {folder.itemCount} item{folder.itemCount > 1 ? 's' : ''}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </aside>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            {contents.length === 0 ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
                <img src="/icons/UI/Links NBG.png" alt="" className="h-14 w-14 object-contain" />
                <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-900">Your pocket is empty</h2>
                <p className="mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">
                  Saved links from mobile will appear here. Once you add more links in Ripple, they will sync to web.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {contents.map((content) => (
                  <a
                    key={content.id}
                    href={content.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-4 rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-5 transition hover:border-[#7AB7E8] hover:bg-white"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E3F2FD]">
                      <img src="/icons/UI/Links NBG.png" alt="" className="h-6 w-6 object-contain" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-black tracking-tight text-slate-900">
                        {content.title || contentDomain(content.url)}
                      </span>
                      <span className="mt-1 block truncate text-sm font-medium text-slate-500">
                        {contentDomain(content.url)}
                      </span>
                    </span>
                    <ExternalLink size={18} className="shrink-0 text-slate-400" />
                  </a>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

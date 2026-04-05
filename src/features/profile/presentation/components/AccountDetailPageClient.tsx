'use client';
/* eslint-disable @next/next/no-img-element */

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera, Loader2, LogOut } from 'lucide-react';
import { useAuth } from '@/features/auth/presentation/hooks/useAuth';
import { useProfileDashboard } from '@/features/profile/presentation/hooks/useProfileDashboard';

const fieldClass =
  'w-full rounded-[20px] border border-slate-200 bg-white px-5 py-4 text-base font-medium text-slate-900 outline-none transition focus:border-[#9C5FEC]';

export function AccountDetailPageClient() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading, saving, updateDisplayName, uploadAvatar } = useProfileDashboard(user?.id);
  const [displayName, setDisplayName] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, router, user]);

  useEffect(() => {
    if (!profile && !user) return;
    setDisplayName(
      profile?.displayName ||
        user?.user_metadata?.full_name?.toString() ||
        user?.user_metadata?.name?.toString() ||
        user?.email?.split('@')[0] ||
        ''
    );
  }, [profile, user]);

  const avatarSrc = previewUrl || profile?.avatarUrl || null;
  const canSave = displayName.trim().length > 0 && displayName.trim() !== (profile?.displayName || '');
  const joinedDate = useMemo(() => {
    if (!user?.created_at) return 'Unknown';
    return new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(user.created_at));
  }, [user?.created_at]);

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const nextPreview = URL.createObjectURL(file);
    setPreviewUrl(nextPreview);

    try {
      await uploadAvatar(file);
    } finally {
      URL.revokeObjectURL(nextPreview);
      setPreviewUrl(null);
      event.target.value = '';
    }
  };

  if (authLoading || loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[#9C5FEC]" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-6 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-300"
          >
            <ArrowLeft size={16} />
            Back
          </Link>

          <h1 className="text-2xl font-black tracking-tight text-slate-900">My Profile</h1>
          <div className="w-[78px]" />
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white px-6 py-8 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:px-10">
          <div className="mb-10 flex flex-col items-center">
            <label className="group relative cursor-pointer">
              <div className="rounded-full border-[3px] border-[#B39DDB] p-1">
                <div className="flex h-[120px] w-[120px] items-center justify-center overflow-hidden rounded-full bg-[#F3E8FF]">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-4xl font-black text-[#9C5FEC]">
                      {(displayName || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <span className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-700 shadow-md transition group-hover:scale-105">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
            <p className="mt-4 text-sm font-black uppercase tracking-[0.18em] text-[#9C5FEC]">
              Change Profile Photo
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-black uppercase tracking-[0.14em] text-slate-500">
                Full Name
              </label>
              <input
                className={fieldClass}
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black uppercase tracking-[0.14em] text-slate-500">
                Email Address
              </label>
              <input className={`${fieldClass} text-slate-500`} value={user.email || ''} readOnly />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black uppercase tracking-[0.14em] text-slate-500">
                Joined
              </label>
              <input className={`${fieldClass} text-slate-500`} value={joinedDate} readOnly />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black uppercase tracking-[0.14em] text-slate-500">
                Timezone
              </label>
              <input className={`${fieldClass} text-slate-500`} value={profile?.timezone || 'UTC'} readOnly />
            </div>
          </div>

          <button
            type="button"
            disabled={!canSave || saving}
            onClick={async () => {
              await updateDisplayName(displayName.trim());
              router.push('/profile');
            }}
            className="mt-8 inline-flex h-[50px] w-full items-center justify-center rounded-full bg-[#9C5FEC] text-base font-black text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>

          <button
            type="button"
            onClick={() => void signOut()}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold text-[#E57373]"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </main>
  );
}

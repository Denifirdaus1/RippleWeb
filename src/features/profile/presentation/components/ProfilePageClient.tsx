'use client';
/* eslint-disable @next/next/no-img-element */

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Globe, Link2, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '@/features/auth/presentation/hooks/useAuth';
import { useProfileDashboard } from '@/features/profile/presentation/hooks/useProfileDashboard';
import {
  BadgePreview,
  DailyFocusStat,
  DailyTodoStat,
  formatFocusDuration,
  getStreakIconPath,
} from '@/features/profile/domain/entities/profile';

const cardClass =
  'rounded-[28px] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)]';

const formatJoinDate = (value?: string | null) => {
  if (!value) return 'Unknown';
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
};

const weekLabel = (value: string) =>
  new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(new Date(value));

function StatCard({
  label,
  value,
  icon,
  iconBg,
  valueColor,
  borderClass,
  gradient = false,
}: {
  label: string;
  value: string;
  icon: string;
  iconBg: string;
  valueColor: string;
  borderClass: string;
  gradient?: boolean;
}) {
  return (
    <div
      className={`h-[148px] rounded-[24px] ${
        gradient ? 'bg-gradient-to-br from-fuchsia-500 to-blue-600 p-[2px]' : `border-2 ${borderClass} bg-white`
      }`}
    >
      <div className="flex h-full flex-col rounded-[22px] bg-white px-4 py-4">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ backgroundColor: iconBg }}
        >
          <img src={icon} alt="" className="h-5 w-5 object-contain" />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <span
            className="text-center text-[30px] font-black leading-none tracking-[-0.05em]"
            style={{ color: valueColor }}
          >
            {value}
          </span>
        </div>
        <p className="text-center text-[11px] font-black uppercase tracking-[0.14em] text-slate-900">
          {label}
        </p>
      </div>
    </div>
  );
}

function ProfileStatsRow({
  totalTasks,
  streakCount,
  streakIcon,
  totalFocusMinutes,
}: {
  totalTasks: number;
  streakCount: number;
  streakIcon: string;
  totalFocusMinutes: number;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <StatCard
        label="Task"
        value={String(totalTasks)}
        borderClass="border-[#90CAF9]"
        iconBg="#E3F2FD"
        icon="/icons/Todo/produktivitas_3.png"
        valueColor="#64B5F6"
      />
      <StatCard
        label="Day Streak"
        value={String(streakCount)}
        borderClass="border-transparent"
        iconBg="#EDE7F6"
        icon={streakIcon}
        valueColor="#7C4DFF"
        gradient
      />
      <StatCard
        label="Focus"
        value={formatFocusDuration(totalFocusMinutes)}
        borderClass="border-[#A5D6A7]"
        iconBg="#E8F5E9"
        icon="/icons/UI/Time NBG.png"
        valueColor="#81C784"
      />
    </div>
  );
}

function WeeklyFocusChart({
  focusStats,
  todoStats,
}: {
  focusStats: DailyFocusStat[];
  todoStats: DailyTodoStat[];
}) {
  const merged = focusStats.map((focus, index) => ({
    label: weekLabel(focus.date),
    focusMinutes: focus.minutes,
    todoCount: todoStats[index]?.count ?? 0,
  }));
  const maxFocus = Math.max(...merged.map((item) => item.focusMinutes), 1);
  const maxTodo = Math.max(...merged.map((item) => item.todoCount), 1);

  return (
    <section className={`${cardClass} px-6 py-6`}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black tracking-tight text-slate-900">Weekly Focus</h3>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Your focus minutes and task activity this week.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#9C5FEC]" />
            Focus
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#7AB7E8]" />
            Tasks
          </span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-3">
        {merged.map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-3">
            <div className="flex h-48 w-full items-end justify-center gap-2 rounded-[22px] bg-slate-50 px-3 py-4">
              <div
                className="w-3 rounded-full bg-[#9C5FEC]"
                style={{
                  height: `${Math.max((item.focusMinutes / maxFocus) * 100, item.focusMinutes ? 12 : 6)}%`,
                }}
              />
              <div
                className="w-3 rounded-full bg-[#7AB7E8]"
                style={{
                  height: `${Math.max((item.todoCount / maxTodo) * 100, item.todoCount ? 12 : 6)}%`,
                }}
              />
            </div>
            <div className="text-center">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{item.label}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {item.focusMinutes}m · {item.todoCount}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function EarnedBadgesSection({ badges }: { badges: BadgePreview[] }) {
  const previewBadges = [
    ...badges.filter((badge) => badge.isUnlocked),
    ...badges.filter((badge) => !badge.isUnlocked),
  ].slice(0, 3);

  return (
    <section className={`${cardClass} px-6 py-6`}>
      <div className="mb-5">
        <h3 className="text-xl font-black tracking-tight text-slate-900">Earned Badges</h3>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Unlocked first, then your next closest badges.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        {previewBadges.map((badge) => (
          <div key={badge.id} className="text-center">
            <div
              className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
                badge.type === 'focus'
                  ? 'bg-sky-50'
                  : badge.type === 'task'
                  ? 'bg-orange-50'
                  : 'bg-emerald-50'
              }`}
            >
              <img
                src={badge.assetPath}
                alt={badge.title}
                className={`h-12 w-12 object-contain ${badge.isUnlocked ? '' : 'opacity-40 grayscale'}`}
              />
            </div>
            <p
              className={`mt-3 text-xs font-black uppercase tracking-[0.14em] ${
                badge.isUnlocked ? 'text-slate-900' : 'text-slate-400'
              }`}
            >
              {badge.title}
            </p>
            {!badge.isUnlocked ? (
              <div className="mx-auto mt-2 h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-[#9C5FEC]" style={{ width: `${badge.progress * 100}%` }} />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function RipplesPouchSection({ savedLinksCount }: { savedLinksCount: number }) {
  return (
    <section className={`${cardClass} px-6 py-6`}>
      <div className="mb-5">
        <h3 className="text-xl font-black tracking-tight text-slate-900">Ripple&apos;s Pouch</h3>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Quick access to your saved Ripple Links.
        </p>
      </div>

      <Link
        href="/pocket"
        className="flex items-center gap-4 rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-5 transition hover:border-[#9C5FEC] hover:bg-white"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E3F2FD]">
          <img src="/icons/UI/Links NBG.png" alt="" className="h-7 w-7 object-contain" />
        </div>
        <div className="flex-1">
          <p className="text-lg font-black tracking-tight text-slate-900">Ripple Links</p>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {savedLinksCount > 0
              ? `${savedLinksCount} saved link${savedLinksCount > 1 ? 's' : ''} ready to revisit.`
              : 'Your pocket is empty for now.'}
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-slate-400" />
      </Link>
    </section>
  );
}

export function ProfilePageClient() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, stats, badgePreview, savedLinksCount, loading, error, refresh } = useProfileDashboard(
    user?.id
  );

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, router, user]);

  if (authLoading || loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[#9C5FEC]" />
      </div>
    );
  }

  const authName =
    user.user_metadata?.full_name?.toString() ??
    user.user_metadata?.name?.toString() ??
    user.email?.split('@')[0] ??
    'Ripple User';
  const displayName = profile?.displayName || authName;
  const statsFallback = stats ?? {
    todoStats: { total: 0, completed: 0, overdue: 0, completionRate: 0, byPriority: [], dailyActivity: [] },
    focusStats: { totalMinutes: 0, completedSessions: 0, dailyActivity: [] },
    noteStats: { total: 0, favorites: 0 },
    goalStats: { total: 0, milestonesCompleted: 0 },
    dayStreak: 0,
    streakSummary: null,
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-950">My Profile</h1>
            <p className="mt-2 text-base font-medium text-slate-500">
              Keep up the good work. Your Ripple progress lives here.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:border-slate-300"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </header>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        ) : null}

        <div className="space-y-6">
          <Link
            href="/profile/account"
            className={`${cardClass} flex items-center gap-5 px-6 py-6 transition hover:-translate-y-0.5 hover:border-[#9C5FEC]`}
          >
            <div className="rounded-full border-2 border-[#9C5FEC] p-1">
              <div className="flex h-[70px] w-[70px] items-center justify-center overflow-hidden rounded-full bg-[#F3E8FF]">
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-black text-[#9C5FEC]">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1">
              <p className="text-2xl font-black tracking-tight text-[#9C5FEC]">{displayName}</p>
              <div className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-500">
                <img src="/icons/UI/CalendarNBG.png" alt="" className="h-4 w-4 object-contain" />
                <span>Joined {formatJoinDate(user.created_at)}</span>
              </div>
              <span className="mt-4 inline-flex rounded-full bg-[#D4E8B0] px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#6B8E23]">
                Focused
              </span>
            </div>

            <ChevronRight className="h-5 w-5 text-slate-400" />
          </Link>

          <section>
            <div className="mb-4">
              <h2 className="text-xl font-black tracking-tight text-slate-900">Statistics Summary</h2>
            </div>
            <ProfileStatsRow
              totalTasks={statsFallback.todoStats.total}
              streakCount={statsFallback.streakSummary?.count ?? statsFallback.dayStreak}
              streakIcon={getStreakIconPath(statsFallback.streakSummary, statsFallback.dayStreak)}
              totalFocusMinutes={statsFallback.focusStats.totalMinutes}
            />
          </section>

          <EarnedBadgesSection badges={badgePreview} />
          <WeeklyFocusChart
            focusStats={statsFallback.focusStats.dailyActivity}
            todoStats={statsFallback.todoStats.dailyActivity}
          />
          <RipplesPouchSection savedLinksCount={savedLinksCount} />

          <section className={`${cardClass} px-6 py-6`}>
            <div className="mb-5">
              <h3 className="text-xl font-black tracking-tight text-slate-900">Settings</h3>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Account details that are available on web right now.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-4 rounded-[22px] border border-slate-200 px-4 py-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
                  <Globe size={20} className="text-slate-700" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">Timezone</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{profile?.timezone ?? 'UTC'}</p>
                </div>
              </div>

              <Link
                href="/pocket"
                className="flex items-center gap-4 rounded-[22px] border border-slate-200 px-4 py-4 transition hover:border-[#9C5FEC]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
                  <Link2 size={20} className="text-slate-700" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">Ripple Links</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">
                    {savedLinksCount} saved link{savedLinksCount > 1 ? 's' : ''}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400" />
              </Link>
            </div>

            <button
              type="button"
              onClick={() => void signOut()}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FDECEC] px-5 py-4 text-sm font-black text-[#E57373] transition hover:bg-[#FADCDC]"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}

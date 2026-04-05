'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/features/auth/presentation/hooks/useAuth';
import { useStatsDetail } from '@/features/profile/presentation/hooks/useStatsDetail';
import {
  SessionItem,
  StatsDelta,
  StatsRange,
  TrendPoint,
} from '@/features/profile/domain/entities/stats_detail';
import {
  StreakDay,
  StreakSummary,
  formatFocusDuration,
  getStreakIconPath,
} from '@/features/profile/domain/entities/profile';

const cardClass =
  'rounded-[28px] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)]';

type StatsTab = 'focus' | 'tasks' | 'streak' | 'notes' | 'goals';

const formatDateLabel = (value: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-US', options).format(new Date(`${value}T00:00:00`));

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

const periodLabel = (range: StatsRange, start: string, end: string) => {
  const today = new Date();
  const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);

  if (range === 'day') {
    if (startDate.getTime() === normalizedToday.getTime()) return 'Today';
    return formatDateLabel(start, { day: 'numeric', month: 'short', year: 'numeric' });
  }

  if (range === 'week') {
    const startOfThisWeek = new Date(normalizedToday);
    const weekday = startOfThisWeek.getDay();
    const offset = weekday === 0 ? -6 : 1 - weekday;
    startOfThisWeek.setDate(startOfThisWeek.getDate() + offset);

    if (startDate.getTime() === startOfThisWeek.getTime()) return 'This Week';
    return `${formatDateLabel(start, { day: 'numeric', month: 'short' })} - ${formatDateLabel(end, {
      day: 'numeric',
      month: 'short',
    })}`;
  }

  if (
    startDate.getFullYear() === normalizedToday.getFullYear() &&
    startDate.getMonth() === normalizedToday.getMonth()
  ) {
    return 'This Month';
  }

  return formatDateLabel(start, { month: 'short', year: 'numeric' });
};

const deltaLabel = (delta: StatsDelta, suffix = '') => {
  const sign = delta.delta > 0 ? '+' : '';
  return `${sign}${delta.delta}${suffix}`;
};

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-black transition ${
        active ? 'bg-[#7AB7E8] text-white shadow-[0_10px_24px_rgba(122,183,232,0.35)]' : 'text-slate-500'
      }`}
    >
      {label}
    </button>
  );
}

function RangeButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-[14px] px-3 py-2 text-sm font-black transition ${
        active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
      }`}
    >
      {label}
    </button>
  );
}

function MetricCard({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) {
  return (
    <div className="rounded-[24px] bg-slate-50 px-5 py-5">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{title}</p>
      <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">{value}</p>
      {subtitle ? <p className="mt-2 text-sm font-medium text-slate-500">{subtitle}</p> : null}
    </div>
  );
}

function TrendChart({
  title,
  points,
  color,
  suffix,
}: {
  title: string;
  points: TrendPoint[];
  color: string;
  suffix: string;
}) {
  const max = Math.max(...points.map((point) => point.value), 1);

  return (
    <section className={`${cardClass} px-6 py-6`}>
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-xl font-black tracking-tight text-slate-900">{title}</h3>
        <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
          {points.length} points
        </span>
      </div>

      <div className="grid grid-cols-7 gap-3">
        {points.map((point) => (
          <div key={`${point.date}-${point.value}`} className="flex flex-col items-center gap-3">
            <div className="flex h-52 w-full items-end justify-center rounded-[22px] bg-slate-50 px-3 py-4">
              <div
                className="w-7 rounded-full"
                style={{
                  backgroundColor: color,
                  height: `${Math.max((point.value / max) * 100, point.value > 0 ? 10 : 4)}%`,
                }}
              />
            </div>
            <div className="text-center">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                {formatDateLabel(point.date, { weekday: 'short' })}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {point.value}
                {suffix}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FocusTab({
  todayMinutes,
  todaySessions,
  totalSessions,
  longestSessionMinutes,
  totalMinutes,
  totalBreakMinutes,
  avgDailyMinutes,
  delta,
  trend,
  sessions,
  range,
}: {
  todayMinutes: number;
  todaySessions: number;
  totalSessions: number;
  longestSessionMinutes: number;
  totalMinutes: number;
  totalBreakMinutes: number;
  avgDailyMinutes: number;
  delta: StatsDelta;
  trend: TrendPoint[];
  sessions: SessionItem[];
  range: StatsRange;
}) {
  const ringValue = range === 'day' ? todayMinutes : totalMinutes;
  const ringLabel = range === 'day' ? 'Today' : range === 'week' ? 'This Week' : 'This Month';

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] bg-gradient-to-br from-[#FFB84D] via-[#FF8A65] to-[#FF6F91] px-8 py-8 text-white shadow-[0_24px_60px_rgba(255,138,101,0.35)]">
        <div className="grid items-center gap-6 md:grid-cols-[220px_1fr]">
          <div className="mx-auto flex h-[180px] w-[180px] flex-col items-center justify-center rounded-full border-[14px] border-white/25 bg-white/10 text-center">
            <p className="text-[13px] font-black uppercase tracking-[0.22em] text-white/75">{ringLabel}</p>
            <p className="mt-3 text-4xl font-black tracking-tight">{formatFocusDuration(ringValue)}</p>
            <p className="mt-3 text-sm font-semibold text-white/80">
              Break {formatFocusDuration(totalBreakMinutes)}
            </p>
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-white/70">Focus Momentum</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight">Stay locked in.</h2>
            <p className="mt-3 max-w-xl text-base font-medium text-white/80">
              Your focus detail mirrors the Ripple mobile stats screen, including sessions, trend, and
              break totals for the selected period.
            </p>
            <div className="mt-5 inline-flex rounded-full bg-white/20 px-4 py-2 text-sm font-black">
              Delta {deltaLabel(delta, 'm')} vs previous period
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Sessions" value={String(range === 'day' ? todaySessions : totalSessions)} />
        <MetricCard title="Longest Focus" value={formatFocusDuration(longestSessionMinutes)} />
        <MetricCard title="Total Focus" value={formatFocusDuration(totalMinutes)} />
        <MetricCard title="Avg Daily" value={formatFocusDuration(Math.round(avgDailyMinutes))} />
      </div>

      <TrendChart title="Focus Trend" points={trend} color="#FF8A65" suffix="m" />

      {range === 'day' ? (
        <section className={`${cardClass} px-6 py-6`}>
          <h3 className="text-xl font-black tracking-tight text-slate-900">Focus Sessions</h3>
          <div className="mt-5 space-y-3">
            {sessions.length ? (
              sessions.map((session) => (
                <div
                  key={`${session.startedAt}-${session.durationMinutes}`}
                  className="flex items-center gap-4 rounded-[22px] bg-slate-50 px-4 py-4"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFE6DE]">
                    <img src="/icons/UI/Time NBG.png" alt="" className="h-5 w-5 object-contain" />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-black text-slate-900">
                      {session.endedAt
                        ? `${formatDateTime(session.startedAt)} - ${formatDateTime(session.endedAt)}`
                        : formatDateTime(session.startedAt)}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      {session.wasCompleted ? 'Completed' : session.wasInterrupted ? 'Interrupted' : 'In progress'}
                    </p>
                  </div>
                  <p className="text-base font-black text-slate-900">
                    {formatFocusDuration(session.durationMinutes)}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-[22px] bg-slate-50 px-4 py-5 text-sm font-medium text-slate-500">
                No focus sessions found in this period.
              </p>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function TasksTab({
  total,
  completed,
  overdue,
  completionRate,
  delta,
  trend,
  byPriority,
}: {
  total: number;
  completed: number;
  overdue: number;
  completionRate: number;
  delta: StatsDelta;
  trend: TrendPoint[];
  byPriority: { priority: string; count: number }[];
}) {
  const priorityTotal = Math.max(...byPriority.map((item) => item.count), 1);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Tasks" value={String(total)} subtitle={`Delta ${deltaLabel(delta)}`} />
        <MetricCard title="Completed" value={String(completed)} />
        <MetricCard title="Overdue" value={String(overdue)} />
        <MetricCard title="Completion Rate" value={`${Math.round(completionRate)}%`} />
      </div>

      <TrendChart title="Task Trend" points={trend} color="#7AB7E8" suffix="" />

      <section className={`${cardClass} px-6 py-6`}>
        <h3 className="text-xl font-black tracking-tight text-slate-900">Task Priority</h3>
        <div className="mt-5 space-y-4">
          {byPriority.length ? (
            byPriority.map((item) => (
              <div key={item.priority}>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
                    {item.priority}
                  </p>
                  <p className="text-sm font-black text-slate-900">{item.count}</p>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#7AB7E8]"
                    style={{ width: `${(item.count / priorityTotal) * 100}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm font-medium text-slate-500">No priority data for this period.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function StreakTab({ summary }: { summary: StreakSummary | null }) {
  if (!summary) {
    return (
      <section className={`${cardClass} px-6 py-10 text-center`}>
        <img
          src="/icons/streak/Streak_day1-10.png"
          alt="No streak"
          className="mx-auto h-16 w-16 object-contain"
        />
        <p className="mt-4 text-base font-semibold text-slate-500">No streak data available.</p>
      </section>
    );
  }

  const statusMap: Record<string, string> = {
    safe: 'Safe',
    risk: 'At Risk',
    freeze_used: 'Freeze Used',
    broken: 'Broken',
  };

  const dayColor = (status: StreakDay['status']) => {
    if (status === 'active') return '#66BB6A';
    if (status === 'frozen') return '#64B5F6';
    if (status === 'today_pending') return '#FFA000';
    return '#CFD8DC';
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] bg-gradient-to-br from-[#FFA726] to-[#FF7043] px-8 py-8 text-white shadow-[0_24px_60px_rgba(255,152,0,0.3)]">
        <div className="flex flex-col items-center text-center">
          <div className="rounded-[24px] bg-white/20 p-4">
            <img
              src={getStreakIconPath(summary, summary.count)}
              alt="Streak icon"
              className="h-[72px] w-[72px] object-contain"
            />
          </div>
          <p className="mt-5 text-6xl font-black leading-none">{summary.count}</p>
          <p className="mt-3 text-lg font-semibold text-white/85">Day Streak</p>
          <div className="mt-5 rounded-full bg-white/20 px-5 py-2 text-sm font-black">
            {statusMap[summary.status] ?? 'Broken'}
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <MetricCard title="Streak Count" value={String(summary.count)} />
        <MetricCard title="Freeze Count" value={String(summary.freezeCount)} />
      </div>

      <section className={`${cardClass} px-6 py-6`}>
        <h3 className="text-xl font-black tracking-tight text-slate-900">Streak History</h3>
        <div className="mt-6 flex flex-wrap justify-between gap-3">
          {summary.days.length ? (
            summary.days.map((day) => (
              <div key={day.date} className="text-center">
                <div
                  className="mx-auto h-8 w-8 rounded-[10px]"
                  style={{ backgroundColor: dayColor(day.status) }}
                />
                <p className="mt-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                  {formatDateLabel(day.date, { weekday: 'short' }).slice(0, 2)}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm font-medium text-slate-500">No streak history available.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function NotesTab({
  total,
  favorites,
  createdInPeriod,
  avgDaily,
  delta,
  trend,
  range,
}: {
  total: number;
  favorites: number;
  createdInPeriod: number;
  avgDaily: number;
  delta: StatsDelta;
  trend: TrendPoint[];
  range: StatsRange;
}) {
  const periodLabelText = range === 'day' ? 'Today' : range === 'week' ? 'This Week' : 'This Month';

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total Notes" value={String(total)} subtitle={`Delta ${deltaLabel(delta)}`} />
        <MetricCard title="Favorites" value={String(favorites)} />
        <MetricCard title={periodLabelText} value={String(createdInPeriod)} />
        <MetricCard title="Avg Daily" value={avgDaily.toFixed(1)} />
      </div>

      <TrendChart title="Notes Trend" points={trend} color="#81C784" suffix="" />
    </div>
  );
}

function GoalsTab({
  totalGoals,
  milestonesCompleted,
  activeGoals,
  progressList,
  delta,
}: {
  totalGoals: number;
  milestonesCompleted: number;
  activeGoals: number;
  progressList: { id: string; title: string; progress: number; color: string | null }[];
  delta: StatsDelta;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total Goals" value={String(totalGoals)} subtitle={`Delta ${deltaLabel(delta)}`} />
        <MetricCard title="Milestones" value={String(milestonesCompleted)} />
        <MetricCard title="Active Goals" value={String(activeGoals)} />
        <MetricCard title="Tracked Goals" value={String(progressList.length)} />
      </div>

      <section className={`${cardClass} px-6 py-6`}>
        <h3 className="text-xl font-black tracking-tight text-slate-900">Goal Progress</h3>
        <div className="mt-5 space-y-4">
          {progressList.length ? (
            progressList.map((goal) => (
              <div key={goal.id} className="rounded-[22px] bg-slate-50 px-5 py-5">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <p className="text-base font-black text-slate-900">{goal.title}</p>
                  <p className="text-sm font-black" style={{ color: goal.color || '#7AB7E8' }}>
                    {Math.round(goal.progress * 100)}%
                  </p>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(goal.progress * 100, 100)}%`,
                      backgroundColor: goal.color || '#7AB7E8',
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm font-medium text-slate-500">No goal progress in this period.</p>
          )}
        </div>
      </section>
    </div>
  );
}

export function StatsDetailPageClient() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { data, range, loading, error, refresh, setRange, goPrev, goNext, canGoNext } = useStatsDetail(user?.id);
  const [activeTab, setActiveTab] = useState<StatsTab>('focus');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, router, user]);

  const detail = data?.detail;

  if (authLoading || loading || !user || !detail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[#7AB7E8]" />
      </div>
    );
  }

  const currentPeriodLabel = periodLabel(detail.period.range, detail.period.start, detail.period.end);

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-300"
            >
              <ArrowLeft size={16} />
              Back
            </Link>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950">Statistics Detail</h1>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Detailed profile analytics synced from the same Ripple data source as mobile.
              </p>
            </div>
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

        <section className={`${cardClass} mb-6 px-4 py-4`}>
          <div className="flex flex-wrap gap-2">
            <TabButton label="Focus" active={activeTab === 'focus'} onClick={() => setActiveTab('focus')} />
            <TabButton label="Tasks" active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} />
            <TabButton label="Streak" active={activeTab === 'streak'} onClick={() => setActiveTab('streak')} />
            <TabButton label="Notes" active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} />
            <TabButton label="Goals" active={activeTab === 'goals'} onClick={() => setActiveTab('goals')} />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div className="flex rounded-[18px] bg-slate-100 p-1">
              <RangeButton label="Daily" active={range === 'day'} onClick={() => setRange('day')} />
              <RangeButton label="Weekly" active={range === 'week'} onClick={() => setRange('week')} />
              <RangeButton label="Monthly" active={range === 'month'} onClick={() => setRange('month')} />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-full bg-[#EEF6FD] px-3 py-2 md:justify-start">
              <button
                type="button"
                onClick={goPrev}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 transition hover:text-[#7AB7E8]"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="min-w-[140px] text-center text-sm font-black text-[#2B6DA3]">
                {currentPeriodLabel}
              </span>
              <button
                type="button"
                onClick={goNext}
                disabled={!canGoNext}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 transition hover:text-[#7AB7E8] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </section>

        {activeTab === 'focus' ? (
          <FocusTab {...detail.focus} range={range} />
        ) : activeTab === 'tasks' ? (
          <TasksTab {...detail.todos} />
        ) : activeTab === 'streak' ? (
          <StreakTab summary={data.streakSummary} />
        ) : activeTab === 'notes' ? (
          <NotesTab {...detail.notes} range={range} />
        ) : (
          <GoalsTab {...detail.goals} />
        )}
      </div>
    </main>
  );
}

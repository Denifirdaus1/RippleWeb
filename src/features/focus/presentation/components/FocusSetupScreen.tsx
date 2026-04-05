'use client';
/* eslint-disable @next/next/no-img-element */

import { useState } from 'react';
import { Clock3, Flame, Settings2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PomodoroSettingsSheet } from '@/features/focus/presentation/components/PomodoroSettingsSheet';
import { WavyCircle } from '@/features/focus/presentation/components/WavyCircle';
import { useFocusSetup } from '@/features/focus/presentation/hooks/useFocusSetup';
import { buildStandaloneFocusSessionHref } from '@/features/focus/presentation/utils/focusSessionLaunch';

const formatTotalTime = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  return `${hours}h ${restMinutes}m`;
};

export function FocusSetupScreen({ userId }: { userId: string }) {
  const router = useRouter();
  const { settings, completedSessions, completedMinutes, loading, saving, error, saveSettings } =
    useFocusSetup(userId);

  const [settingsOpen, setSettingsOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[#FFB74D]" />
      </div>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F8FAFC] px-6 pb-12 pt-6 lg:px-10">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center">
        <img
          src="/images/mascot/Ripple_chill and reading.png"
          alt="Ripple mascot"
          className="h-[240px] w-auto object-contain sm:h-[300px]"
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl flex-col">
        <header className="flex items-center gap-4 py-2">
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Focus</h1>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden items-center gap-4 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur sm:flex">
              <div className="flex items-center gap-2">
                <Flame size={16} className="text-[#FFB74D]" />
                <span className="text-sm font-bold text-slate-900">{completedSessions}</span>
              </div>
              <div className="h-3 w-px bg-slate-200" />
              <div className="flex items-center gap-2">
                <Clock3 size={16} className="text-[#7AB7E8]" />
                <span className="text-sm font-bold text-slate-900">
                  {formatTotalTime(completedMinutes)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
              aria-label="Open timer settings"
            >
              <Settings2 size={20} />
            </button>
          </div>
        </header>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        ) : null}

        <div className="mx-auto flex flex-1 flex-col items-center justify-center pb-24 pt-6 text-center">
          <p className="text-3xl font-semibold text-[#FFB74D] sm:text-4xl">Ready to Focus?</p>

          <div className="relative mt-10 flex h-[300px] w-[300px] items-center justify-center sm:h-[340px] sm:w-[340px]">
            <div className="absolute inset-0 flex items-center justify-center">
              <WavyCircle size={300} color="#FFB74D" opacity={0.85} />
            </div>

            <div className="absolute top-[82px] flex items-center justify-center gap-2 sm:top-[94px]">
              {Array.from({ length: settings.sessionsBeforeLongBreak }).map((_, index) => (
                <span
                  key={index}
                  className={`h-3 w-3 rounded-full ${
                    index === 0 ? 'border-2 border-[#FFB74D] bg-orange-100' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>

            <div className="text-[70px] font-black leading-none tracking-[-0.08em] text-[#FFB74D] sm:text-[82px]">
              {String(settings.focusDuration).padStart(2, '0')}:00
            </div>

            <button
              type="button"
              onClick={() => router.push(buildStandaloneFocusSessionHref('/focus'))}
              className="absolute bottom-[60px] transition hover:scale-105 active:scale-95"
              aria-label="Start focus session"
            >
              <img src="/icons/UI/play NBG.png" alt="" className="h-12 w-12 object-contain" />
            </button>
          </div>
        </div>
      </div>

      <PomodoroSettingsSheet
        open={settingsOpen}
        settings={settings}
        saving={saving}
        onClose={() => setSettingsOpen(false)}
        onSave={saveSettings}
      />
    </main>
  );
}

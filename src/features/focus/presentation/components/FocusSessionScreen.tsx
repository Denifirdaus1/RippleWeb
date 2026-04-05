'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Music2 } from 'lucide-react';
import { MusicPlayerSheet } from '@/features/focus/presentation/components/MusicPlayerSheet';
import { WavyCircle } from '@/features/focus/presentation/components/WavyCircle';
import { FocusPhase, FocusSessionLaunchConfig } from '@/features/focus/domain/entities/focusSession';
import { useFocusMusicPlayer } from '@/features/focus/presentation/hooks/useFocusMusicPlayer';
import { usePomodoroSession } from '@/features/focus/presentation/hooks/usePomodoroSession';

const getPhaseColor = (phase: FocusPhase) => {
  if (phase === 'shortBreak' || phase === 'longBreak') {
    return '#B4D8F6';
  }

  if (phase === 'paused') {
    return '#AED581';
  }

  return '#FFB74D';
};

const formatPhaseLabel = (phase: FocusPhase) => {
  if (phase === 'shortBreak') {
    return 'Short Break';
  }

  if (phase === 'longBreak') {
    return 'Long Break';
  }

  if (phase === 'paused') {
    return 'Paused';
  }

  return 'Focus Session';
};

export function FocusSessionScreen({
  userId,
  launchConfig,
}: {
  userId: string;
  launchConfig: FocusSessionLaunchConfig;
}) {
  const router = useRouter();
  const { state, loading, progress, formattedTime, isPaused, exitSession, pause, resume } =
    usePomodoroSession(userId, launchConfig);
  const music = useFocusMusicPlayer();

  const returnTo = launchConfig.returnTo || '/focus';
  const [musicOpen, setMusicOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'portrait' | 'landscape'>('portrait');
  const previousPhaseRef = useRef(state.phase);

  useEffect(() => {
    const currentMode = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    setLayoutMode(currentMode);
  }, []);

  useEffect(() => {
    const previousPhase = previousPhaseRef.current;
    if (previousPhase !== 'idle' && state.phase === 'idle') {
      music.stop();
      if (state.isCycleCompleted) {
        setCompleteOpen(true);
      } else {
        router.push(returnTo);
      }
    }
    previousPhaseRef.current = state.phase;
  }, [music, returnTo, router, state.isCycleCompleted, state.phase]);

  const phaseColor = getPhaseColor(state.phase);
  const timerSize = layoutMode === 'landscape' ? 250 : 260;
  const gifPath =
    state.phase === 'focusing'
      ? '/videos/focus/RippleFocus.gif'
      : '/videos/focus/Ripple Break mode Onsen NBG.gif';

  const sessionDots = useMemo(
    () =>
      Array.from({ length: state.settings.sessionsBeforeLongBreak }).map((_, index) => {
        const isCompleted = index < state.currentSession - 1;
        const isCurrent = index === state.currentSession - 1;
        return { isCompleted, isCurrent, index };
      }),
    [state.currentSession, state.settings.sessionsBeforeLongBreak]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[#FFB74D]" />
      </div>
    );
  }

  const timer = (
    <div className="relative flex items-center justify-center" style={{ width: timerSize, height: timerSize }}>
      <div className="absolute inset-0 flex items-center justify-center">
        <WavyCircle size={timerSize} color={phaseColor} opacity={0.2} />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <WavyCircle size={timerSize} color={phaseColor} value={progress} rotate={-90} />
      </div>

      {state.isPomodoroMode ? (
        <div className="absolute top-[65px] flex items-center gap-2">
          {sessionDots.map((dot) => (
            <span
              key={dot.index}
              className="h-3 w-3 rounded-full"
              style={{
                backgroundColor: dot.isCompleted
                  ? phaseColor
                  : dot.isCurrent
                  ? `${phaseColor}80`
                  : '#E2E8F0',
                border: dot.isCurrent ? `2px solid ${phaseColor}` : undefined,
              }}
            />
          ))}
        </div>
      ) : null}

      <div className="text-center">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.32em] text-slate-400">
          {formatPhaseLabel(state.phase)}
        </p>
        <div
          className="text-[62px] font-black leading-none tracking-[-0.08em] sm:text-[76px]"
          style={{ color: phaseColor }}
        >
          {formattedTime}
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          if (isPaused) {
            resume();
          } else {
            pause();
          }
        }}
        className="absolute bottom-[54px] transition hover:scale-105 active:scale-95"
        aria-label={isPaused ? 'Resume session' : 'Pause session'}
      >
        <img
          src={isPaused ? '/icons/UI/play NBG.png' : '/icons/UI/Pause NBG.png'}
          alt=""
          className="h-12 w-12 object-contain"
        />
      </button>
    </div>
  );

  const gif = (
    <div className="overflow-hidden rounded-[24px]">
      <img src={gifPath} alt="Focus animation" className="h-[230px] w-[230px] object-contain" />
    </div>
  );

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-6 py-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setExitOpen(true)}
            className="transition hover:scale-105 active:scale-95"
            aria-label="Exit session"
          >
            <img src="/icons/UI/close_nbg.png" alt="" className="h-8 w-8 object-contain" />
          </button>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMusicOpen(true)}
              className="transition hover:scale-105 active:scale-95"
              aria-label="Open focus music"
            >
              <img src="/icons/UI/music NBG.png" alt="" className="h-8 w-8 object-contain" />
            </button>
            <button
              type="button"
              onClick={() =>
                setLayoutMode((current) => (current === 'portrait' ? 'landscape' : 'portrait'))
              }
              className="transition hover:scale-105 active:scale-95"
              aria-label="Toggle session layout"
            >
              <img
                src={layoutMode === 'portrait' ? '/icons/UI/Portrait.png' : '/icons/UI/Landscapes.png'}
                alt=""
                className="h-8 w-8 object-contain"
              />
            </button>
          </div>
        </div>

        {state.error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {state.error}
          </div>
        ) : null}

        {layoutMode === 'landscape' ? (
          <div className="mt-10 grid min-h-[calc(100vh-10rem)] items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="flex justify-center">{timer}</div>
            <div className="flex flex-col items-center gap-6">
              {state.linkedTodoTitle ? (
                <div className="w-full max-w-sm rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Linked Task</p>
                  <p className="mt-3 text-xl font-black tracking-tight text-slate-900">
                    {state.linkedTodoTitle}
                  </p>
                </div>
              ) : null}
              {gif}
            </div>
          </div>
        ) : (
          <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center">
            {state.linkedTodoTitle ? (
              <div className="mb-6 w-full max-w-md rounded-[28px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Linked Task</p>
                <p className="mt-3 text-lg font-black tracking-tight text-slate-900">
                  {state.linkedTodoTitle}
                </p>
              </div>
            ) : null}

            {timer}
            <div className="mt-4">{gif}</div>
          </div>
        )}
      </div>

      <MusicPlayerSheet
        open={musicOpen}
        tracks={music.tracks}
        currentTrack={music.currentTrack}
        isPlaying={music.isPlaying}
        volume={music.volume}
        onClose={() => setMusicOpen(false)}
        onPlayTrack={music.playTrack}
        onTogglePlayPause={music.toggleMainPlayPause}
        onNext={music.next}
        onVolumeChange={music.setVolume}
      />

      {exitOpen ? (
        <div className="fixed inset-0 z-[90]">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/35"
            onClick={() => setExitOpen(false)}
            aria-label="Close exit confirmation"
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-[28px] border border-slate-200 bg-white px-6 pb-8 pt-4 shadow-2xl sm:left-1/2 sm:bottom-6 sm:max-w-lg sm:-translate-x-1/2 sm:rounded-[28px]">
            <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-slate-200" />
            <h3 className="text-2xl font-black tracking-tight text-slate-900">End Session Early?</h3>
            <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
              Don&apos;t worry, your progress so far will be saved. Are you sure you want to stop?
            </p>
            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={async () => {
                  music.stop();
                  await exitSession();
                  setExitOpen(false);
                }}
                className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Exit
              </button>
              <button
                type="button"
                onClick={() => setExitOpen(false)}
                className="flex-1 rounded-2xl bg-[#FFB74D] px-4 py-3 text-sm font-bold text-white transition hover:brightness-105"
              >
                Stay Focused
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {completeOpen ? (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/35 px-4">
          <div className="w-full max-w-md rounded-[32px] bg-white px-8 py-8 text-center shadow-2xl">
            <img
              src="/images/mascot/Ripple complete task.png"
              alt="Ripple celebration"
              className="mx-auto h-44 w-auto object-contain"
            />
            <h3 className="mt-6 text-3xl font-black tracking-tight text-slate-900">
              Focus Cycle Complete!
            </h3>
            <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
              You&apos;ve been incredibly productive. Take a moment to celebrate.
            </p>
            <button
              type="button"
              onClick={() => {
                setCompleteOpen(false);
                router.push(returnTo);
              }}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#7AB7E8] px-5 py-4 text-sm font-bold text-white transition hover:brightness-105"
            >
              <Music2 size={18} />
              Back to Dashboard
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}

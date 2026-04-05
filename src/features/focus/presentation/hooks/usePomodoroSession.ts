'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FocusRepository } from '@/features/focus/data/repositories/focus_repository';
import { PomodoroRepository } from '@/features/focus/data/repositories/pomodoro_repository';
import {
  FocusPhase,
  FocusSessionLaunchConfig,
  FocusSessionRecord,
  PomodoroSessionState,
} from '@/features/focus/domain/entities/focusSession';
import {
  DEFAULT_POMODORO_SETTINGS,
  PomodoroSettings,
} from '@/features/focus/domain/entities/pomodoroSettings';
import { TodoRepositoryImpl } from '@/features/todo/data/repositories/todo_repository_impl';

const INITIAL_STATE: PomodoroSessionState = {
  phase: 'idle',
  remainingSeconds: 0,
  totalSeconds: 0,
  currentSession: 1,
  completedSessions: 0,
  completedMinutes: 0,
  settings: DEFAULT_POMODORO_SETTINGS,
  sessionStartedAt: null,
  phaseBeforePause: null,
  linkedTodoId: null,
  linkedTodoTitle: null,
  isPomodoroMode: false,
  isCycleCompleted: false,
  error: null,
};

const phaseToSessionType = (phase: FocusPhase): FocusSessionRecord['sessionType'] =>
  phase === 'focusing' ? 'work' : 'break';

const coerceSettings = (
  baseSettings: PomodoroSettings,
  config: Partial<FocusSessionLaunchConfig>
): PomodoroSettings => ({
  focusDuration: config.focusDurationMinutes ?? baseSettings.focusDuration,
  shortBreakDuration: config.shortBreakMinutes ?? baseSettings.shortBreakDuration,
  longBreakDuration: config.longBreakMinutes ?? baseSettings.longBreakDuration,
  sessionsBeforeLongBreak: config.sessionsCount ?? baseSettings.sessionsBeforeLongBreak,
  autoStartBreaks: config.autoStartBreaks ?? baseSettings.autoStartBreaks,
  autoStartFocus: config.autoStartFocus ?? baseSettings.autoStartFocus,
});

export const usePomodoroSession = (userId: string | undefined, launchConfig: FocusSessionLaunchConfig) => {
  const focusRepository = useMemo(() => new FocusRepository(), []);
  const pomodoroRepository = useMemo(() => new PomodoroRepository(), []);
  const todoRepository = useMemo(() => new TodoRepositoryImpl(), []);

  const [state, setState] = useState<PomodoroSessionState>(INITIAL_STATE);
  const [loading, setLoading] = useState(true);

  const stateRef = useRef(state);
  const autoStartedRef = useRef(false);
  const isCompletingPhaseRef = useRef(false);
  const autoPausedByVisibilityRef = useRef(false);
  stateRef.current = state;

  const setError = useCallback((message: string | null) => {
    setState((current) => ({ ...current, error: message }));
  }, []);

  const startStandaloneFocus = useCallback(
    (config: Partial<FocusSessionLaunchConfig> = {}, resolvedSettings?: PomodoroSettings) => {
      const baseSettings = resolvedSettings ?? stateRef.current.settings;
      const nextSettings = coerceSettings(baseSettings, config);
      const totalSeconds = nextSettings.focusDuration * 60;

      setState((current) => ({
        ...current,
        settings: nextSettings,
        phase: 'focusing',
        remainingSeconds: totalSeconds,
        totalSeconds,
        sessionStartedAt: new Date(),
        phaseBeforePause: null,
        linkedTodoId: null,
        linkedTodoTitle: null,
        isPomodoroMode: config.isPomodoro ?? false,
        isCycleCompleted: false,
        error: null,
      }));
    },
    []
  );

  const startFocusForTodo = useCallback(
    (
      config: Required<Pick<FocusSessionLaunchConfig, 'todoId' | 'todoTitle'>> &
        Partial<FocusSessionLaunchConfig>,
      resolvedSettings?: PomodoroSettings
    ) => {
      const baseSettings = resolvedSettings ?? stateRef.current.settings;
      const nextSettings = coerceSettings(baseSettings, config);
      const focusDuration = config.focusDurationMinutes ?? nextSettings.focusDuration;
      const totalSeconds = focusDuration * 60;

      setState((current) => ({
        ...current,
        settings: nextSettings,
        phase: 'focusing',
        remainingSeconds: totalSeconds,
        totalSeconds,
        sessionStartedAt: new Date(),
        phaseBeforePause: null,
        linkedTodoId: config.todoId,
        linkedTodoTitle: config.todoTitle,
        isPomodoroMode: config.isPomodoro ?? false,
        isCycleCompleted: false,
        error: null,
      }));
    },
    []
  );

  const startShortBreak = useCallback(() => {
    const nextSettings = stateRef.current.settings;
    const totalSeconds = nextSettings.shortBreakDuration * 60;

    setState((current) => ({
      ...current,
      phase: 'shortBreak',
      remainingSeconds: totalSeconds,
      totalSeconds,
      sessionStartedAt: new Date(),
      phaseBeforePause: null,
      error: null,
    }));
  }, []);

  const startLongBreak = useCallback(() => {
    const nextSettings = stateRef.current.settings;
    const totalSeconds = nextSettings.longBreakDuration * 60;

    setState((current) => ({
      ...current,
      phase: 'longBreak',
      remainingSeconds: totalSeconds,
      totalSeconds,
      currentSession: 1,
      sessionStartedAt: new Date(),
      phaseBeforePause: null,
      error: null,
    }));
  }, []);

  const markTodoAsCompleted = useCallback(
    async (todoId: string) => {
      try {
        const todo = await todoRepository.getTodoById(todoId);
        if (!todo || todo.isCompleted) {
          return;
        }

        await todoRepository.saveTodo({
          ...todo,
          isCompleted: true,
          completedAt: new Date(),
        });
      } catch (error) {
        console.error('Failed to auto-complete todo from focus session.', error);
      }
    },
    [todoRepository]
  );

  const saveSession = useCallback(
    async (wasCompleted: boolean, wasInterrupted: boolean) => {
      const current = stateRef.current;
      if (!userId || !current.sessionStartedAt) {
        return;
      }

      const effectivePhase =
        current.phase === 'paused' ? current.phaseBeforePause ?? 'focusing' : current.phase;

      if (effectivePhase === 'idle') {
        return;
      }

      let targetDuration = 0;
      if (effectivePhase === 'focusing') {
        targetDuration = current.settings.focusDuration;
      } else if (effectivePhase === 'shortBreak') {
        targetDuration = current.settings.shortBreakDuration;
      } else if (effectivePhase === 'longBreak') {
        targetDuration = current.settings.longBreakDuration;
      }

      const now = new Date();
      const endedAt = wasCompleted
        ? new Date(current.sessionStartedAt.getTime() + targetDuration * 60 * 1000)
        : now;
      const durationMinutes = wasCompleted
        ? targetDuration
        : Math.max(0, Math.floor((now.getTime() - current.sessionStartedAt.getTime()) / 60000));

      try {
        await focusRepository.saveSession({
          userId,
          todoId: current.linkedTodoId,
          startedAt: current.sessionStartedAt,
          endedAt,
          durationMinutes,
          sessionType: phaseToSessionType(effectivePhase),
          wasCompleted,
          wasInterrupted,
        });
      } catch (error) {
        console.error('Failed to persist focus session.', error);
        setError('Session progress could not be saved.');
      }
    },
    [focusRepository, setError, userId]
  );

  const completeSession = useCallback(async () => {
    const current = stateRef.current;
    await saveSession(true, false);

    const nextCompletedSessions = current.completedSessions + 1;
    const nextCompletedMinutes = current.completedMinutes + current.settings.focusDuration;

    if (!current.isPomodoroMode) {
      if (current.linkedTodoId) {
        await markTodoAsCompleted(current.linkedTodoId);
      }

      setState((previous) => ({
        ...previous,
        completedSessions: nextCompletedSessions,
        completedMinutes: nextCompletedMinutes,
        phase: 'idle',
        remainingSeconds: 0,
        totalSeconds: 0,
        sessionStartedAt: null,
      }));
      return;
    }

    const nextSessionNumber = current.currentSession + 1;
    const shouldTakeLongBreak =
      current.currentSession >= current.settings.sessionsBeforeLongBreak;

    setState((previous) => ({
      ...previous,
      completedSessions: nextCompletedSessions,
      completedMinutes: nextCompletedMinutes,
      currentSession: shouldTakeLongBreak ? 1 : nextSessionNumber,
    }));

    if (current.linkedTodoId && shouldTakeLongBreak) {
      await markTodoAsCompleted(current.linkedTodoId);
    }

    if (shouldTakeLongBreak) {
      if (current.settings.autoStartBreaks) {
        startLongBreak();
      } else {
        setState((previous) => ({
          ...previous,
          phase: 'idle',
          remainingSeconds: 0,
          totalSeconds: 0,
          sessionStartedAt: null,
        }));
      }
      return;
    }

    if (current.settings.autoStartBreaks) {
      startShortBreak();
    } else {
      setState((previous) => ({
        ...previous,
        phase: 'idle',
        remainingSeconds: 0,
        totalSeconds: 0,
        sessionStartedAt: null,
      }));
    }
  }, [markTodoAsCompleted, saveSession, startLongBreak, startShortBreak]);

  const onPhaseComplete = useCallback(async () => {
    if (isCompletingPhaseRef.current) {
      return;
    }

    isCompletingPhaseRef.current = true;

    try {
      const current = stateRef.current;

      if (current.phase === 'focusing') {
        await completeSession();
        return;
      }

      if (current.phase === 'shortBreak') {
        await saveSession(true, false);
        if (current.settings.autoStartFocus) {
          startStandaloneFocus({ isPomodoro: true });
        } else {
          setState((previous) => ({
            ...previous,
            phase: 'idle',
            remainingSeconds: 0,
            totalSeconds: 0,
            sessionStartedAt: null,
          }));
        }
        return;
      }

      if (current.phase === 'longBreak') {
        await saveSession(true, false);
        setState((previous) => ({
          ...previous,
          phase: 'idle',
          remainingSeconds: 0,
          totalSeconds: 0,
          sessionStartedAt: null,
          isCycleCompleted: true,
        }));
      }
    } finally {
      isCompletingPhaseRef.current = false;
    }
  }, [completeSession, saveSession, startStandaloneFocus]);

  const pause = useCallback(() => {
    const current = stateRef.current;
    if (current.phase === 'idle' || current.phase === 'paused') {
      return;
    }

    setState((previous) => ({
      ...previous,
      phase: 'paused',
      phaseBeforePause: previous.phase as Exclude<FocusPhase, 'idle' | 'paused'>,
    }));
  }, []);

  const resume = useCallback(() => {
    const current = stateRef.current;
    if (current.phase !== 'paused' || !current.phaseBeforePause) {
      return;
    }

    setState((previous) => ({
      ...previous,
      phase: previous.phaseBeforePause ?? 'focusing',
      phaseBeforePause: null,
    }));
  }, []);

  const exitSession = useCallback(async () => {
    const current = stateRef.current;
    const effectivePhase =
      current.phase === 'paused' ? current.phaseBeforePause ?? 'focusing' : current.phase;

    if (effectivePhase === 'focusing' || effectivePhase === 'shortBreak' || effectivePhase === 'longBreak') {
      await saveSession(false, true);
    }

    setState((previous) => ({
      ...previous,
      phase: 'idle',
      remainingSeconds: 0,
      totalSeconds: 0,
      sessionStartedAt: null,
      phaseBeforePause: null,
      linkedTodoId: null,
      linkedTodoTitle: null,
      isCycleCompleted: false,
    }));
  }, [saveSession]);

  useEffect(() => {
    if (state.phase === 'idle' || state.phase === 'paused') {
      return;
    }

    const timer = window.setInterval(() => {
      const current = stateRef.current;
      if (current.remainingSeconds > 0) {
        setState((previous) => ({
          ...previous,
          remainingSeconds: Math.max(previous.remainingSeconds - 1, 0),
        }));
        return;
      }

      void onPhaseComplete();
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [onPhaseComplete, state.phase]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const current = stateRef.current;
      if (document.hidden) {
        if (current.phase !== 'idle' && current.phase !== 'paused') {
          autoPausedByVisibilityRef.current = true;
          pause();
        }
        return;
      }

      if (autoPausedByVisibilityRef.current && current.phase === 'paused') {
        autoPausedByVisibilityRef.current = false;
        resume();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pause, resume]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [settings, completedSessions, completedMinutes] = await Promise.all([
          pomodoroRepository.getSettings(userId),
          focusRepository.getTodayCompletedCount(userId),
          focusRepository.getTodayFocusMinutes(userId),
        ]);

        if (!isMounted) {
          return;
        }

        setState((previous) => ({
          ...previous,
          settings,
          completedSessions,
          completedMinutes,
          error: null,
        }));

        if (launchConfig.autoStart && !autoStartedRef.current) {
          autoStartedRef.current = true;
          if (launchConfig.todoId && launchConfig.todoTitle) {
            startFocusForTodo(
              {
                ...launchConfig,
                todoId: launchConfig.todoId,
                todoTitle: launchConfig.todoTitle,
              },
              settings
            );
          } else {
            startStandaloneFocus(launchConfig, settings);
          }
        }
      } catch (error) {
        console.error('Failed to initialize focus session.', error);
        if (isMounted) {
          setError('Failed to load focus session.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [
    focusRepository,
    launchConfig,
    pomodoroRepository,
    setError,
    startFocusForTodo,
    startStandaloneFocus,
    userId,
  ]);

  const progress = state.totalSeconds > 0 ? state.remainingSeconds / state.totalSeconds : 0;
  const isRunning = state.phase !== 'idle' && state.phase !== 'paused';
  const isPaused = state.phase === 'paused';
  const formattedTime = `${Math.floor(state.remainingSeconds / 60)
    .toString()
    .padStart(2, '0')}:${(state.remainingSeconds % 60).toString().padStart(2, '0')}`;

  return {
    state,
    loading,
    progress,
    isRunning,
    isPaused,
    formattedTime,
    pause,
    resume,
    exitSession,
  };
};

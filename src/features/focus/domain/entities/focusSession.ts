import { PomodoroSettings } from './pomodoroSettings';

export type SessionType = 'work' | 'break';
export type FocusPhase = 'idle' | 'focusing' | 'shortBreak' | 'longBreak' | 'paused';

export interface FocusSessionRecord {
  userId: string;
  todoId?: string | null;
  startedAt: Date;
  endedAt?: Date | null;
  durationMinutes?: number | null;
  sessionType: SessionType;
  wasCompleted: boolean;
  wasInterrupted: boolean;
}

export interface FocusSessionLaunchConfig {
  autoStart: boolean;
  isPomodoro: boolean;
  returnTo?: string;
  todoId?: string;
  todoTitle?: string;
  focusDurationMinutes?: number;
  shortBreakMinutes?: number;
  longBreakMinutes?: number;
  sessionsCount?: number;
  autoStartBreaks?: boolean;
  autoStartFocus?: boolean;
}

export interface PomodoroSessionState {
  phase: FocusPhase;
  remainingSeconds: number;
  totalSeconds: number;
  currentSession: number;
  completedSessions: number;
  completedMinutes: number;
  settings: PomodoroSettings;
  sessionStartedAt: Date | null;
  phaseBeforePause: Exclude<FocusPhase, 'idle' | 'paused'> | null;
  linkedTodoId: string | null;
  linkedTodoTitle: string | null;
  isPomodoroMode: boolean;
  isCycleCompleted: boolean;
  error: string | null;
}


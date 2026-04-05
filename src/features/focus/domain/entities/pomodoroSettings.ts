export interface PomodoroSettings {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
}

export const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
  autoStartBreaks: true,
  autoStartFocus: false,
};

export const normalizePomodoroSettings = (
  raw?: Partial<{
    focus_duration: number | null;
    short_break_duration: number | null;
    long_break_duration: number | null;
    sessions_before_long_break: number | null;
    auto_start_breaks: boolean | null;
    auto_start_focus: boolean | null;
  }> | null
): PomodoroSettings => ({
  focusDuration: raw?.focus_duration ?? DEFAULT_POMODORO_SETTINGS.focusDuration,
  shortBreakDuration: raw?.short_break_duration ?? DEFAULT_POMODORO_SETTINGS.shortBreakDuration,
  longBreakDuration: raw?.long_break_duration ?? DEFAULT_POMODORO_SETTINGS.longBreakDuration,
  sessionsBeforeLongBreak:
    raw?.sessions_before_long_break ?? DEFAULT_POMODORO_SETTINGS.sessionsBeforeLongBreak,
  autoStartBreaks: raw?.auto_start_breaks ?? DEFAULT_POMODORO_SETTINGS.autoStartBreaks,
  autoStartFocus: raw?.auto_start_focus ?? DEFAULT_POMODORO_SETTINGS.autoStartFocus,
});


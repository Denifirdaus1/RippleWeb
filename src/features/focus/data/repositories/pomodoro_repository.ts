import { supabase } from '@/core/utils/supabase';
import {
  DEFAULT_POMODORO_SETTINGS,
  normalizePomodoroSettings,
  PomodoroSettings,
} from '@/features/focus/domain/entities/pomodoroSettings';

export class PomodoroRepository {
  async getSettings(userId?: string): Promise<PomodoroSettings> {
    if (!userId) {
      return DEFAULT_POMODORO_SETTINGS;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('pomodoro_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return DEFAULT_POMODORO_SETTINGS;
      }

      return normalizePomodoroSettings(data);
    } catch (error) {
      console.error('Failed to load pomodoro settings.', error);
      return DEFAULT_POMODORO_SETTINGS;
    }
  }

  async saveSettings(userId: string | undefined, settings: PomodoroSettings): Promise<void> {
    if (!userId) {
      return;
    }

    const payload = {
      user_id: userId,
      focus_duration: settings.focusDuration,
      short_break_duration: settings.shortBreakDuration,
      long_break_duration: settings.longBreakDuration,
      sessions_before_long_break: settings.sessionsBeforeLongBreak,
      auto_start_breaks: settings.autoStartBreaks,
      auto_start_focus: settings.autoStartFocus,
      updated_at: new Date().toISOString(),
    };

    const { error } = await (supabase as any).from('pomodoro_settings').upsert(payload);

    if (error) {
      throw error;
    }
  }
}


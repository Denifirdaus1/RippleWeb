import { supabase } from '@/core/utils/supabase';
import { FocusSessionRecord } from '@/features/focus/domain/entities/focusSession';

const getLocalDayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
};

export class FocusRepository {
  async saveSession(session: FocusSessionRecord): Promise<void> {
    const payload = {
      user_id: session.userId,
      todo_id: session.todoId ?? null,
      started_at: session.startedAt.toISOString(),
      ended_at: session.endedAt?.toISOString() ?? null,
      session_type: session.sessionType,
      was_completed: session.wasCompleted,
      was_interrupted: session.wasInterrupted,
    };

    const { error } = await (supabase as any).from('focus_sessions').insert(payload);

    if (error) {
      throw error;
    }
  }

  async getTodayCompletedCount(userId?: string): Promise<number> {
    if (!userId) {
      return 0;
    }

    const { start, end } = getLocalDayRange();
    const { count, error } = await (supabase as any)
      .from('focus_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('was_completed', true)
      .eq('session_type', 'work')
      .gte('started_at', start.toISOString())
      .lt('started_at', end.toISOString());

    if (error) {
      throw error;
    }

    return count ?? 0;
  }

  async getTodayFocusMinutes(userId?: string): Promise<number> {
    if (!userId) {
      return 0;
    }

    const { start, end } = getLocalDayRange();
    const { data, error } = await (supabase as any)
      .from('focus_sessions')
      .select('duration_minutes')
      .eq('user_id', userId)
      .eq('session_type', 'work')
      .gte('started_at', start.toISOString())
      .lt('started_at', end.toISOString());

    if (error) {
      throw error;
    }

    return (data ?? []).reduce((sum: number, item: { duration_minutes?: number | null }) => {
      return sum + (item.duration_minutes ?? 0);
    }, 0);
  }
}

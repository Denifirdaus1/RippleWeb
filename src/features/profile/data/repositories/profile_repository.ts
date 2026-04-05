import { getSupabaseClient } from '@/core/utils/supabase';
import {
  DailyFocusStat,
  DailyTodoStat,
  PocketFolderSummary,
  ProfileStatsEntity,
  SavedContentItem,
  StreakSummary,
  StreakDay,
  StreakStatus,
  TodoPriorityStat,
  UserProfileEntity,
} from '@/features/profile/domain/entities/profile';
import {
  FocusDetail,
  GoalProgress,
  GoalsDetail,
  NotesDetail,
  SessionItem,
  StatsDelta,
  StatsDetailEntity,
  StatsDetailSnapshot,
  StatsPeriod,
  StatsRange,
  TodoDetail,
  TrendPoint,
} from '@/features/profile/domain/entities/stats_detail';

const asRecord = (value: unknown): Record<string, any> =>
  typeof value === 'object' && value !== null ? (value as Record<string, any>) : {};

const asArray = <T = any>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const parseStreakStatus = (value: unknown): StreakStatus => {
  if (value === 'safe' || value === 'risk' || value === 'freeze_used') {
    return value;
  }

  return 'broken';
};

const parseDateKey = (value: unknown) => {
  if (typeof value !== 'string') {
    return new Date().toISOString().slice(0, 10);
  }

  return value.slice(0, 10);
};

const normalizeTodoDaily = (value: unknown): DailyTodoStat[] =>
  asArray(value)
    .map((entry) => {
      const item = asRecord(entry);
      return {
        date: parseDateKey(item.date),
        count: Number(item.count ?? 0),
      };
    })
    .sort((left, right) => left.date.localeCompare(right.date));

const normalizeFocusDaily = (value: unknown): DailyFocusStat[] =>
  asArray(value)
    .map((entry) => {
      const item = asRecord(entry);
      return {
        date: parseDateKey(item.date),
        minutes: Number(item.minutes ?? 0),
      };
    })
    .sort((left, right) => left.date.localeCompare(right.date));

const normalizePriorityStats = (value: unknown): TodoPriorityStat[] =>
  asArray(value).map((entry) => {
    const item = asRecord(entry);
    return {
      priority: String(item.priority ?? 'unknown'),
      count: Number(item.count ?? 0),
    };
  });

const normalizeStreakSummary = (value: unknown): StreakSummary | null => {
  const summary = asRecord(value);
  if (!Object.keys(summary).length) {
    return null;
  }

  return {
    count: Number(summary.streak ?? 0),
    status: parseStreakStatus(summary.status),
    freezeCount: Number(summary.freeze_count ?? 0),
    lastActiveDate: typeof summary.last_active_date === 'string' ? summary.last_active_date : null,
    lastFreezeUsedDate:
      typeof summary.last_freeze_used_date === 'string' ? summary.last_freeze_used_date : null,
    days: asArray(summary.days).map((entry) => {
      const item = asRecord(entry);
      return {
        date: parseDateKey(item.date),
        status:
          item.status === 'active' ||
          item.status === 'frozen' ||
          item.status === 'missed' ||
          item.status === 'today_pending'
            ? item.status
            : 'missed',
      } satisfies StreakDay;
    }),
  };
};

const parseDateTime = (value: unknown) => {
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return new Date().toISOString();
};

const parseStatsRange = (value: unknown): StatsRange =>
  value === 'day' || value === 'month' ? value : 'week';

const normalizeTrend = (value: unknown, key: 'minutes' | 'count'): TrendPoint[] =>
  asArray(value).map((entry) => {
    const item = asRecord(entry);
    return {
      date: parseDateKey(item.date),
      value: Number(item[key] ?? 0),
    };
  });

const normalizeDelta = (value: unknown): StatsDelta => {
  const item = asRecord(value);
  return {
    current: Number(item.current ?? 0),
    previous: Number(item.previous ?? 0),
    delta: Number(item.delta ?? 0),
    percent: Number(item.percent ?? 0),
  };
};

const normalizeSessions = (value: unknown): SessionItem[] =>
  asArray(value).map((entry) => {
    const item = asRecord(entry);
    return {
      startedAt: parseDateTime(item.started_at),
      endedAt: item.ended_at ? parseDateTime(item.ended_at) : null,
      durationMinutes: Number(item.duration_minutes ?? 0),
      wasCompleted: Boolean(item.was_completed),
      wasInterrupted: Boolean(item.was_interrupted),
    };
  });

const normalizeGoalProgress = (value: unknown): GoalProgress[] =>
  asArray(value).map((entry) => {
    const item = asRecord(entry);
    return {
      id: String(item.id ?? ''),
      title: String(item.title ?? ''),
      progress: Number(item.progress ?? 0),
      color: typeof item.color === 'string' ? item.color : null,
    };
  });

const parseStatsPeriod = (value: unknown): StatsPeriod => {
  const item = asRecord(value);
  return {
    range: parseStatsRange(item.range),
    start: parseDateKey(item.start),
    end: parseDateKey(item.end),
  };
};

const parseFocusDetail = (value: unknown, totalBreakMinutes: number): FocusDetail => {
  const item = asRecord(value);
  return {
    todayMinutes: Number(item.today_minutes ?? 0),
    todaySessions: Number(item.today_sessions ?? 0),
    totalSessions: Number(item.total_sessions ?? 0),
    longestSessionMinutes: Number(item.longest_session_minutes ?? 0),
    totalMinutes: Number(item.total_minutes ?? 0),
    totalBreakMinutes,
    avgDailyMinutes: Number(item.avg_daily_minutes ?? 0),
    trend: normalizeTrend(item.trend, 'minutes'),
    sessions: normalizeSessions(item.sessions),
    delta: normalizeDelta(item.delta),
  };
};

const parseTodoDetail = (value: unknown): TodoDetail => {
  const item = asRecord(value);
  return {
    total: Number(item.total ?? 0),
    completed: Number(item.completed ?? 0),
    overdue: Number(item.overdue ?? 0),
    completionRate: Number(item.completion_rate ?? 0),
    byPriority: normalizePriorityStats(item.by_priority),
    trend: normalizeTrend(item.trend, 'count'),
    delta: normalizeDelta(item.delta),
  };
};

const parseNotesDetail = (value: unknown): NotesDetail => {
  const item = asRecord(value);
  return {
    total: Number(item.total ?? 0),
    favorites: Number(item.favorites ?? 0),
    createdInPeriod: Number(item.created_in_period ?? 0),
    avgDaily: Number(item.avg_daily ?? 0),
    trend: normalizeTrend(item.trend, 'count'),
    delta: normalizeDelta(item.delta),
  };
};

const parseGoalsDetail = (value: unknown): GoalsDetail => {
  const item = asRecord(value);
  return {
    totalGoals: Number(item.total_goals ?? 0),
    milestonesCompleted: Number(item.milestones_completed ?? 0),
    activeGoals: Number(item.active_goals ?? 0),
    progressList: normalizeGoalProgress(item.progress_list),
    delta: normalizeDelta(item.delta),
  };
};

const toDateOnly = (value: Date) => value.toISOString().slice(0, 10);

const startOfLocalDay = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
};

const ensureClient = () => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase client is unavailable.');
  }

  return client as any;
};

export class ProfileRepository {
  async getProfile(userId: string, timezoneOverride?: string): Promise<UserProfileEntity | null> {
    const client = ensureClient();
    const { data, error } = await client
      .from('profiles')
      .select('id, display_name, avatar_url, timezone, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      displayName: data.display_name,
      avatarUrl: data.avatar_url,
      timezone: timezoneOverride || data.timezone || 'UTC',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async updateDisplayName(userId: string, displayName: string) {
    const client = ensureClient();
    const { error } = await client
      .from('profiles')
      .update({
        display_name: displayName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      throw error;
    }
  }

  async uploadAvatar(userId: string, file: File) {
    const client = ensureClient();
    const extension = file.name.split('.').pop() || 'jpg';
    const filePath = `${userId}/avatar_${Date.now()}.${extension}`;

    const { error: uploadError } = await client.storage.from('user-avatars').upload(filePath, file, {
      upsert: true,
      contentType: file.type || 'image/jpeg',
    });

    if (uploadError) {
      throw uploadError;
    }

    const {
      data: { publicUrl },
    } = client.storage.from('user-avatars').getPublicUrl(filePath);

    const { error: updateError } = await client
      .from('profiles')
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    return publicUrl as string;
  }

  async getProfileStats(userId: string, timezoneOverride?: string): Promise<ProfileStatsEntity | null> {
    const client = ensureClient();
    const [{ data: baseStats, error: statsError }, profile] = await Promise.all([
      client.rpc('get_user_comprehensive_stats', { p_user_id: userId }),
      client.from('profiles').select('timezone').eq('id', userId).maybeSingle(),
    ]);

    if (statsError) {
      throw statsError;
    }

    if (!baseStats) {
      return null;
    }

    const timezone = timezoneOverride?.trim()
      ? timezoneOverride.trim()
      : typeof profile.data?.timezone === 'string' && profile.data.timezone.trim()
      ? profile.data.timezone.trim()
      : 'UTC';

    const [{ data: weeklyStats, error: weeklyError }, { data: streakStats, error: streakError }] =
      await Promise.all([
        client.rpc('get_user_weekly_activity', { p_user_id: userId, p_timezone: timezone }),
        client.rpc('get_user_streak_status', { p_user_id: userId, p_timezone: timezone }),
      ]);

    if (weeklyError) {
      throw weeklyError;
    }

    if (streakError) {
      throw streakError;
    }

    const raw = asRecord(baseStats);
    const todoStats = asRecord(raw.todos);
    const focusStats = asRecord(raw.focus);
    const noteStats = asRecord(raw.notes);
    const goalStats = asRecord(raw.goals);
    const weekly = asRecord(weeklyStats);
    const streakSummary = normalizeStreakSummary(streakStats);

    return {
      todoStats: {
        total: Number(todoStats.total ?? 0),
        completed: Number(todoStats.completed ?? 0),
        overdue: Number(todoStats.overdue ?? 0),
        completionRate: Number(todoStats.completion_rate ?? 0),
        byPriority: normalizePriorityStats(todoStats.by_priority),
        dailyActivity: normalizeTodoDaily(weekly.todos_daily),
      },
      focusStats: {
        totalMinutes: Number(focusStats.total_minutes ?? 0),
        completedSessions: Number(focusStats.completed_sessions ?? 0),
        dailyActivity: normalizeFocusDaily(weekly.focus_daily),
      },
      noteStats: {
        total: Number(noteStats.total ?? 0),
        favorites: Number(noteStats.favorites ?? 0),
      },
      goalStats: {
        total: Number(goalStats.total ?? 0),
        milestonesCompleted: Number(goalStats.milestones_completed ?? 0),
      },
      dayStreak: streakSummary?.count ?? Number(raw.day_streak ?? 0),
      streakSummary,
    };
  }

  async getStatsDetail(
    userId: string,
    range: StatsRange,
    anchorDate: Date,
    timezoneOverride?: string
  ): Promise<StatsDetailSnapshot | null> {
    const client = ensureClient();
    const timezone = timezoneOverride?.trim() || 'UTC';
    const anchor = toDateOnly(new Date(anchorDate.getFullYear(), anchorDate.getMonth(), anchorDate.getDate()));

    const [{ data: response, error }, profileStats] = await Promise.all([
      client.rpc('get_user_stats_detail', {
        p_user_id: userId,
        p_timezone: timezone,
        p_range: range,
        p_anchor: anchor,
      }),
      this.getProfileStats(userId, timezone),
    ]);

    if (error) {
      throw error;
    }

    if (!response) {
      return null;
    }

    const raw = asRecord(response);
    const period = parseStatsPeriod(raw.period);
    const totalBreakMinutes = await this.getBreakMinutes(userId, period.start, period.end);

    const detail: StatsDetailEntity = {
      period,
      focus: parseFocusDetail(raw.focus, totalBreakMinutes),
      todos: parseTodoDetail(raw.todos),
      notes: parseNotesDetail(raw.notes),
      goals: parseGoalsDetail(raw.goals),
    };

    return {
      detail,
      streakSummary: profileStats?.streakSummary ?? null,
    };
  }

  private async getBreakMinutes(userId: string, startDate: string, endDate: string) {
    const client = ensureClient();
    const start = startOfLocalDay(startDate);
    const endExclusive = startOfLocalDay(endDate);
    endExclusive.setDate(endExclusive.getDate() + 1);

    const { data, error } = await client
      .from('focus_sessions')
      .select('duration_minutes')
      .eq('user_id', userId)
      .eq('session_type', 'break')
      .gte('started_at', start.toISOString())
      .lt('started_at', endExclusive.toISOString());

    if (error) {
      console.error('Failed to load break minutes.', error);
      return 0;
    }

    return asArray(data).reduce((sum, entry) => sum + Number(asRecord(entry).duration_minutes ?? 0), 0);
  }

  async getUnlockedBadgeIds(userId: string) {
    const client = ensureClient();
    const { data, error } = await client
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return new Set(asArray(data).map((entry) => String(asRecord(entry).badge_id)));
  }

  async getPocketFolders(userId: string): Promise<PocketFolderSummary[]> {
    const client = ensureClient();
    const { data, error } = await client
      .from('pocket_folders')
      .select('id, name, icon, is_default, order_index, saved_contents(count)')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return asArray(data).map((entry) => {
      const item = asRecord(entry);
      const countData = asArray(item.saved_contents);
      const countRecord = countData.length > 0 ? asRecord(countData[0]) : {};

      return {
        id: String(item.id),
        name: String(item.name ?? 'Folder'),
        icon: typeof item.icon === 'string' ? item.icon : null,
        itemCount: Number(countRecord.count ?? 0),
        isDefault: Boolean(item.is_default),
        orderIndex: Number(item.order_index ?? 0),
      };
    });
  }

  async getSavedContents(userId: string, folderId?: string): Promise<SavedContentItem[]> {
    const client = ensureClient();
    let query = client
      .from('saved_contents')
      .select('id, url, title, folder_id, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (folderId) {
      query = query.eq('folder_id', folderId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return asArray(data).map((entry) => {
      const item = asRecord(entry);
      return {
        id: String(item.id),
        url: String(item.url ?? ''),
        title: typeof item.title === 'string' ? item.title : null,
        folderId: typeof item.folder_id === 'string' ? item.folder_id : null,
        createdAt: String(item.created_at ?? new Date().toISOString()),
        updatedAt: String(item.updated_at ?? new Date().toISOString()),
      };
    });
  }
}

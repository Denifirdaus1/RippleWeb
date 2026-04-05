import { getSupabaseClient } from '@/core/utils/supabase';
import {
  DailyFocusStat,
  DailyTodoStat,
  PocketFolderSummary,
  ProfileStatsEntity,
  SavedContentItem,
  StreakDay,
  StreakStatus,
  StreakSummary,
  TodoPriorityStat,
  UserProfileEntity,
} from '@/features/profile/domain/entities/profile';

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

const ensureClient = () => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase client is unavailable.');
  }

  return client as any;
};

export class ProfileRepository {
  async getProfile(userId: string): Promise<UserProfileEntity | null> {
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
      timezone: data.timezone ?? 'UTC',
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

  async getProfileStats(userId: string): Promise<ProfileStatsEntity | null> {
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

    const timezone =
      typeof profile.data?.timezone === 'string' && profile.data.timezone.trim()
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

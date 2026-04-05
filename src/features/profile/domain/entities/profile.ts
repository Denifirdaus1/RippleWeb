export type UserProfileEntity = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  timezone: string;
  createdAt: string;
  updatedAt: string;
};

export type DailyTodoStat = {
  date: string;
  count: number;
};

export type DailyFocusStat = {
  date: string;
  minutes: number;
};

export type TodoPriorityStat = {
  priority: string;
  count: number;
};

export type TodoStats = {
  total: number;
  completed: number;
  overdue: number;
  completionRate: number;
  byPriority: TodoPriorityStat[];
  dailyActivity: DailyTodoStat[];
};

export type FocusStats = {
  totalMinutes: number;
  completedSessions: number;
  dailyActivity: DailyFocusStat[];
};

export type NoteStats = {
  total: number;
  favorites: number;
};

export type GoalStats = {
  total: number;
  milestonesCompleted: number;
};

export type StreakStatus = 'safe' | 'risk' | 'freeze_used' | 'broken';
export type StreakDayStatus = 'active' | 'frozen' | 'missed' | 'today_pending';

export type StreakDay = {
  date: string;
  status: StreakDayStatus;
};

export type StreakSummary = {
  count: number;
  status: StreakStatus;
  freezeCount: number;
  lastActiveDate: string | null;
  lastFreezeUsedDate: string | null;
  days: StreakDay[];
};

export type ProfileStatsEntity = {
  todoStats: TodoStats;
  focusStats: FocusStats;
  noteStats: NoteStats;
  goalStats: GoalStats;
  dayStreak: number;
  streakSummary: StreakSummary | null;
};

export type PocketFolderSummary = {
  id: string;
  name: string;
  icon: string | null;
  itemCount: number;
  isDefault: boolean;
  orderIndex: number;
};

export type SavedContentItem = {
  id: string;
  url: string;
  title: string | null;
  folderId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BadgeType = 'focus' | 'task' | 'journal';

export type BadgeDefinition = {
  id: string;
  title: string;
  description: string;
  assetPath: string;
  type: BadgeType;
  currentValueKey: 'focusMinutes' | 'completedTasks' | 'completedGoals' | 'journalEntries';
  targetValue: number;
};

export type BadgePreview = BadgeDefinition & {
  isUnlocked: boolean;
  currentValue: number;
  progress: number;
};

export const badgeDefinitions: BadgeDefinition[] = [
  {
    id: 'balanced_stones',
    title: 'Balanced Stones',
    description: 'Complete your first 25 minutes of focus.',
    assetPath: '/icons/badges/Balanced Stones.png',
    type: 'focus',
    currentValueKey: 'focusMinutes',
    targetValue: 25,
  },
  {
    id: 'smooth_pebble',
    title: 'Smooth Pebble',
    description: 'Accumulate 300 focus minutes.',
    assetPath: '/icons/badges/Smooth Pebble.png',
    type: 'focus',
    currentValueKey: 'focusMinutes',
    targetValue: 300,
  },
  {
    id: 'pearl_oyster',
    title: 'Pearl Oyster',
    description: 'Accumulate 3000 focus minutes.',
    assetPath: '/icons/badges/Pearl Oyster.png',
    type: 'focus',
    currentValueKey: 'focusMinutes',
    targetValue: 3000,
  },
  {
    id: 'glowing_crystal',
    title: 'Glowing Crystal',
    description: 'Accumulate 6000 focus minutes.',
    assetPath: '/icons/badges/Glowing Crystal.png',
    type: 'focus',
    currentValueKey: 'focusMinutes',
    targetValue: 6000,
  },
  {
    id: 'lucky_guppy',
    title: 'Lucky Guppy',
    description: 'Finish 10 tasks.',
    assetPath: '/icons/badges/Lucky Guppy.png',
    type: 'task',
    currentValueKey: 'completedTasks',
    targetValue: 10,
  },
  {
    id: 'chubby_salmon',
    title: 'Chubby Salmon',
    description: 'Finish 100 tasks.',
    assetPath: '/icons/badges/Chubby Salmon.png',
    type: 'task',
    currentValueKey: 'completedTasks',
    targetValue: 100,
  },
  {
    id: 'sunken_chest',
    title: 'Sunken Chest',
    description: 'Complete 3 goals.',
    assetPath: '/icons/badges/Sunken Chest.png',
    type: 'task',
    currentValueKey: 'completedGoals',
    targetValue: 3,
  },
  {
    id: 'king_of_the_river',
    title: 'King of the River',
    description: 'Finish 1000 tasks.',
    assetPath: '/icons/badges/King of the River.png',
    type: 'task',
    currentValueKey: 'completedTasks',
    targetValue: 1000,
  },
  {
    id: 'leaf_note',
    title: 'Leaf Note',
    description: 'Create your first note.',
    assetPath: '/icons/badges/Leaf Note.png',
    type: 'journal',
    currentValueKey: 'journalEntries',
    targetValue: 1,
  },
  {
    id: 'shiny_shell',
    title: 'Shiny Shell',
    description: 'Create 10 notes.',
    assetPath: '/icons/badges/Shiny Shell.png',
    type: 'journal',
    currentValueKey: 'journalEntries',
    targetValue: 10,
  },
  {
    id: 'message_in_a_bottle',
    title: 'Message in a Bottle',
    description: 'Create 50 notes.',
    assetPath: '/icons/badges/Message in a Bottle.png',
    type: 'journal',
    currentValueKey: 'journalEntries',
    targetValue: 50,
  },
  {
    id: 'the_golden_quill',
    title: 'The Golden Quill',
    description: 'Create 100 notes.',
    assetPath: '/icons/badges/The Golden Quill.png',
    type: 'journal',
    currentValueKey: 'journalEntries',
    targetValue: 100,
  },
];

const badgeProgressValue = (definition: BadgeDefinition, stats: ProfileStatsEntity) => {
  if (definition.currentValueKey === 'focusMinutes') {
    return stats.focusStats.totalMinutes;
  }

  if (definition.currentValueKey === 'completedGoals') {
    return stats.goalStats.milestonesCompleted;
  }

  if (definition.currentValueKey === 'journalEntries') {
    return stats.noteStats.total;
  }

  return stats.todoStats.completed;
};

export const buildBadgePreview = (stats: ProfileStatsEntity, unlockedBadgeIds: Set<string>) =>
  badgeDefinitions.map((definition) => {
    const currentValue = badgeProgressValue(definition, stats);
    return {
      ...definition,
      isUnlocked: unlockedBadgeIds.has(definition.id),
      currentValue,
      progress: Math.min(currentValue / definition.targetValue, 1),
    } satisfies BadgePreview;
  });

export const getStreakIconPath = (summary: StreakSummary | null, dayStreak: number) => {
  if (!summary) {
    if (dayStreak >= 50) return '/icons/streak/Streak_day50-100.png';
    if (dayStreak >= 11) return '/icons/streak/Streak_day11-49.png';
    return '/icons/streak/Streak_day1-10.png';
  }

  if (summary.status === 'broken') return '/icons/streak/Streak_deadth.png';
  if (summary.status === 'freeze_used') return '/icons/streak/Streak_frezz.png';
  if (summary.count >= 50) return '/icons/streak/Streak_day50-100.png';
  if (summary.count >= 11) return '/icons/streak/Streak_day11-49.png';
  return '/icons/streak/Streak_day1-10.png';
};

export const formatFocusDuration = (totalMinutes: number) => {
  if (totalMinutes < 60) return `${totalMinutes}m`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

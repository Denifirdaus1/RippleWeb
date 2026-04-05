import { StreakSummary, TodoPriorityStat } from '@/features/profile/domain/entities/profile';

export type StatsRange = 'day' | 'week' | 'month';

export type StatsPeriod = {
  range: StatsRange;
  start: string;
  end: string;
};

export type TrendPoint = {
  date: string;
  value: number;
};

export type SessionItem = {
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number;
  wasCompleted: boolean;
  wasInterrupted: boolean;
};

export type StatsDelta = {
  current: number;
  previous: number;
  delta: number;
  percent: number;
};

export type FocusDetail = {
  todayMinutes: number;
  todaySessions: number;
  totalSessions: number;
  longestSessionMinutes: number;
  totalMinutes: number;
  totalBreakMinutes: number;
  avgDailyMinutes: number;
  trend: TrendPoint[];
  sessions: SessionItem[];
  delta: StatsDelta;
};

export type TodoDetail = {
  total: number;
  completed: number;
  overdue: number;
  completionRate: number;
  byPriority: TodoPriorityStat[];
  trend: TrendPoint[];
  delta: StatsDelta;
};

export type NotesDetail = {
  total: number;
  favorites: number;
  createdInPeriod: number;
  avgDaily: number;
  trend: TrendPoint[];
  delta: StatsDelta;
};

export type GoalProgress = {
  id: string;
  title: string;
  progress: number;
  color: string | null;
};

export type GoalsDetail = {
  totalGoals: number;
  milestonesCompleted: number;
  activeGoals: number;
  progressList: GoalProgress[];
  delta: StatsDelta;
};

export type StatsDetailEntity = {
  period: StatsPeriod;
  focus: FocusDetail;
  todos: TodoDetail;
  notes: NotesDetail;
  goals: GoalsDetail;
};

export type StatsDetailSnapshot = {
  detail: StatsDetailEntity;
  streakSummary: StreakSummary | null;
};

export type TodoPriority = 'high' | 'medium' | 'low';

export interface Todo {
  id: string;
  userId: string;
  title: string;
  description?: string;
  priority: TodoPriority;
  isCompleted: boolean;
  completedAt?: Date;
  isScheduled: boolean;
  scheduledDate?: Date;
  startTime?: Date;
  endTime?: Date;
  focusEnabled: boolean;
  focusDurationMinutes?: number;
  isPomodoroCustom: boolean;
  pomodoroShortBreakMinutes?: number;
  pomodoroLongBreakMinutes?: number;
  pomodoroSessionsCount?: number;
  milestoneId?: string;
  recurrenceRule?: any;
  parentTodoId?: string;
  notificationSent: boolean;
  reminderMinutes: number;
  iconPath?: string;
  category?: string;
  webLink?: string;
  createdAt: Date;
  updatedAt: Date;
}

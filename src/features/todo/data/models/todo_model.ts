import { Todo, TodoPriority } from '../../domain/entities/todo';
import { Database } from '@/core/types/supabase';

type TodoRow = Database['public']['Tables']['todos']['Row'];

export class TodoModel {
  static fromSupabase(row: TodoRow): Todo {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      description: row.description || undefined,
      priority: (row.priority as TodoPriority) || 'medium',
      isCompleted: row.is_completed,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      isScheduled: row.is_scheduled,
      scheduledDate: row.scheduled_date ? new Date(row.scheduled_date) : undefined,
      startTime: row.start_time ? new Date(row.start_time) : undefined,
      endTime: row.end_time ? new Date(row.end_time) : undefined,
      focusEnabled: row.focus_enabled,
      focusDurationMinutes: row.focus_duration_minutes || undefined,
      isPomodoroCustom: row.is_pomodoro_custom || false,
      pomodoroShortBreakMinutes: row.pomodoro_short_break_minutes || undefined,
      pomodoroLongBreakMinutes: row.pomodoro_long_break_minutes || undefined,
      pomodoroSessionsCount: row.pomodoro_sessions_count || undefined,
      milestoneId: row.milestone_id || undefined,
      recurrenceRule: row.recurrence_rule,
      parentTodoId: row.parent_todo_id || undefined,
      notificationSent: row.notification_sent,
      reminderMinutes: row.reminder_minutes || 5,
      iconPath: row.icon_path || undefined,
      category: row.category || undefined,
      webLink: row.web_link || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  static toSupabase(todo: Partial<Todo>): any {
    const data: any = {
      ...(todo.userId && { user_id: todo.userId }),
      ...(todo.title !== undefined && { title: todo.title }),
      ...(todo.description !== undefined && { description: todo.description }),
      ...(todo.priority && { priority: todo.priority }),
      ...(todo.isCompleted !== undefined && { is_completed: todo.isCompleted }),
      ...(todo.completedAt !== undefined && { completed_at: todo.completedAt?.toISOString() }),
      ...(todo.isScheduled !== undefined && { is_scheduled: todo.isScheduled }),
      ...(todo.scheduledDate !== undefined && { 
        scheduled_date: todo.scheduledDate 
          ? `${todo.scheduledDate.getFullYear()}-${(todo.scheduledDate.getMonth() + 1).toString().padStart(2, '0')}-${todo.scheduledDate.getDate().toString().padStart(2, '0')}` 
          : null 
      }),
      ...(todo.startTime !== undefined && { start_time: todo.startTime?.toISOString() }),
      ...(todo.endTime !== undefined && { end_time: todo.endTime?.toISOString() }),
      ...(todo.focusEnabled !== undefined && { focus_enabled: todo.focusEnabled }),
      ...(todo.focusDurationMinutes !== undefined && { focus_duration_minutes: todo.focusDurationMinutes }),
      ...(todo.isPomodoroCustom !== undefined && { is_pomodoro_custom: todo.isPomodoroCustom }),
      ...(todo.pomodoroShortBreakMinutes !== undefined && { pomodoro_short_break_minutes: todo.pomodoroShortBreakMinutes }),
      ...(todo.pomodoroLongBreakMinutes !== undefined && { pomodoro_long_break_minutes: todo.pomodoroLongBreakMinutes }),
      ...(todo.pomodoroSessionsCount !== undefined && { pomodoro_sessions_count: todo.pomodoroSessionsCount }),
      ...(todo.milestoneId !== undefined && { milestone_id: todo.milestoneId }),
      ...(todo.recurrenceRule !== undefined && { recurrence_rule: todo.recurrenceRule }),
      ...(todo.parentTodoId !== undefined && { parent_todo_id: todo.parentTodoId }),
      ...(todo.notificationSent !== undefined && { notification_sent: todo.notificationSent }),
      ...(todo.reminderMinutes !== undefined && { reminder_minutes: todo.reminderMinutes }),
      ...(todo.iconPath !== undefined && { icon_path: todo.iconPath }),
      ...(todo.category !== undefined && { category: todo.category }),
      ...(todo.webLink !== undefined && { web_link: todo.webLink }),
      updated_at: new Date().toISOString(),
    };
    return data;
  }
}

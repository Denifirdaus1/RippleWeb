'use client';

import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Plus, Timer } from 'lucide-react';
import { Todo, TodoPriority } from '../../domain/entities/todo';

interface TodoScheduleViewProps {
  getScheduledTodosForDate: (date: Date) => Todo[];
  onToggleTodo: (todo: Todo) => void;
  onEditTodo: (todo: Todo) => void;
  onStartFocus?: (todo: Todo) => void;
  onAddAtTime: (date: Date) => void;
}

const HOURS = Array.from({ length: 24 }, (_, index) => index);

const getDayLabel = (date: Date, today: Date) => {
  const currentDate = new Date(date);
  const referenceDate = new Date(today);
  currentDate.setHours(0, 0, 0, 0);
  referenceDate.setHours(0, 0, 0, 0);

  const diff = Math.round((currentDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
};

const formatHour = (hour: number) => `${hour.toString().padStart(2, '0')}:00`;

const getPriorityColor = (priority: TodoPriority) => {
  switch (priority) {
    case 'high':
      return { bg: 'rgba(255,183,77,0.15)', border: 'var(--priority-high)', text: '#E65100' };
    case 'medium':
      return { bg: 'rgba(180,216,246,0.25)', border: 'var(--priority-medium)', text: 'var(--primary)' };
    case 'low':
      return { bg: 'rgba(174,213,129,0.2)', border: 'var(--priority-low)', text: '#1B5E20' };
  }
};

export const TodoScheduleView: React.FC<TodoScheduleViewProps> = ({
  getScheduledTodosForDate,
  onToggleTodo,
  onEditTodo,
  onStartFocus,
  onAddAtTime,
}) => {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);

  const weekDays = useMemo(() => {
    const days: Date[] = [];
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - 3);
    for (let index = 0; index < 7; index += 1) {
      const day = new Date(start);
      day.setDate(day.getDate() + index);
      days.push(day);
    }
    return days;
  }, [selectedDate]);

  const scheduledTodos = useMemo(
    () => getScheduledTodosForDate(selectedDate),
    [getScheduledTodosForDate, selectedDate]
  );

  const navigateDay = (offset: number) => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + offset);
    setSelectedDate(nextDate);
  };

  const goToToday = () => setSelectedDate(new Date());

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  return (
    <div className="animate-in space-y-4 fade-in duration-500">
      <div className="mb-2 flex items-center justify-between">
        <button onClick={() => navigateDay(-1)} className="rounded-full p-2 transition-colors hover:bg-slate-100">
          <ChevronLeft size={20} className="text-[var(--text-secondary)]" />
        </button>

        <div className="text-center">
          <h3 className="text-lg font-black text-[var(--ink-black)]">
            {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(selectedDate)}
          </h3>
          {!isSameDay(selectedDate, today) ? (
            <button onClick={goToToday} className="mt-0.5 text-xs font-bold text-[var(--primary)] hover:underline">
              Go to today
            </button>
          ) : null}
        </div>

        <button onClick={() => navigateDay(1)} className="rounded-full p-2 transition-colors hover:bg-slate-100">
          <ChevronRight size={20} className="text-[var(--text-secondary)]" />
        </button>
      </div>

      <div className="flex justify-between gap-1">
        {weekDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, today);

          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDate(new Date(day))}
              className={`flex-1 rounded-2xl py-2 transition-all ${
                isSelected
                  ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary-glow)]'
                  : isToday
                  ? 'bg-purple-50 text-[var(--primary)]'
                  : 'text-[var(--text-secondary)] hover:bg-slate-50'
              }`}
            >
              <span className="block text-[10px] font-bold uppercase">{getDayLabel(day, today)}</span>
              <span className="block text-lg font-black">{day.getDate()}</span>
            </button>
          );
        })}
      </div>

      <div className="relative">
        {isSameDay(selectedDate, today) ? (
          <div
            className="pointer-events-none absolute left-16 right-0 z-20"
            style={{ top: `${(today.getHours() * 60 + today.getMinutes()) * (64 / 60)}px` }}
          >
            <div className="flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-md" />
              <div className="h-[2px] flex-1 bg-red-500 opacity-60" />
            </div>
          </div>
        ) : null}

        <div className="space-y-0">
          {HOURS.map((hour) => {
            const todosAtHour = scheduledTodos.filter((todo) => {
              if (!todo.startTime) return false;
              const startTime = new Date(todo.startTime);
              return startTime.getHours() === hour;
            });

            return (
              <div
                key={hour}
                className="group flex cursor-pointer items-start gap-3"
                style={{ minHeight: '64px' }}
                onClick={() => {
                  const date = new Date(selectedDate);
                  date.setHours(hour, 0, 0, 0);
                  onAddAtTime(date);
                }}
              >
                <div className="w-12 flex-shrink-0 pt-1 text-right">
                  <span className="text-xs font-medium text-[var(--text-secondary)]">{formatHour(hour)}</span>
                </div>

                <div className="relative min-h-[64px] flex-1 border-t border-slate-100 pt-1">
                  {todosAtHour.length > 0 ? (
                    <div className="space-y-1">
                      {todosAtHour.map((todo) => {
                        const colors = getPriorityColor(todo.priority);
                        const startStr = todo.startTime
                          ? new Intl.DateTimeFormat('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false,
                            }).format(new Date(todo.startTime))
                          : '';
                        const endStr = todo.endTime
                          ? new Intl.DateTimeFormat('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false,
                            }).format(new Date(todo.endTime))
                          : '';

                        return (
                          <div
                            key={todo.id}
                            onClick={(event) => {
                              event.stopPropagation();
                              onEditTodo(todo);
                            }}
                            className="cursor-pointer rounded-xl border-l-4 p-3 transition-all hover:shadow-md"
                            style={{
                              backgroundColor: colors.bg,
                              borderLeftColor: colors.border,
                            }}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span
                                className={`text-sm font-bold ${todo.isCompleted ? 'opacity-50 line-through' : ''}`}
                                style={{ color: colors.text }}
                              >
                                {todo.title}
                              </span>
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onToggleTodo(todo);
                                }}
                                className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                                  todo.isCompleted ? 'text-white' : ''
                                }`}
                                style={{
                                  borderColor: colors.border,
                                  backgroundColor: todo.isCompleted ? colors.border : 'transparent',
                                }}
                              >
                                {todo.isCompleted ? (
                                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                    <path
                                      d="M1 4L3.5 6.5L9 1"
                                      stroke="white"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                ) : null}
                              </button>
                            </div>

                            {(startStr || endStr) ? (
                              <div className="mt-1 flex items-center gap-1">
                                <Clock size={10} className="text-[var(--text-secondary)]" />
                                <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                                  {startStr}
                                  {endStr ? ` - ${endStr}` : ''}
                                </span>
                              </div>
                            ) : null}

                            {todo.focusEnabled && !todo.isCompleted && onStartFocus ? (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onStartFocus(todo);
                                }}
                                className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-1 text-[11px] font-semibold text-blue-600 shadow-sm"
                              >
                                <Timer size={11} />
                                {todo.focusDurationMinutes || 25} min
                              </button>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="pt-4 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex items-center gap-1 text-slate-300">
                        <Plus size={12} />
                        <span className="text-xs font-medium">Add task</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

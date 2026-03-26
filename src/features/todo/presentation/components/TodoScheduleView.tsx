'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock, Plus } from 'lucide-react';
import { Todo, TodoPriority } from '../../domain/entities/todo';

interface TodoScheduleViewProps {
  getScheduledTodosForDate: (date: Date) => Todo[];
  onToggleTodo: (todo: Todo) => void;
  onEditTodo: (todo: Todo) => void;
  onAddAtTime: (date: Date) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const getDayLabel = (date: Date, today: Date) => {
  const d = new Date(date);
  const t = new Date(today);
  d.setHours(0, 0, 0, 0);
  t.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - t.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
};

const formatHour = (hour: number) => {
  return `${hour.toString().padStart(2, '0')}:00`;
};

const getPriorityColor = (priority: TodoPriority) => {
  switch (priority) {
    case 'high': return { bg: 'rgba(255,183,77,0.15)', border: 'var(--priority-high)', text: '#E65100' };
    case 'medium': return { bg: 'rgba(180,216,246,0.25)', border: 'var(--priority-medium)', text: 'var(--primary)' };
    case 'low': return { bg: 'rgba(174,213,129,0.2)', border: 'var(--priority-low)', text: '#1B5E20' };
  }
};

export const TodoScheduleView: React.FC<TodoScheduleViewProps> = ({
  getScheduledTodosForDate,
  onToggleTodo,
  onEditTodo,
  onAddAtTime,
}) => {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);

  // Generate 7 days around selected date
  const weekDays = useMemo(() => {
    const days: Date[] = [];
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - 3);
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [selectedDate]);

  const scheduledTodos = useMemo(
    () => getScheduledTodosForDate(selectedDate),
    [selectedDate, getScheduledTodosForDate]
  );

  const navigateDay = (offset: number) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + offset);
    setSelectedDate(next);
  };

  const goToToday = () => setSelectedDate(new Date());

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Date Navigation */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => navigateDay(-1)} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
          <ChevronLeft size={20} className="text-[var(--text-secondary)]" />
        </button>

        <div className="text-center">
          <h3 className="text-lg font-black text-[var(--ink-black)]">
            {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(selectedDate)}
          </h3>
          {!isSameDay(selectedDate, today) && (
            <button onClick={goToToday} className="text-xs text-[var(--primary)] font-bold hover:underline mt-0.5">
              Go to today
            </button>
          )}
        </div>

        <button onClick={() => navigateDay(1)} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
          <ChevronRight size={20} className="text-[var(--text-secondary)]" />
        </button>
      </div>

      {/* Day Selector */}
      <div className="flex gap-1 justify-between">
        {weekDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, today);
          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDate(new Date(day))}
              className={`flex-1 flex flex-col items-center py-2 rounded-2xl transition-all ${
                isSelected
                  ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary-glow)]'
                  : isToday
                  ? 'bg-purple-50 text-[var(--primary)]'
                  : 'hover:bg-slate-50 text-[var(--text-secondary)]'
              }`}
            >
              <span className="text-[10px] font-bold uppercase">
                {getDayLabel(day, today)}
              </span>
              <span className={`text-lg font-black ${isSelected ? '' : ''}`}>
                {day.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Current time indicator */}
        {isSameDay(selectedDate, today) && (
          <div
            className="absolute left-16 right-0 z-20 pointer-events-none"
            style={{ top: `${(today.getHours() * 60 + today.getMinutes()) * (64 / 60)}px` }}
          >
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-md" />
              <div className="flex-1 h-[2px] bg-red-500 opacity-60" />
            </div>
          </div>
        )}

        <div className="space-y-0">
          {HOURS.map((hour) => {
            const todosAtHour = scheduledTodos.filter(t => {
              if (!t.startTime) return false;
              const st = new Date(t.startTime);
              return st.getHours() === hour;
            });

            return (
              <div
                key={hour}
                className="flex items-start gap-3 group cursor-pointer"
                style={{ minHeight: '64px' }}
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setHours(hour, 0, 0, 0);
                  onAddAtTime(d);
                }}
              >
                {/* Hour Label */}
                <div className="w-12 text-right pt-1 flex-shrink-0">
                  <span className="text-xs font-medium text-[var(--text-secondary)]">
                    {formatHour(hour)}
                  </span>
                </div>

                {/* Content Area */}
                <div className="flex-1 border-t border-slate-100 pt-1 relative min-h-[64px]">
                  {todosAtHour.length > 0 ? (
                    <div className="space-y-1">
                      {todosAtHour.map((todo) => {
                        const colors = getPriorityColor(todo.priority);
                        const startStr = todo.startTime
                          ? new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(todo.startTime))
                          : '';
                        const endStr = todo.endTime
                          ? new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(todo.endTime))
                          : '';

                        return (
                          <div
                            key={todo.id}
                            onClick={(e) => { e.stopPropagation(); onEditTodo(todo); }}
                            className="p-3 rounded-xl border-l-4 cursor-pointer hover:shadow-md transition-all"
                            style={{
                              backgroundColor: colors.bg,
                              borderLeftColor: colors.border,
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-sm font-bold ${
                                  todo.isCompleted ? 'line-through opacity-50' : ''
                                }`}
                                style={{ color: colors.text }}
                              >
                                {todo.title}
                              </span>
                              <button
                                onClick={(e) => { e.stopPropagation(); onToggleTodo(todo); }}
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                  todo.isCompleted ? 'text-white' : ''
                                }`}
                                style={{
                                  borderColor: colors.border,
                                  backgroundColor: todo.isCompleted ? colors.border : 'transparent',
                                }}
                              >
                                {todo.isCompleted && (
                                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                )}
                              </button>
                            </div>
                            {(startStr || endStr) && (
                              <div className="flex items-center gap-1 mt-1">
                                <Clock size={10} className="text-[var(--text-secondary)]" />
                                <span className="text-[11px] text-[var(--text-secondary)] font-medium">
                                  {startStr}{endStr ? ` - ${endStr}` : ''}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity pt-4">
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

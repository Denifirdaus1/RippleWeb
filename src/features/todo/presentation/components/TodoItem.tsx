'use client';

import React from 'react';
import { Check, Clock, Trash2, Edit3, ChevronRight, Timer } from 'lucide-react';
import { Todo, TodoPriority } from '../../domain/entities/todo';

const getPriorityColor = (priority: TodoPriority) => {
  switch (priority) {
    case 'high':
      return 'var(--priority-high)';
    case 'medium':
      return 'var(--priority-medium)';
    case 'low':
      return 'var(--priority-low)';
  }
};

const getPriorityTextColor = (priority: TodoPriority) => {
  switch (priority) {
    case 'high':
      return '#E65100';
    case 'medium':
      return 'var(--primary)';
    case 'low':
      return '#1B5E20';
  }
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(date));
};

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(date));
};

interface TodoItemProps {
  todo: Todo;
  onToggle: (todo: Todo) => void;
  onDelete: (id: string) => void;
  onEdit?: (todo: Todo) => void;
  onStartFocus?: (todo: Todo) => void;
  subtaskInfo?: { total: number; completed: number };
}

export const TodoItem: React.FC<TodoItemProps> = ({
  todo,
  onToggle,
  onDelete,
  onEdit,
  onStartFocus,
  subtaskInfo,
}) => {
  const pColor = getPriorityColor(todo.priority);
  const ptColor = getPriorityTextColor(todo.priority);

  return (
    <div
      className="group relative mb-3 flex cursor-pointer items-center rounded-full border-[1.5px] bg-white px-5 py-3 transition-all hover:shadow-md"
      style={{ borderColor: pColor }}
      onClick={() => onEdit?.(todo)}
    >
      <button
        onClick={(event) => {
          event.stopPropagation();
          onToggle(todo);
        }}
        className="mr-4 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all hover:scale-110"
        style={{
          borderColor: pColor,
          backgroundColor: todo.isCompleted ? pColor : 'transparent',
        }}
      >
        {todo.isCompleted ? <Check size={14} className="text-white" /> : null}
      </button>

      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <div className="flex items-center gap-2">
          <span
            className={`truncate text-[15px] font-bold leading-tight ${
              todo.isCompleted ? 'text-[var(--text-secondary)] line-through' : 'text-[var(--ink-black)]'
            }`}
          >
            {todo.title}
          </span>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-2 py-[2px] text-[10px] font-semibold"
            style={{
              backgroundColor: `color-mix(in srgb, ${pColor} 20%, transparent)`,
              color: ptColor,
            }}
          >
            {todo.category || 'General'}
          </span>

          {(todo.scheduledDate || todo.startTime) ? (
            <span className="flex items-center gap-1 text-[11px] font-medium text-[var(--text-secondary)]">
              <Clock size={10} />
              {todo.startTime
                ? `${formatDate(todo.scheduledDate || todo.startTime)} · ${formatTime(todo.startTime)}`
                : formatDate(todo.scheduledDate || new Date())}
            </span>
          ) : null}

          {subtaskInfo && subtaskInfo.total > 0 ? (
            <span className="flex items-center gap-1 text-[11px] font-medium text-[var(--text-secondary)]">
              <ChevronRight size={10} />
              {subtaskInfo.completed}/{subtaskInfo.total} subtasks
            </span>
          ) : null}

          {todo.focusEnabled && !todo.isCompleted && onStartFocus ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onStartFocus(todo);
              }}
              className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-[3px] text-[10px] font-semibold text-blue-600 transition hover:bg-blue-100"
            >
              <Timer size={11} />
              {todo.focusDurationMinutes || 25} min
            </button>
          ) : null}
        </div>
      </div>

      <div className="ml-2 flex items-center gap-1 opacity-0 transition-opacity md:group-hover:opacity-100">
        {onEdit ? (
          <button
            onClick={(event) => {
              event.stopPropagation();
              onEdit(todo);
            }}
            className="rounded-full p-2 text-slate-300 transition-colors hover:bg-purple-50 hover:text-[var(--primary)]"
            title="Edit task"
          >
            <Edit3 size={16} />
          </button>
        ) : null}
        <button
          onClick={(event) => {
            event.stopPropagation();
            onDelete(todo.id);
          }}
          className="rounded-full p-2 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500"
          title="Delete task"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

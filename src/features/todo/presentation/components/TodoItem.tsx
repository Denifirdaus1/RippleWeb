'use client';

import React from 'react';
import { Check, Clock, Trash2, Edit3, ChevronRight } from 'lucide-react';
import { Todo, TodoPriority } from '../../domain/entities/todo';

const getPriorityColor = (priority: TodoPriority) => {
  switch (priority) {
    case 'high': return 'var(--priority-high)';
    case 'medium': return 'var(--priority-medium)';
    case 'low': return 'var(--priority-low)';
  }
};

const getPriorityTextColor = (priority: TodoPriority) => {
  switch (priority) {
    case 'high': return '#E65100';
    case 'medium': return 'var(--primary)';
    case 'low': return '#1B5E20';
  }
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(date));
};

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(date));
};

interface TodoItemProps {
  todo: Todo;
  onToggle: (todo: Todo) => void;
  onDelete: (id: string) => void;
  onEdit?: (todo: Todo) => void;
  subtaskInfo?: { total: number; completed: number };
}

export const TodoItem: React.FC<TodoItemProps> = ({ todo, onToggle, onDelete, onEdit, subtaskInfo }) => {
  const pColor = getPriorityColor(todo.priority);
  const ptColor = getPriorityTextColor(todo.priority);

  return (
    <div
      className="group relative flex items-center px-5 py-3 mb-3 bg-white rounded-full border-[1.5px] transition-all hover:shadow-md cursor-pointer"
      style={{ borderColor: pColor }}
      onClick={() => onEdit?.(todo)}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(todo); }}
        className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all mr-4 hover:scale-110"
        style={{
          borderColor: pColor,
          backgroundColor: todo.isCompleted ? pColor : 'transparent'
        }}
      >
        {todo.isCompleted && <Check size={14} className="text-white" />}
      </button>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0 justify-center">
        <div className="flex items-center gap-2">
          <span className={`text-[15px] font-bold truncate leading-tight ${todo.isCompleted ? 'line-through text-[var(--text-secondary)]' : 'text-[var(--ink-black)]'}`}>
            {todo.title}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {/* Category Tag */}
          <span
            className="px-2 py-[2px] rounded-full text-[10px] font-semibold"
            style={{
              backgroundColor: `color-mix(in srgb, ${pColor} 20%, transparent)`,
              color: ptColor,
            }}
          >
            {todo.category || 'General'}
          </span>

          {/* Schedule info */}
          {(todo.scheduledDate || todo.startTime) && (
            <span className="text-[11px] font-medium text-[var(--text-secondary)] flex items-center gap-1">
              <Clock size={10} />
              {todo.startTime
                ? `${formatDate(todo.scheduledDate || todo.startTime)} · ${formatTime(todo.startTime)}`
                : formatDate(todo.scheduledDate || new Date())
              }
            </span>
          )}

          {/* Subtask count */}
          {subtaskInfo && subtaskInfo.total > 0 && (
            <span className="text-[11px] font-medium text-[var(--text-secondary)] flex items-center gap-1">
              <ChevronRight size={10} />
              {subtaskInfo.completed}/{subtaskInfo.total} subtasks
            </span>
          )}

          {/* Focus badge */}
          {todo.focusEnabled && (
            <span className="px-2 py-[1px] rounded-full text-[10px] font-semibold bg-purple-50 text-purple-600">
              🎯 Focus
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 ml-2 opacity-0 md:group-hover:opacity-100 transition-opacity">
        {onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(todo); }}
            className="p-2 text-slate-300 hover:text-[var(--primary)] transition-colors rounded-full hover:bg-purple-50"
            title="Edit task"
          >
            <Edit3 size={16} />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); deleteTodo(todo.id); }}
          className="p-2 text-slate-300 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
          title="Delete task"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );

  function deleteTodo(id: string) {
    onDelete(id);
  }
};

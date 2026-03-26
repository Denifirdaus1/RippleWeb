'use client';

import React, { useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { Todo } from '../../domain/entities/todo';

interface SubtasksListProps {
  subtasks: Todo[];
  onToggle: (todo: Todo) => void;
  onAddSubtask?: (title: string) => void;
  onDelete?: (id: string) => void;
}

export const SubtasksList: React.FC<SubtasksListProps> = ({
  subtasks,
  onToggle,
  onAddSubtask,
  onDelete,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const completedCount = subtasks.filter(s => s.isCompleted).length;

  const handleAdd = () => {
    if (newTitle.trim() && onAddSubtask) {
      onAddSubtask(newTitle.trim());
      setNewTitle('');
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-[var(--ink-black)]">
          Subtasks {subtasks.length > 0 && (
            <span className="text-[var(--text-secondary)] font-medium">
              ({completedCount}/{subtasks.length})
            </span>
          )}
        </span>
        {onAddSubtask && (
          <button
            onClick={() => setIsAdding(true)}
            className="text-[var(--primary)] text-sm font-bold hover:underline flex items-center gap-1"
          >
            <Plus size={14} /> Add
          </button>
        )}
      </div>

      {/* Subtask items */}
      {subtasks.map((st) => (
        <div
          key={st.id}
          className="flex items-center gap-3 py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group"
        >
          <button
            onClick={() => onToggle(st)}
            className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
            style={{
              borderColor: 'var(--primary)',
              backgroundColor: st.isCompleted ? 'var(--primary)' : 'transparent',
            }}
          >
            {st.isCompleted && <Check size={12} className="text-white" />}
          </button>
          <span className={`text-sm flex-1 ${st.isCompleted ? 'line-through text-[var(--text-secondary)]' : 'text-[var(--ink-black)]'}`}>
            {st.title}
          </span>
          {onDelete && (
            <button
              onClick={() => onDelete(st.id)}
              className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all"
            >
              <X size={14} />
            </button>
          )}
        </div>
      ))}

      {/* Add inline */}
      {isAdding && (
        <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-purple-50 border border-purple-100 animate-in slide-in-from-top-2 duration-200">
          <div className="w-5 h-5 rounded-full border-2 border-purple-200 flex-shrink-0" />
          <input
            autoFocus
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
              if (e.key === 'Escape') { setIsAdding(false); setNewTitle(''); }
            }}
            placeholder="Subtask name..."
            className="flex-1 bg-transparent text-sm border-none outline-none placeholder:text-purple-300"
          />
          <button onClick={handleAdd} className="text-[var(--primary)] font-bold text-sm hover:underline">
            Add
          </button>
          <button onClick={() => { setIsAdding(false); setNewTitle(''); }} className="text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Empty state */}
      {subtasks.length === 0 && !isAdding && (
        <p className="text-xs text-[var(--text-secondary)] italic py-1">No subtasks yet</p>
      )}
    </div>
  );
};

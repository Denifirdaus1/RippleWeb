'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface TodoEmbedProps {
  todo: {
    id: string;
    title: string;
    isCompleted: boolean;
    priority: 'high' | 'medium' | 'low';
    category?: string;
  };
  onToggle?: (id: string, completed: boolean) => void;
  onTap?: (id: string) => void;
}

export const TodoEmbed: React.FC<TodoEmbedProps> = ({ todo, onToggle, onTap }) => {
  const priorityColors = {
    high: '#FFB74D',
    medium: '#B4D8F6',
    low: '#AED581',
  };

  const color = priorityColors[todo.priority] || priorityColors.low;

  return (
    <div 
      className="inline-flex items-center gap-3 px-3 py-2 my-1 bg-white border-[1.5px] rounded-full shadow-sm cursor-pointer hover:shadow-md transition-all max-w-full"
      style={{ borderColor: color }}
      onClick={() => onTap?.(todo.id)}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle?.(todo.id, !todo.isCompleted);
        }}
        className="w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-colors"
        style={{ 
          borderColor: color,
          backgroundColor: todo.isCompleted ? color : 'transparent'
        }}
      >
        {todo.isCompleted && <Check size={10} className="text-white" strokeWidth={4} />}
      </button>

      {/* Title */}
      <span className={`text-[13px] font-bold truncate ${todo.isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
        {todo.title}
      </span>

      {/* Category */}
      <div 
        className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider"
        style={{ backgroundColor: `${color}22`, color: color }}
      >
        {todo.category || 'General'}
      </div>
    </div>
  );
};

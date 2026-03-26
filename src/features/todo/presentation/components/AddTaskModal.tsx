'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X, Calendar, Clock, Target, Plus, ChevronDown,
  Flame, Zap, Leaf, Check
} from 'lucide-react';
import { Todo, TodoPriority } from '../../domain/entities/todo';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (todo: Partial<Todo>, subtaskTitles: string[]) => void;
  initialTodo?: Todo | null;
  existingSubtasks?: Todo[];
  onToggleSubtask?: (todo: Todo) => void;
  onDeleteSubtask?: (id: string) => void;
  onAddSubtask?: (title: string) => void;
  /** Pre-fill scheduled date/time when opening from schedule view */
  prefilledDate?: Date;
}

const REMINDER_OPTIONS = [
  { value: 0, label: 'None' },
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
];

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTodo,
  existingSubtasks = [],
  onToggleSubtask,
  onDeleteSubtask,
  onAddSubtask,
  prefilledDate,
}) => {
  const titleRef = useRef<HTMLInputElement>(null);

  // --- Form State ---
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TodoPriority>('medium');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reminderMinutes, setReminderMinutes] = useState(5);
  const [focusEnabled, setFocusEnabled] = useState(false);
  const [focusDuration, setFocusDuration] = useState(25);
  const [category, setCategory] = useState('');
  const [showTitleError, setShowTitleError] = useState(false);

  // Subtasks (for new todo only)
  const [pendingSubtasks, setPendingSubtasks] = useState<string[]>([]);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

  const isEditing = !!initialTodo;

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      if (initialTodo) {
        setTitle(initialTodo.title);
        setPriority(initialTodo.priority);
        setIsScheduled(initialTodo.isScheduled);
        setCategory(initialTodo.category || '');
        setFocusEnabled(initialTodo.focusEnabled);
        setFocusDuration(initialTodo.focusDurationMinutes || 25);
        setReminderMinutes(initialTodo.reminderMinutes || 5);

        if (initialTodo.scheduledDate) {
          const d = new Date(initialTodo.scheduledDate);
          setScheduledDate(formatDateForInput(d));
        }
        if (initialTodo.startTime) {
          setStartTime(formatTimeForInput(new Date(initialTodo.startTime)));
        }
        if (initialTodo.endTime) {
          setEndTime(formatTimeForInput(new Date(initialTodo.endTime)));
        }
      } else {
        // New todo defaults
        setTitle('');
        setPriority('medium');
        setCategory('');
        setFocusEnabled(false);
        setFocusDuration(25);
        setReminderMinutes(5);
        setPendingSubtasks([]);
        setSubtaskInput('');
        setIsAddingSubtask(false);
        setShowTitleError(false);

        if (prefilledDate) {
          setIsScheduled(true);
          setScheduledDate(formatDateForInput(prefilledDate));
          setStartTime(formatTimeForInput(prefilledDate));
          const endDate = new Date(prefilledDate.getTime() + 60 * 60 * 1000);
          setEndTime(formatTimeForInput(endDate));
        } else {
          setIsScheduled(false);
          // Default: now + 10 min
          const now = new Date();
          now.setMinutes(now.getMinutes() + 10);
          setScheduledDate(formatDateForInput(now));
          setStartTime(formatTimeForInput(now));
          const end = new Date(now.getTime() + 60 * 60 * 1000);
          setEndTime(formatTimeForInput(end));
        }
      }

      // Focus title input
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  }, [isOpen, initialTodo, prefilledDate]);

  if (!isOpen) return null;

  function formatDateForInput(d: Date): string {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function formatTimeForInput(d: Date): string {
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  function handleSave() {
    if (!title.trim()) {
      setShowTitleError(true);
      titleRef.current?.focus();
      return;
    }
    setShowTitleError(false);

    let schedDate: Date | undefined;
    let start: Date | undefined;
    let end: Date | undefined;

    if (isScheduled && scheduledDate) {
      const [y, m, d] = scheduledDate.split('-').map(Number);
      schedDate = new Date(y, m - 1, d);

      if (startTime) {
        const [sh, sm] = startTime.split(':').map(Number);
        start = new Date(y, m - 1, d, sh, sm);
      }
      if (endTime) {
        const [eh, em] = endTime.split(':').map(Number);
        end = new Date(y, m - 1, d, eh, em);
      }

      // Validate end > start
      if (start && end && end <= start) {
        end = new Date(start.getTime() + 60 * 60 * 1000);
      }
    }

    const todoData: Partial<Todo> = {
      ...(initialTodo && { id: initialTodo.id }),
      title: title.trim(),
      priority,
      isScheduled,
      scheduledDate: schedDate,
      startTime: start,
      endTime: end,
      focusEnabled,
      focusDurationMinutes: focusEnabled ? focusDuration : undefined,
      reminderMinutes: isScheduled ? reminderMinutes : 5,
      category: category.trim() || undefined,
      isCompleted: initialTodo?.isCompleted || false,
    };

    onSave(todoData, isEditing ? [] : pendingSubtasks);
    onClose();
  }

  function addPendingSubtask() {
    if (subtaskInput.trim()) {
      if (isEditing && onAddSubtask) {
        onAddSubtask(subtaskInput.trim());
      } else {
        setPendingSubtasks(prev => [...prev, subtaskInput.trim()]);
      }
      setSubtaskInput('');
      setIsAddingSubtask(false);
    }
  }

  function removePendingSubtask(index: number) {
    setPendingSubtasks(prev => prev.filter((_, i) => i !== index));
  }

  const priorities: { value: TodoPriority; label: string; icon: React.ReactNode; color: string; bgColor: string; textColor: string }[] = [
    { value: 'high', label: 'High', icon: <Flame size={18} />, color: 'var(--priority-high)', bgColor: 'rgba(255,183,77,0.15)', textColor: '#E65100' },
    { value: 'medium', label: 'Medium', icon: <Zap size={18} />, color: 'var(--priority-medium)', bgColor: 'rgba(180,216,246,0.25)', textColor: 'var(--primary)' },
    { value: 'low', label: 'Low', icon: <Leaf size={18} />, color: 'var(--priority-low)', bgColor: 'rgba(174,213,129,0.2)', textColor: '#1B5E20' },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 pointer-events-none">
        <div
          className="pointer-events-auto w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-[var(--ink-black)] tracking-tight">
                {isEditing ? 'Edit Task' : 'New Task'}
              </h2>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            {/* Title Input */}
            <div>
              <input
                ref={titleRef}
                type="text"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setShowTitleError(false); }}
                placeholder="What needs doing?"
                className={`w-full px-5 py-4 rounded-2xl text-lg font-bold placeholder:text-slate-300 border-2 transition-all outline-none ${
                  showTitleError
                    ? 'border-red-300 bg-red-50/50'
                    : 'border-slate-100 bg-[var(--soft-gray)] focus:border-[var(--primary)] focus:bg-white'
                }`}
              />
              {showTitleError && (
                <p className="text-red-400 text-xs font-medium mt-1.5 ml-2">Don&apos;t forget to name your task!</p>
              )}
            </div>

            {/* Priority Selector */}
            <div>
              <label className="text-sm font-bold text-[var(--ink-black)] mb-2 block">Priority</label>
              <div className="grid grid-cols-3 gap-2">
                {priorities.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPriority(p.value)}
                    className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm border-2 transition-all ${
                      priority === p.value
                        ? 'shadow-md scale-[1.02]'
                        : 'border-transparent hover:scale-[1.01]'
                    }`}
                    style={{
                      backgroundColor: p.bgColor,
                      color: p.textColor,
                      borderColor: priority === p.value ? p.color : 'transparent',
                    }}
                  >
                    {p.icon}
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Schedule Toggle */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-[var(--primary)]" />
                  <span className="text-sm font-bold text-[var(--ink-black)]">Schedule</span>
                </div>
                <button
                  onClick={() => setIsScheduled(!isScheduled)}
                  className={`w-12 h-7 rounded-full transition-all relative ${
                    isScheduled ? 'bg-[var(--primary)]' : 'bg-slate-200'
                  }`}
                >
                  <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${
                    isScheduled ? 'left-6' : 'left-1'
                  }`} />
                </button>
              </div>

              {isScheduled && (
                <div className="space-y-3 pl-1 animate-in slide-in-from-top-2 duration-200">
                  {/* Date */}
                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Date</label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-[var(--ink-black)] outline-none focus:border-[var(--primary)] transition-colors"
                    />
                  </div>

                  {/* Time Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Start</label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => {
                          setStartTime(e.target.value);
                          // Auto-adjust end to +1h
                          if (e.target.value) {
                            const [h, m] = e.target.value.split(':').map(Number);
                            const end = `${((h + 1) % 24).toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                            setEndTime(end);
                          }
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-[var(--ink-black)] outline-none focus:border-[var(--primary)] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">End</label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-[var(--ink-black)] outline-none focus:border-[var(--primary)] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Reminder */}
                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Reminder</label>
                    <div className="relative">
                      <select
                        value={reminderMinutes}
                        onChange={(e) => setReminderMinutes(Number(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-[var(--ink-black)] outline-none focus:border-[var(--primary)] appearance-none transition-colors"
                      >
                        {REMINDER_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label} before</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Focus Mode Toggle */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target size={18} className="text-[var(--primary)]" />
                  <span className="text-sm font-bold text-[var(--ink-black)]">Focus Mode</span>
                </div>
                <button
                  onClick={() => setFocusEnabled(!focusEnabled)}
                  className={`w-12 h-7 rounded-full transition-all relative ${
                    focusEnabled ? 'bg-[var(--primary)]' : 'bg-slate-200'
                  }`}
                >
                  <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${
                    focusEnabled ? 'left-6' : 'left-1'
                  }`} />
                </button>
              </div>

              {focusEnabled && (
                <div className="space-y-2 pl-1 animate-in slide-in-from-top-2 duration-200">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">
                    Duration: <span className="text-[var(--primary)] font-bold">{focusDuration} min</span>
                  </label>
                  <input
                    type="range"
                    min={5}
                    max={120}
                    step={5}
                    value={focusDuration}
                    onChange={(e) => setFocusDuration(Number(e.target.value))}
                    className="w-full accent-[var(--primary)]"
                  />
                  <div className="flex justify-between text-[10px] text-[var(--text-secondary)]">
                    <span>5m</span>
                    <span>30m</span>
                    <span>60m</span>
                    <span>90m</span>
                    <span>120m</span>
                  </div>
                </div>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="text-sm font-bold text-[var(--ink-black)] mb-2 block">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Work, Study, Personal"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium placeholder:text-slate-300 outline-none focus:border-[var(--primary)] transition-colors"
              />
            </div>

            {/* Subtasks Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[var(--ink-black)]">
                  Subtasks
                  {(pendingSubtasks.length > 0 || existingSubtasks.length > 0) && (
                    <span className="text-[var(--text-secondary)] font-medium ml-1">
                      ({isEditing ? existingSubtasks.length : pendingSubtasks.length})
                    </span>
                  )}
                </span>
                <button
                  onClick={() => setIsAddingSubtask(true)}
                  className="text-[var(--primary)] text-sm font-bold hover:underline flex items-center gap-1"
                >
                  <Plus size={14} /> Add
                </button>
              </div>

              {/* Existing subtasks (edit mode) */}
              {isEditing && existingSubtasks.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center gap-3 py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group"
                >
                  <button
                    onClick={() => onToggleSubtask?.(st)}
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
                  <button
                    onClick={() => onDeleteSubtask?.(st.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}

              {/* Pending subtasks (create mode) */}
              {!isEditing && pendingSubtasks.map((title, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 py-2 px-3 rounded-xl bg-slate-50 group"
                >
                  <div className="w-5 h-5 rounded-full border-2 border-slate-200 flex-shrink-0" />
                  <span className="text-sm flex-1 text-[var(--ink-black)]">{title}</span>
                  <button
                    onClick={() => removePendingSubtask(i)}
                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}

              {/* Inline add */}
              {isAddingSubtask && (
                <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-purple-50 border border-purple-100 animate-in slide-in-from-top-2 duration-200">
                  <div className="w-5 h-5 rounded-full border-2 border-purple-200 flex-shrink-0" />
                  <input
                    autoFocus
                    type="text"
                    value={subtaskInput}
                    onChange={(e) => setSubtaskInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addPendingSubtask();
                      if (e.key === 'Escape') { setIsAddingSubtask(false); setSubtaskInput(''); }
                    }}
                    placeholder="Subtask name..."
                    className="flex-1 bg-transparent text-sm border-none outline-none placeholder:text-purple-300"
                  />
                  <button onClick={addPendingSubtask} className="text-[var(--primary)] font-bold text-sm">
                    Add
                  </button>
                  <button onClick={() => { setIsAddingSubtask(false); setSubtaskInput(''); }} className="text-slate-400 hover:text-slate-600">
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              className="w-full py-4 rounded-2xl bg-[var(--primary)] text-white font-black text-lg hover:brightness-110 transition-all shadow-lg shadow-[var(--primary-glow)] active:scale-[0.98]"
            >
              {isEditing ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

'use client';

import React, { useState, useCallback } from 'react';
import { useAuth } from '@/features/auth/presentation/hooks/useAuth';
import { useTodos, TodoFilter, TodoViewMode } from '@/features/todo/presentation/hooks/useTodos';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Calendar, List, Plus } from 'lucide-react';
import { Todo } from '../../domain/entities/todo';
import { TodoItem } from './TodoItem';
import { AddTaskModal } from './AddTaskModal';
import { TodoScheduleView } from './TodoScheduleView';
import { buildTodoFocusSessionHref } from '@/features/focus/presentation/utils/focusSessionLaunch';

export const TodoList: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    todos,
    groupedByPriority,
    filteredTodos,
    loading,
    filter,
    setFilter,
    viewMode,
    setViewMode,
    toggleTodo,
    deleteTodo,
    saveTodo,
    saveTodoWithSubtasks,
    getSubtaskCount,
    getSubtasks,
    getScheduledTodosForDate,
  } = useTodos(user?.id);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [prefilledDate, setPrefilledDate] = useState<Date | undefined>();
  const [editingSubtasks, setEditingSubtasks] = useState<Todo[]>([]);
  const deepLinkTodoId = searchParams.get('todo');
  const currentLocation = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;

  const openAddModal = useCallback((prefillDate?: Date) => {
    setEditingTodo(null);
    setPrefilledDate(prefillDate);
    setEditingSubtasks([]);
    setIsModalOpen(true);
  }, []);

  const openEditModal = useCallback((todo: Todo) => {
    setEditingTodo(todo);
    setPrefilledDate(undefined);
    setEditingSubtasks(getSubtasks(todo.id));
    setIsModalOpen(true);
  }, [getSubtasks]);

  const handleSave = useCallback(async (todoData: Partial<Todo>, subtaskTitles: string[]) => {
    try {
      if (subtaskTitles.length > 0 && !todoData.id) {
        await saveTodoWithSubtasks(todoData, subtaskTitles);
      } else {
        await saveTodo(todoData);
      }
    } catch (error) {
      console.error('Failed to save todo', error);
    }
  }, [saveTodo, saveTodoWithSubtasks]);

  const handleAddSubtaskFromModal = useCallback(async (title: string) => {
    if (!editingTodo) return;
    try {
      await saveTodo({
        title,
        parentTodoId: editingTodo.id,
        priority: editingTodo.priority,
        isCompleted: false,
        isScheduled: false,
      });
      setEditingSubtasks(prev => [...prev, {
        id: `pending-${Date.now()}`,
        userId: editingTodo.userId,
        title,
        priority: editingTodo.priority,
        parentTodoId: editingTodo.id,
        isCompleted: false,
        isScheduled: false,
        focusEnabled: false,
        isPomodoroCustom: false,
        notificationSent: false,
        reminderMinutes: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      }]);
    } catch (err) {
      console.error('Failed to add subtask', err);
    }
  }, [editingTodo, saveTodo]);

  const clearTodoDeepLink = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (!params.has('todo')) return;
    params.delete('todo');
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const startFocusSession = useCallback(
    (todo: Todo) => {
      router.push(buildTodoFocusSessionHref(todo, currentLocation));
    },
    [currentLocation, router]
  );

  React.useEffect(() => {
    if (!deepLinkTodoId || loading) return;

    const todo = todos.find((item) => item.id === deepLinkTodoId);
    if (!todo) return;

    openEditModal(todo);
    clearTodoDeepLink();
  }, [clearTodoDeepLink, deepLinkTodoId, loading, openEditModal, todos]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[var(--primary)]" />
      <p className="text-[var(--text-secondary)] font-medium">Loading tasks...</p>
    </div>
  );

  const filters: { value: TodoFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Done' },
  ];

  return (
    <div className="w-full pb-24 animate-in fade-in duration-700 relative min-h-[60vh]">

      {/* Header */}
      <div className="flex flex-col items-center justify-center text-center mb-8 pt-4">
        <h2 className="text-3xl font-black text-[var(--ink-black)] tracking-tight">Tasks</h2>
        <p className="text-[var(--text-secondary)] font-medium mt-1">Stay focused, organized</p>
      </div>

      {/* Layout Container */}
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-4 lg:gap-8 items-start px-4">
        
        {/* Main Content Area */}
        <div className="flex-1 w-full max-w-2xl mx-auto order-2 md:order-1">
          {/* Content based on view mode */}
          {viewMode === 'list' ? (
            <>
              {/* Filter Chips */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {filters.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`px-5 py-[6px] rounded-full text-[13px] font-bold transition-all border ${
                  filter === value
                    ? 'bg-[var(--ink-black)] text-white border-[var(--ink-black)] shadow-md'
                    : 'bg-transparent text-[var(--text-secondary)] border-[var(--soft-gray)] hover:border-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Todo List by Priority */}
          <div className="space-y-6">
            {filteredTodos.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                <div className="h-16 w-16 bg-[var(--soft-gray)] rounded-full flex items-center justify-center text-slate-300">
                  <Calendar size={32} />
                </div>
                <p className="text-[var(--text-secondary)] font-medium">No tasks found</p>
                <button
                  onClick={() => openAddModal()}
                  className="text-[var(--primary)] font-bold text-sm hover:underline"
                >
                  Create your first task
                </button>
              </div>
            ) : (
              <>
                {groupedByPriority.high.length > 0 && (
                  <div>
                    <h3 className="text-xl font-black text-[var(--ink-black)] mb-4 px-2 tracking-tight">High Priority</h3>
                    {groupedByPriority.high.map(todo => (
                      <TodoItem
                        key={todo.id}
                        todo={todo}
                        onToggle={toggleTodo}
                        onDelete={deleteTodo}
                        onEdit={openEditModal}
                        onStartFocus={startFocusSession}
                        subtaskInfo={getSubtaskCount(todo.id)}
                      />
                    ))}
                  </div>
                )}
                {groupedByPriority.medium.length > 0 && (
                  <div>
                    <h3 className="text-xl font-black text-[var(--ink-black)] mb-4 px-2 tracking-tight">Medium Priority</h3>
                    {groupedByPriority.medium.map(todo => (
                      <TodoItem
                        key={todo.id}
                        todo={todo}
                        onToggle={toggleTodo}
                        onDelete={deleteTodo}
                        onEdit={openEditModal}
                        onStartFocus={startFocusSession}
                        subtaskInfo={getSubtaskCount(todo.id)}
                      />
                    ))}
                  </div>
                )}
                {groupedByPriority.low.length > 0 && (
                  <div>
                    <h3 className="text-xl font-black text-[var(--ink-black)] mb-4 px-2 tracking-tight">Low Priority</h3>
                    {groupedByPriority.low.map(todo => (
                      <TodoItem
                        key={todo.id}
                        todo={todo}
                        onToggle={toggleTodo}
                        onDelete={deleteTodo}
                        onEdit={openEditModal}
                        onStartFocus={startFocusSession}
                        subtaskInfo={getSubtaskCount(todo.id)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      ) : (
        /* Schedule View */
        <TodoScheduleView
          getScheduledTodosForDate={getScheduledTodosForDate}
          onToggleTodo={toggleTodo}
          onEditTodo={openEditModal}
          onStartFocus={startFocusSession}
          onAddAtTime={(date) => openAddModal(date)}
        />
      )}
        </div>

        {/* Right Side Controls (Vertical Switch + Add Button) */}
        {/* Placeholder spacer for desktop to maintain layout balancing */}
        <div className="hidden md:block w-14 shrink-0 order-2"></div>

        {/* Global Fixed Container */}
        <div className="fixed bottom-6 right-6 md:top-32 md:bottom-auto md:right-8 lg:right-16 xl:right-24 z-50 flex flex-col items-center gap-4 md:gap-0 justify-end md:justify-between md:h-[calc(100vh-12rem)] pointer-events-none">
          
          {/* Vertical View Mode Toggle */}
          <div className="bg-white/90 backdrop-blur-md rounded-full p-1.5 flex flex-col items-center gap-1.5 shadow-lg border border-slate-200 pointer-events-auto">
            <button
              onClick={() => setViewMode('list')}
              title="List View"
              className={`p-3 rounded-full transition-all flex items-center justify-center ${
                viewMode === 'list'
                  ? 'bg-[var(--primary)] text-white shadow-sm'
                  : 'text-slate-400 hover:text-[var(--primary)] hover:bg-slate-50'
              }`}
            >
              <List size={20} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => setViewMode('schedule')}
              title="Schedule View"
              className={`p-3 rounded-full transition-all flex items-center justify-center ${
                viewMode === 'schedule'
                  ? 'bg-[var(--primary)] text-white shadow-sm'
                  : 'text-slate-400 hover:text-[var(--primary)] hover:bg-slate-50'
              }`}
            >
              <Calendar size={20} strokeWidth={2.5} />
            </button>
          </div>

          {/* Spacer to push Add Button down on Desktop */}
          <div className="hidden md:block flex-1" />

          {/* Add Button */}
          <button
            onClick={() => openAddModal()}
            className="bg-[var(--primary)] text-white md:mb-12 h-14 w-14 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_8px_30px_rgba(156,95,236,0.5)] flex-shrink-0 pointer-events-auto mt-2"
            title="Add Task"
          >
            <Plus size={28} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Add/Edit Task Modal */}
      <AddTaskModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTodo(null); }}
        onSave={handleSave}
        initialTodo={editingTodo}
        existingSubtasks={editingSubtasks}
        onToggleSubtask={toggleTodo}
        onDeleteSubtask={deleteTodo}
        onAddSubtask={handleAddSubtaskFromModal}
        prefilledDate={prefilledDate}
      />
    </div>
  );
};

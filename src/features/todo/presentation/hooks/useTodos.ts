'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Todo, TodoPriority } from '../../domain/entities/todo';
import { TodoRepositoryImpl } from '../../data/repositories/todo_repository_impl';

export type TodoFilter = 'all' | 'active' | 'completed';
export type TodoViewMode = 'list' | 'schedule';

export const useTodos = (userId: string | undefined) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TodoFilter>('all');
  const [viewMode, setViewMode] = useState<TodoViewMode>('list');

  const repository = useMemo(() => new TodoRepositoryImpl(), []);

  useEffect(() => {
    if (!userId) {
      setTodos([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Subscribe to real-time changes
    const unsubscribe = repository.getTodosStream(userId, (newTodos) => {
      setTodos(newTodos);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [userId, repository]);

  /** Only parent-level todos (no subtasks) */
  const parentTodos = useMemo(() => {
    return todos.filter(t => !t.parentTodoId);
  }, [todos]);

  /** Filtered parent-level todos */
  const filteredTodos = useMemo(() => {
    return parentTodos.filter(t => {
      if (filter === 'active') return !t.isCompleted;
      if (filter === 'completed') return t.isCompleted;
      return true;
    });
  }, [parentTodos, filter]);

  /** Todos grouped by priority */
  const groupedByPriority = useMemo(() => {
    const sorted = [...filteredTodos].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return {
      high: sorted.filter(t => t.priority === 'high'),
      medium: sorted.filter(t => t.priority === 'medium'),
      low: sorted.filter(t => t.priority === 'low'),
    };
  }, [filteredTodos]);

  /** Get scheduled todos for a specific date */
  const getScheduledTodosForDate = useCallback((date: Date) => {
    const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    return todos.filter(t => {
      if (!t.isScheduled || !t.startTime) return false;
      const tDate = t.scheduledDate || t.startTime;
      if (!tDate) return false;
      const tDateObj = new Date(tDate);
      const tStr = `${tDateObj.getFullYear()}-${(tDateObj.getMonth() + 1).toString().padStart(2, '0')}-${tDateObj.getDate().toString().padStart(2, '0')}`;
      return tStr === dateStr;
    }).sort((a, b) => {
      const aTime = a.startTime ? new Date(a.startTime).getTime() : 0;
      const bTime = b.startTime ? new Date(b.startTime).getTime() : 0;
      return aTime - bTime;
    });
  }, [todos]);

  /** Get subtasks for a parent todo */
  const getSubtasks = useCallback((parentTodoId: string) => {
    return todos.filter(t => t.parentTodoId === parentTodoId);
  }, [todos]);

  /** Count subtasks for a parent todo */
  const getSubtaskCount = useCallback((parentTodoId: string) => {
    const subtasks = getSubtasks(parentTodoId);
    const completed = subtasks.filter(s => s.isCompleted).length;
    return { total: subtasks.length, completed };
  }, [getSubtasks]);

  const saveTodo = useCallback(async (todo: Partial<Todo>) => {
    try {
      const saved = await repository.saveTodo({ ...todo, userId });
      return saved;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [repository, userId]);

  const deleteTodo = useCallback(async (id: string) => {
    try {
      await repository.deleteTodo(id);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [repository]);

  const toggleTodo = useCallback(async (todo: Todo) => {
    return saveTodo({
      ...todo,
      isCompleted: !todo.isCompleted,
      completedAt: !todo.isCompleted ? new Date() : undefined,
    });
  }, [saveTodo]);

  /** Save parent todo + subtasks atomically */
  const saveTodoWithSubtasks = useCallback(async (
    todo: Partial<Todo>,
    subtaskTitles: string[],
  ) => {
    const savedParent = await saveTodo(todo);
    for (const title of subtaskTitles) {
      await saveTodo({
        title,
        userId,
        parentTodoId: savedParent.id,
        priority: savedParent.priority,
        isCompleted: false,
        isScheduled: false,
      });
    }
    return savedParent;
  }, [saveTodo, userId]);

  return {
    todos,
    parentTodos,
    filteredTodos,
    groupedByPriority,
    loading,
    error,
    filter,
    setFilter,
    viewMode,
    setViewMode,
    saveTodo,
    deleteTodo,
    toggleTodo,
    saveTodoWithSubtasks,
    getSubtasks,
    getSubtaskCount,
    getScheduledTodosForDate,
  };
};

import type { ReadonlyURLSearchParams } from 'next/navigation';
import { FocusSessionLaunchConfig } from '@/features/focus/domain/entities/focusSession';
import { Todo } from '@/features/todo/domain/entities/todo';

type SearchParamsInput =
  | URLSearchParams
  | ReadonlyURLSearchParams
  | Record<string, string | string[] | undefined>;

const hasGetter = (
  params: SearchParamsInput
): params is URLSearchParams | ReadonlyURLSearchParams => {
  return typeof (params as URLSearchParams | ReadonlyURLSearchParams).get === 'function';
};

const readParam = (params: SearchParamsInput, key: string): string | undefined => {
  if (hasGetter(params)) {
    return params.get(key) ?? undefined;
  }

  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
};

const parseBoolean = (value?: string) => value === '1' || value === 'true';
const parseNumber = (value?: string) => {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const parseFocusSessionLaunchConfig = (params: SearchParamsInput): FocusSessionLaunchConfig => ({
  autoStart: parseBoolean(readParam(params, 'autoStart')),
  isPomodoro: parseBoolean(readParam(params, 'isPomodoro')),
  returnTo: readParam(params, 'returnTo'),
  todoId: readParam(params, 'todoId'),
  todoTitle: readParam(params, 'todoTitle'),
  focusDurationMinutes: parseNumber(readParam(params, 'focusDurationMinutes')),
  shortBreakMinutes: parseNumber(readParam(params, 'shortBreakMinutes')),
  longBreakMinutes: parseNumber(readParam(params, 'longBreakMinutes')),
  sessionsCount: parseNumber(readParam(params, 'sessionsCount')),
  autoStartBreaks:
    readParam(params, 'autoStartBreaks') === undefined
      ? undefined
      : parseBoolean(readParam(params, 'autoStartBreaks')),
  autoStartFocus:
    readParam(params, 'autoStartFocus') === undefined
      ? undefined
      : parseBoolean(readParam(params, 'autoStartFocus')),
});

export const buildStandaloneFocusSessionHref = (returnTo = '/focus') => {
  const params = new URLSearchParams({
    autoStart: '1',
    isPomodoro: '1',
    returnTo,
  });

  return `/focus/session?${params.toString()}`;
};

export const buildTodoFocusSessionHref = (todo: Todo, returnTo = '/') => {
  const params = new URLSearchParams({
    autoStart: '1',
    isPomodoro: todo.isPomodoroCustom ? '1' : '0',
    todoId: todo.id,
    todoTitle: todo.title,
    returnTo,
  });

  if (todo.focusDurationMinutes) {
    params.set('focusDurationMinutes', String(todo.focusDurationMinutes));
  }

  if (todo.pomodoroShortBreakMinutes) {
    params.set('shortBreakMinutes', String(todo.pomodoroShortBreakMinutes));
  }

  if (todo.pomodoroLongBreakMinutes) {
    params.set('longBreakMinutes', String(todo.pomodoroLongBreakMinutes));
  }

  if (todo.pomodoroSessionsCount) {
    params.set('sessionsCount', String(todo.pomodoroSessionsCount));
  }

  return `/focus/session?${params.toString()}`;
};

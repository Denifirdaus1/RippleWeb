import { Todo } from '../entities/todo';

export interface TodoRepository {
  /**
   * Subscribe to real-time updates for a user's todos.
   * Returns a cleanup function.
   */
  getTodosStream(userId: string, callback: (todos: Todo[]) => void): () => void;
  
  /**
   * Create or update a todo.
   */
  saveTodo(todo: Partial<Todo>): Promise<Todo>;
  
  /**
   * Delete a todo by ID.
   */
  deleteTodo(id: string): Promise<void>;
  
  /**
   * Fetch a single todo by ID.
   */
  getTodoById(id: string): Promise<Todo | null>;
  
  /**
   * Fetch all subtasks for a specific parent todo.
   */
  getSubtasks(parentTodoId: string): Promise<Todo[]>;
}

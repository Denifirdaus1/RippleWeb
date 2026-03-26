import { supabase } from '@/core/utils/supabase';
import { Todo } from '../../domain/entities/todo';
import { TodoRepository } from '../../domain/repositories/todo_repository';
import { TodoModel } from '../models/todo_model';

export class TodoRepositoryImpl implements TodoRepository {
  getTodosStream(userId: string, callback: (todos: Todo[]) => void): () => void {
    const subscription = supabase
      .channel('todos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todos',
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          // Refresh data on any change
          const todos = await this.getTodos(userId);
          callback(todos);
        }
      )
      .subscribe();

    // Initial fetch
    this.getTodos(userId).then(callback);

    return () => {
      supabase.removeChannel(subscription);
    };
  }

  private async getTodos(userId: string): Promise<Todo[]> {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []).map(TodoModel.fromSupabase);
  }

  async saveTodo(todo: Partial<Todo>): Promise<Todo> {
    const supabaseData = TodoModel.toSupabase(todo);
    
    let result;
    if (todo.id) {
      result = await supabase
        .from('todos')
        .update(supabaseData)
        .eq('id', todo.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from('todos')
        .insert(supabaseData)
        .select()
        .single();
    }

    if (result.error) throw result.error;
    return TodoModel.fromSupabase(result.data);
  }

  async deleteTodo(id: string): Promise<void> {
    const { error } = await supabase.from('todos').delete().eq('id', id);
    if (error) throw error;
  }

  async getTodoById(id: string): Promise<Todo | null> {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data ? TodoModel.fromSupabase(data) : null;
  }

  async getSubtasks(parentTodoId: string): Promise<Todo[]> {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('parent_todo_id', parentTodoId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []).map(TodoModel.fromSupabase);
  }
}


'use server';

import { createSupabaseClientWithToken } from '@/lib/supabase/client';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import type { Todo, ServiceListResponse, ServiceResponse } from '@/types/database.types';

export type NewTodoData = Omit<Todo, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_completed'>;
export type UpdateTodoData = Partial<Pick<Todo, 'description' | 'is_completed' | 'due_date'>>;


async function getSupabaseClientForUser() {
  const session = await auth();
  return createSupabaseClientWithToken(session);
}

export async function getTodos(userId: string): Promise<ServiceListResponse<Todo>> {
  const supabaseClient = await getSupabaseClientForUser();
  if (!userId) {
    const error = new Error("User ID is required to fetch todos.");
    return { data: [], error, count: 0 };
  }
  try {
    const { data, error, count } = await supabaseClient
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data as Todo[], error: null, count };
  } catch (err) {
    const error = err as Error;
    console.error('Service error fetching todos:', error.message);
    return { data: [], error, count: 0 };
  }
}

export async function addTodo(userId: string, todoData: NewTodoData): Promise<ServiceResponse<Todo>> {
  const supabaseClient = await getSupabaseClientForUser();
  if (!userId) {
    const error = new Error("User ID is required to add a todo.");
    return { data: null, error };
  }
  try {
    const { data, error } = await supabaseClient
      .from('todos')
      .insert([{ ...todoData, user_id: userId, is_completed: false }])
      .select()
      .single();

    if (error) throw error;
    return { data: data as Todo, error: null };
  } catch (err) {
    const error = err as Error;
    console.error('Service error adding todo:', error.message);
    return { data: null, error };
  }
}

export async function updateTodo(todoId: string, userId: string, updates: UpdateTodoData): Promise<ServiceResponse<Todo>> {
  const supabaseClient = await getSupabaseClientForUser();
  if (!userId) {
    const error = new Error("User ID is required to update a todo.");
    return { data: null, error };
  }
  try {
    const { data, error } = await supabaseClient
      .from('todos')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', todoId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data: data as Todo, error: null };
  } catch (err) {
    const error = err as Error;
    console.error('Service error updating todo:', error.message);
    return { data: null, error };
  }
}

export async function deleteTodo(todoId: string, userId: string): Promise<ServiceResponse<null>> {
  const supabaseClient = await getSupabaseClientForUser();
  if (!userId) {
    const error = new Error("User ID is required to delete a todo.");
    return { data: null, error };
  }
  try {
    const { error } = await supabaseClient
      .from('todos')
      .delete()
      .eq('id', todoId)
      .eq('user_id', userId);

    if (error) throw error;
    return { data: null, error: null };
  } catch (err) {
    const error = err as Error;
    console.error('Service error deleting todo:', error.message);
    return { data: null, error };
  }
}

    
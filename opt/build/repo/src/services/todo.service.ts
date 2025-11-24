// src/services/todo.service.ts
"use server";

import type { Todo } from "@/types/database.types";
import type { ServiceListResponse, ServiceResponse } from "@/types/database.types";
import { createClient } from "@/lib/supabase/server";

export async function getTodos(userId: string): Promise<ServiceListResponse<Todo>> {
  if (!userId) {
    return { data: [], error: "ID do usuário não fornecido." };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Erro ao buscar tarefas:", error.message);
    return { data: null, error: "Não foi possível carregar as tarefas." };
  }

  return { data, error: null };
}

export type NewTodoData = Omit<Todo, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export async function addTodo(userId: string, todoData: NewTodoData): Promise<ServiceResponse<Todo>> {
  if (!userId) {
    return { data: null, error: "ID do usuário não fornecido." };
  }

  const supabase = createClient();
  const { data: newTodo, error } = await supabase
    .from('todos')
    .insert({
      user_id: userId,
      ...todoData,
    })
    .select()
    .single();
    
  if (error) {
    console.error("Erro ao adicionar tarefa:", error.message);
    return { data: null, error: "Não foi possível salvar a nova tarefa." };
  }

  return { data: newTodo, error: null };
}

export async function updateTodo(id: string, updates: Partial<Todo>): Promise<ServiceResponse<Todo>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('todos')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Erro ao atualizar tarefa ${id}:`, error.message);
    return { data: null, error: "Não foi possível atualizar a tarefa." };
  }
  return { data, error: null };
}

export async function deleteTodo(id: string): Promise<{ error: string | null }> {
  if (!id) {
    return { error: "ID da tarefa não fornecido." };
  }
  
  const supabase = createClient();
  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Erro ao deletar tarefa ${id}:`, error.message);
    return { error: "Não foi possível deletar a tarefa." };
  }

  return { error: null };
}

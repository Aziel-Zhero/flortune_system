
'use server'; // Embora as funções possam ser chamadas do cliente, Supabase SDK lida com isso.

import { supabase } from '@/lib/supabase/client';
import type { Category, ServiceListResponse, ServiceResponse } from '@/types/database.types';

// Função para buscar categorias (padrão e do usuário)
export async function getCategories(userId: string | null): Promise<ServiceListResponse<Category>> {
  try {
    let query = supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (userId) {
      // Busca categorias padrão (user_id IS NULL) OU categorias do usuário específico
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    } else {
      // Se não houver userId (ex: usuário não logado, embora não deva acontecer em rotas protegidas), busca apenas padrão
      query = query.is('user_id', null);
    }
    
    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching categories:', error.message);
      throw new Error(error.message);
    }
    return { data, error: null, count };
  } catch (err) {
    const error = err as Error;
    console.error('Service error fetching categories:', error.message);
    return { data: null, error, count: 0 };
  }
}

// Função para adicionar uma nova categoria (apenas para usuário logado)
export async function addCategory(userId: string, categoryData: Omit<Category, 'id' | 'user_id' | 'created_at'>): Promise<ServiceResponse<Category>> {
  if (!userId) {
    const error = new Error("User ID is required to add a category.");
    console.error(error.message);
    return { data: null, error };
  }
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert([{ ...categoryData, user_id: userId }])
      .select()
      .single();

    if (error) {
      console.error('Error adding category:', error.message);
      throw new Error(error.message);
    }
    return { data, error: null };
  } catch (err) {
    const error = err as Error;
    console.error('Service error adding category:', error.message);
    return { data: null, error };
  }
}

// Adicionar funções para updateCategory e deleteCategory (se personalizadas pelo usuário) no futuro.
// Categorias padrão não devem ser deletáveis/editáveis pelos usuários.

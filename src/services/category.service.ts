
'use server';

import { supabase } from '@/lib/supabase/client';
import type { Category, ServiceListResponse, ServiceResponse } from '@/types/database.types';

// Função para buscar categorias (padrão e do usuário)
export async function getCategories(userId: string | null): Promise<ServiceListResponse<Category>> {
  try {
    let query = supabase
      .from('categories')
      .select('*')
      .order('is_default', { ascending: false }) // Padrão primeiro
      .order('name', { ascending: true });

    if (userId) {
      query = query.or(`user_id.eq.${userId},is_default.is.true`);
    } else {
      query = query.is('is_default', true);
    }
    
    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching categories:', error.message);
      throw new Error(error.message);
    }
    return { data: data as Category[], error: null, count };
  } catch (err) {
    const error = err as Error;
    console.error('Service error fetching categories:', error.message);
    return { data: null, error, count: 0 };
  }
}

// Função para adicionar uma nova categoria (apenas para usuário logado)
// Note: is_default será FALSE por padrão para categorias criadas pelo usuário.
export async function addCategory(userId: string, categoryData: Omit<Category, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_default'>): Promise<ServiceResponse<Category>> {
  if (!userId) {
    const error = new Error("User ID is required to add a category.");
    console.error(error.message);
    return { data: null, error };
  }
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert([{ ...categoryData, user_id: userId, is_default: false }])
      .select()
      .single();

    if (error) {
      console.error('Error adding category:', error.message);
      throw new Error(error.message);
    }
    return { data: data as Category, error: null };
  } catch (err) {
    const error = err as Error;
    console.error('Service error adding category:', error.message);
    return { data: null, error };
  }
}

// Adicionar funções para updateCategory e deleteCategory (se personalizadas pelo usuário) no futuro.
// Categorias padrão não devem ser deletáveis/editáveis pelos usuários.


'use server';

import { supabase } from '@/lib/supabase/client';
import type { Budget, ServiceListResponse, ServiceResponse } from '@/types/database.types';

export type NewBudgetData = Omit<Budget, 'id' | 'user_id' | 'created_at' | 'category'>;

// Buscar orçamentos de um usuário para um mês/ano específico ou todos
export async function getBudgets(userId: string, month?: number, year?: number): Promise<ServiceListResponse<Budget>> {
  if (!userId) {
    const error = new Error("User ID is required to fetch budgets.");
    return { data: [], error, count: 0 };
  }
  try {
    let query = supabase
      .from('budgets')
      .select(`
        *,
        category:categories(id, name, type, icon)
      `)
      .eq('user_id', userId);

    if (month && year) {
      query = query.eq('month', month).eq('year', year);
    }
    query = query.order('category_id', { ascending: true }); // Ou como preferir ordenar

    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching budgets:', error.message);
      throw new Error(error.message);
    }
     const budgets = data?.map(b => ({
      ...b,
      category: Array.isArray(b.category) ? b.category[0] : b.category,
    })) || [];

    return { data: budgets as Budget[], error: null, count };
  } catch (err) {
    const error = err as Error;
    console.error('Service error fetching budgets:', error.message);
    return { data: [], error, count: 0 };
  }
}

// Adicionar um novo orçamento
export async function addBudget(userId: string, budgetData: NewBudgetData): Promise<ServiceResponse<Budget>> {
 if (!userId) {
    const error = new Error("User ID is required to add a budget.");
    return { data: null, error };
  }
  try {
    const { data, error } = await supabase
      .from('budgets')
      .insert([{ ...budgetData, user_id: userId }])
      .select(`
        *,
        category:categories(id, name, type, icon)
      `)
      .single();

    if (error) {
      console.error('Error adding budget:', error.message);
      throw new Error(error.message);
    }
    const newBudget = {
      ...data,
      category: Array.isArray(data.category) ? data.category[0] : data.category,
    } as Budget;
    return { data: newBudget, error: null };
  } catch (err) {
    const error = err as Error;
    console.error('Service error adding budget:', error.message);
    return { data: null, error };
  }
}

// Deletar um orçamento
export async function deleteBudget(budgetId: number, userId: string): Promise<ServiceResponse<null>> {
  if (!userId) {
    const error = new Error("User ID is required to delete a budget.");
    return { data: null, error };
  }
  try {
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', budgetId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting budget:', error.message);
      throw new Error(error.message);
    }
    return { data: null, error: null };
  } catch (err) {
    const error = err as Error;
    console.error('Service error deleting budget:', error.message);
    return { data: null, error };
  }
}
// Implementar updateBudget no futuro

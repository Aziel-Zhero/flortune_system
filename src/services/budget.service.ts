
'use server';

import { supabase } from '@/lib/supabase/client';
import type { Budget, ServiceListResponse, ServiceResponse, Category } from '@/types/database.types';

// category_id é string (UUID)
export type NewBudgetData = Omit<Budget, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'spent_amount' | 'category'> & {
  category_id: string; // Explicitly string for UUID
};

// Buscar orçamentos de um usuário
export async function getBudgets(userId: string): Promise<ServiceListResponse<Budget>> {
  if (!userId) {
    const error = new Error("User ID is required to fetch budgets.");
    return { data: [], error, count: 0 };
  }
  try {
    const { data, error, count } = await supabase
      .from('budgets')
      .select(`
        id,
        user_id,
        category_id,
        limit_amount,
        spent_amount,
        period_start_date,
        period_end_date,
        created_at,
        updated_at,
        category:categories (id, name, type, icon, is_default)
      `)
      .eq('user_id', userId)
      .order('period_start_date', { ascending: false });

    if (error) {
      console.error('Error fetching budgets:', error.message);
      throw new Error(error.message);
    }
    const budgets = data?.map(b => ({
      ...b,
      category: b.category as Category, // Ensure correct typing
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
      .insert([{ ...budgetData, user_id: userId, spent_amount: 0 }]) // spent_amount defaults to 0
      .select(`
        id,
        user_id,
        category_id,
        limit_amount,
        spent_amount,
        period_start_date,
        period_end_date,
        created_at,
        updated_at,
        category:categories (id, name, type, icon, is_default)
      `)
      .single();

    if (error) {
      console.error('Error adding budget:', error.message);
      throw new Error(error.message);
    }
    const newBudget = {
      ...data,
      category: data.category as Category,
    } as Budget;
    return { data: newBudget, error: null };
  } catch (err) {
    const error = err as Error;
    console.error('Service error adding budget:', error.message);
    return { data: null, error };
  }
}

// Deletar um orçamento
export async function deleteBudget(budgetId: string, userId: string): Promise<ServiceResponse<null>> {
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

// TODO: Implementar updateBudget
// export async function updateBudget(budgetId: string, userId: string, budgetData: Partial<NewBudgetData>): Promise<ServiceResponse<Budget>>

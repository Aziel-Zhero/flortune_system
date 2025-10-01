'use server';

import { createSupabaseClientWithToken } from '@/lib/supabase/client';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import type { Budget, ServiceListResponse, ServiceResponse, Category } from '@/types/database.types';

export type NewBudgetData = Omit<Budget, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'spent_amount' | 'category'>;

export type UpdateBudgetData = Partial<Pick<Budget, 'category_id' | 'limit_amount' | 'period_start_date' | 'period_end_date'>>;

async function getSupabaseClientForUser() {
  const session = await auth();
  return createSupabaseClientWithToken(session);
}

export async function getBudgets(userId: string): Promise<ServiceListResponse<Budget>> {
  const supabaseClient = await getSupabaseClientForUser();
  if (!supabaseClient) {
    return { data: [], error: new Error("Supabase client is not initialized. Check environment variables."), count: 0 };
  }
  if (!userId) {
    const error = new Error("User ID is required to fetch budgets.");
    return { data: [], error, count: 0 };
  }
  try {
    const { data, error, count } = await supabaseClient
      .from('budgets')
      .select(`
        *,
        category:categories (*)
      `)
      .eq('user_id', userId)
      .order('period_start_date', { ascending: false });

    if (error) throw error;
    const budgets = data?.map(b => ({
      ...b,
      category: b.category as Category, 
    })) || [];

    return { data: budgets as Budget[], error: null, count };
  } catch (err) {
    const error = err as Error;
    console.error('Service error fetching budgets:', error.message);
    return { data: [], error, count: 0 };
  }
}

export async function addBudget(userId: string, budgetData: NewBudgetData): Promise<ServiceResponse<Budget>> {
  const supabaseClient = await getSupabaseClientForUser();
  if (!supabaseClient) {
    return { data: null, error: new Error("Supabase client is not initialized. Check environment variables.") };
  }
  if (!userId) {
    const error = new Error("User ID is required to add a budget.");
    return { data: null, error };
  }
  try {
    const { data, error } = await supabaseClient
      .from('budgets')
      .insert([{ ...budgetData, user_id: userId, spent_amount: 0 }]) 
      .select(`
        *,
        category:categories (*)
      `)
      .single();

    if (error) throw error;
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

export async function updateBudget(budgetId: string, userId: string, budgetData: UpdateBudgetData): Promise<ServiceResponse<Budget>> {
  const supabaseClient = await getSupabaseClientForUser();
  if (!supabaseClient) {
    return { data: null, error: new Error("Supabase client is not initialized. Check environment variables.") };
  }
  if (!userId) {
    const error = new Error("User ID is required to update a budget.");
    return { data: null, error };
  }
  try {
    const dataToUpdate = { ...budgetData, updated_at: new Date().toISOString() };
    const { data, error } = await supabaseClient
      .from('budgets')
      .update(dataToUpdate)
      .eq('id', budgetId)
      .eq('user_id', userId)
      .select(`
        *,
        category:categories (*)
      `)
      .single();
    if (error) throw error;
    const updatedBudget = { ...data, category: data.category as Category } as Budget;
    return { data: updatedBudget, error: null };
  } catch (err) {
    const error = err as Error;
    console.error('Service error updating budget:', error.message);
    return { data: null, error };
  }
}


export async function deleteBudget(budgetId: string, userId: string): Promise<ServiceResponse<null>> {
  const supabaseClient = await getSupabaseClientForUser();
  if (!supabaseClient) {
    return { data: null, error: new Error("Supabase client is not initialized. Check environment variables.") };
  }
  if (!userId) {
    const error = new Error("User ID is required to delete a budget.");
    return { data: null, error };
  }
  try {
    const { error } = await supabaseClient
      .from('budgets')
      .delete()
      .eq('id', budgetId)
      .eq('user_id', userId);

    if (error) throw error;
    return { data: null, error: null };
  } catch (err) {
    const error = err as Error;
    console.error('Service error deleting budget:', error.message);
    return { data: null, error };
  }
}

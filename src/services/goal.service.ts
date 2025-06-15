
'use server';

import { supabase } from '@/lib/supabase/client';
import type { FinancialGoal, ServiceListResponse, ServiceResponse } from '@/types/database.types';

export type NewFinancialGoalData = Omit<FinancialGoal, 'id' | 'user_id' | 'created_at' | 'current_amount'>;

// Buscar metas financeiras de um usuário
export async function getFinancialGoals(userId: string): Promise<ServiceListResponse<FinancialGoal>> {
  if (!userId) {
    const error = new Error("User ID is required to fetch financial goals.");
    return { data: [], error, count: 0 };
  }
  try {
    const { data, error, count } = await supabase
      .from('financial_goals')
      .select('*')
      .eq('user_id', userId)
      .order('deadline', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching financial goals:', error.message);
      throw new Error(error.message);
    }
    return { data: data as FinancialGoal[], error: null, count };
  } catch (err) {
    const error = err as Error;
    console.error('Service error fetching financial goals:', error.message);
    return { data: [], error, count: 0 };
  }
}

// Adicionar uma nova meta financeira
export async function addFinancialGoal(userId: string, goalData: NewFinancialGoalData): Promise<ServiceResponse<FinancialGoal>> {
  if (!userId) {
    const error = new Error("User ID is required to add a financial goal.");
    return { data: null, error };
  }
  try {
    const { data, error } = await supabase
      .from('financial_goals')
      .insert([{ ...goalData, user_id: userId, current_amount: 0 }]) // current_amount inicia em 0
      .select()
      .single();

    if (error) {
      console.error('Error adding financial goal:', error.message);
      throw new Error(error.message);
    }
    return { data: data as FinancialGoal, error: null };
  } catch (err) {
    const error = err as Error;
    console.error('Service error adding financial goal:', error.message);
    return { data: null, error };
  }
}

// Deletar uma meta financeira
export async function deleteFinancialGoal(goalId: number, userId: string): Promise<ServiceResponse<null>> {
  if (!userId) {
    const error = new Error("User ID is required to delete a financial goal.");
    return { data: null, error };
  }
  try {
    const { error } = await supabase
      .from('financial_goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting financial goal:', error.message);
      throw new Error(error.message);
    }
    return { data: null, error: null };
  } catch (err) {
    const error = err as Error;
    console.error('Service error deleting financial goal:', error.message);
    return { data: null, error };
  }
}
// Implementar updateFinancialGoal no futuro

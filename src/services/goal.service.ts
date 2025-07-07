
'use server';

import { createSupabaseClientWithToken } from '@/lib/supabase/client';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import type { FinancialGoal, ServiceListResponse, ServiceResponse } from '@/types/database.types';

export type NewFinancialGoalData = Omit<FinancialGoal, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'current_amount' | 'status'>;
export type UpdateFinancialGoalData = Partial<Omit<FinancialGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;


async function getSupabaseClientForUser() {
  const session = await auth();
  return createSupabaseClientWithToken(session);
}

export async function getFinancialGoals(userId: string): Promise<ServiceListResponse<FinancialGoal>> {
  const supabaseClient = await getSupabaseClientForUser();
  if (!userId) {
    const error = new Error("User ID is required to fetch financial goals.");
    return { data: [], error, count: 0 };
  }
  try {
    const { data, error, count } = await supabaseClient
      .from('financial_goals')
      .select('*')
      .eq('user_id', userId)
      .order('deadline_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data as FinancialGoal[], error: null, count };
  } catch (err) {
    const error = err as Error;
    console.error('Service error fetching financial goals:', error.message);
    return { data: [], error, count: 0 };
  }
}

export async function addFinancialGoal(userId: string, goalData: NewFinancialGoalData): Promise<ServiceResponse<FinancialGoal>> {
  const supabaseClient = await getSupabaseClientForUser();
  if (!userId) {
    const error = new Error("User ID is required to add a financial goal.");
    return { data: null, error };
  }
  try {
    const { data, error } = await supabaseClient
      .from('financial_goals')
      .insert([{ 
        ...goalData, 
        user_id: userId, 
        current_amount: 0, 
        status: 'in_progress' 
      }])
      .select()
      .single();

    if (error) throw error;
    return { data: data as FinancialGoal, error: null };
  } catch (err) {
    const error = err as Error;
    console.error('Service error adding financial goal:', error.message);
    return { data: null, error };
  }
}

export async function updateFinancialGoal(goalId: string, userId: string, goalData: UpdateFinancialGoalData): Promise<ServiceResponse<FinancialGoal>> {
    const supabaseClient = await getSupabaseClientForUser();
    if (!userId) {
        const error = new Error("User ID is required to update a financial goal.");
        return { data: null, error };
    }
    try {
        const dataToUpdate = { ...goalData, updated_at: new Date().toISOString() };
        const { data, error } = await supabaseClient
            .from('financial_goals')
            .update(dataToUpdate)
            .eq('id', goalId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;
        return { data: data as FinancialGoal, error: null };
    } catch (err) {
        const error = err as Error;
        console.error('Service error updating financial goal:', error.message);
        return { data: null, error };
    }
}


export async function deleteFinancialGoal(goalId: string, userId: string): Promise<ServiceResponse<null>> {
  const supabaseClient = await getSupabaseClientForUser();
  if (!userId) {
    const error = new Error("User ID is required to delete a financial goal.");
    return { data: null, error };
  }
  try {
    const { error } = await supabaseClient
      .from('financial_goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', userId);

    if (error) throw error;
    return { data: null, error: null };
  } catch (err) {
    const error = err as Error;
    console.error('Service error deleting financial goal:', error.message);
    return { data: null, error };
  }
}

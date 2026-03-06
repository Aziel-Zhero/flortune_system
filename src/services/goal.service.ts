// src/services/goal.service.ts
"use server";

import type { FinancialGoal } from "@/types/database.types";
import type { ServiceListResponse, ServiceResponse } from "@/types/database.types";
import { createClient } from "@/lib/supabase/server";

export async function getFinancialGoals(userId: string): Promise<ServiceListResponse<FinancialGoal>> {
  if (!userId) {
    return { data: [], error: "ID do usuário não fornecido." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('financial_goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Erro ao buscar metas financeiras:", error.message);
    return { data: null, error: "Não foi possível carregar as metas financeiras." };
  }

  return { data, error: null };
}

export type NewFinancialGoalData = Omit<FinancialGoal, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'current_amount' | 'status'>;

export async function addFinancialGoal(userId: string, goalData: NewFinancialGoalData): Promise<ServiceResponse<FinancialGoal>> {
  if (!userId) {
    return { data: null, error: "ID do usuário não fornecido." };
  }

  const supabase = await createClient();
  const { data: newGoal, error } = await supabase
    .from('financial_goals')
    .insert({
      user_id: userId,
      ...goalData,
      current_amount: 0,
      status: 'in_progress',
    })
    .select()
    .single();
    
  if (error) {
    console.error("Erro ao adicionar meta financeira:", error.message);
    return { data: null, error: "Não foi possível salvar a nova meta." };
  }

  return { data: newGoal, error: null };
}

export async function deleteFinancialGoal(goalId: string): Promise<{ error: string | null }> {
  if (!goalId) {
    return { error: "ID da meta não fornecido." };
  }
  
  const supabase = await createClient();
  const { error } = await supabase
    .from('financial_goals')
    .delete()
    .eq('id', goalId);

  if (error) {
    console.error(`Erro ao deletar meta ${goalId}:`, error.message);
    return { error: "Não foi possível deletar a meta." };
  }

  return { error: null };
}

// src/services/budget.service.ts
"use server";

import type { Budget } from "@/types/database.types";
import type { ServiceListResponse, ServiceResponse } from "@/types/database.types";
import { createClient } from "@/lib/supabase/server";

export async function getBudgets(userId: string): Promise<ServiceListResponse<Budget>> {
  if (!userId) {
    return { data: [], error: "ID do usuário não fornecido." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('budgets')
    .select('*, category:categories(*)')
    .eq('user_id', userId);

  if (error) {
    console.error("Erro ao buscar orçamentos:", error.message);
    return { data: null, error: "Não foi possível carregar os orçamentos." };
  }

  return { data, error: null };
}

export type NewBudgetData = Omit<Budget, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'spent_amount' | 'category'>;

export async function addBudget(userId: string, budgetData: NewBudgetData): Promise<ServiceResponse<Budget>> {
  if (!userId) {
    return { data: null, error: "ID do usuário não fornecido." };
  }
  const supabase = await createClient();
  const { data: newBudget, error } = await supabase
    .from('budgets')
    .insert({
      user_id: userId,
      ...budgetData,
      spent_amount: 0,
    })
    .select()
    .single();

  if (error) {
    console.error("Erro ao adicionar orçamento:", error.message);
    return { data: null, error: "Não foi possível salvar o novo orçamento." };
  }

  return { data: newBudget, error: null };
}

export async function deleteBudget(budgetId: string): Promise<{ error: string | null }> {
  if (!budgetId) {
    return { error: "ID do orçamento não fornecido." };
  }
  
  const supabase = await createClient();
  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', budgetId);

  if (error) {
    console.error(`Erro ao deletar orçamento ${budgetId}:`, error.message);
    return { error: "Não foi possível deletar o orçamento." };
  }

  return { error: null };
}

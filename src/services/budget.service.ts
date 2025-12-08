// src/services/budget.service.ts
"use server";

import type { Budget } from "@/types/database.types";
import type { ServiceListResponse, ServiceResponse } from "@/types/database.types";

const mockBudgets: Budget[] = [];

export async function getBudgets(userId: string): Promise<ServiceListResponse<Budget>> {
  if (!userId) {
    return { data: [], error: "ID do usuário não fornecido." };
  }
  // Simula um atraso da API
  await new Promise(resolve => setTimeout(resolve, 500));
  // Filtra os orçamentos para o usuário mockado
  const userBudgets = mockBudgets.filter(b => b.user_id === userId);
  return { data: userBudgets, error: null };
}

export type NewBudgetData = Omit<Budget, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'spent_amount'>;

export async function addBudget(userId: string, budgetData: NewBudgetData): Promise<ServiceResponse<Budget>> {
  if (!userId) {
    return { data: null, error: "ID do usuário não fornecido." };
  }
  const newBudget: Budget = {
    id: `budget_${Date.now()}`,
    user_id: userId,
    ...budgetData,
    spent_amount: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  mockBudgets.push(newBudget);
  await new Promise(resolve => setTimeout(resolve, 200));
  return { data: newBudget, error: null };
}

export async function deleteBudget(budgetId: string): Promise<{ error: string | null }> {
  if (!budgetId) {
    return { error: "ID do orçamento não fornecido." };
  }
  const index = mockBudgets.findIndex(b => b.id === budgetId);
  if (index > -1) {
    mockBudgets.splice(index, 1);
  } else {
    return { error: "Orçamento não encontrado." };
  }
  await new Promise(resolve => setTimeout(resolve, 200));
  return { error: null };
}

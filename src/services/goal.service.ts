// src/services/goal.service.ts
"use server";

import type { FinancialGoal } from "@/types/database.types";
import type { ServiceListResponse, ServiceResponse } from "@/types/database.types";
import { createClient } from "@/lib/supabase/server";

// --- MOCK DATA ---
const mockGoals: FinancialGoal[] = [
    {
        id: "goal_1",
        user_id: "mock-user-id",
        name: "Viagem para o Japão",
        target_amount: 25000,
        current_amount: 7500,
        deadline_date: "2025-12-31",
        icon: "Plane",
        status: 'in_progress',
        notes: "Economizar para a viagem dos sonhos em 2025.",
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-07-26T11:00:00Z",
    },
    {
        id: "goal_2",
        user_id: "mock-user-id",
        name: "Entrada do Apartamento",
        target_amount: 80000,
        current_amount: 82500,
        deadline_date: "2024-06-30",
        icon: "Home",
        status: 'achieved',
        notes: "Conseguimos! 🎉",
        created_at: "2023-01-01T10:00:00Z",
        updated_at: "2024-06-28T15:00:00Z",
    },
     {
        id: "goal_3",
        user_id: "mock-user-id",
        name: "Novo MacBook Pro",
        target_amount: 15000,
        current_amount: 4300,
        deadline_date: "2024-10-31",
        icon: "Laptop",
        status: 'in_progress',
        notes: "Para trabalho e projetos pessoais.",
        created_at: "2024-03-01T10:00:00Z",
        updated_at: "2024-07-20T18:00:00Z",
    },
];

export async function getFinancialGoals(userId: string): Promise<ServiceListResponse<FinancialGoal>> {
  if (!userId) {
    return { data: [], error: "ID do usuário não fornecido." };
  }
  // Simulating API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  return { data: mockGoals, error: null, isMock: true };
}

export type NewFinancialGoalData = Omit<FinancialGoal, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'current_amount' | 'status'>;

export async function addFinancialGoal(userId: string, goalData: NewFinancialGoalData): Promise<ServiceResponse<FinancialGoal>> {
  if (!userId) {
    return { data: null, error: "ID do usuário não fornecido." };
  }
  const newGoal: FinancialGoal = {
    id: `goal_${Date.now()}`,
    user_id: userId,
    ...goalData,
    current_amount: 0,
    status: 'in_progress',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  mockGoals.unshift(newGoal);
  await new Promise(resolve => setTimeout(resolve, 200));
  return { data: newGoal, error: null };
}

export async function deleteFinancialGoal(goalId: string): Promise<{ error: string | null }> {
  if (!goalId) {
    return { error: "ID da meta não fornecido." };
  }
  const index = mockGoals.findIndex(g => g.id === goalId);
  if (index > -1) {
    mockGoals.splice(index, 1);
  }
  await new Promise(resolve => setTimeout(resolve, 200));
  return { error: null };
}

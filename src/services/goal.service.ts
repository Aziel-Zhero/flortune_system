
// src/services/goal.service.ts
"use server";

import { supabase } from "@/lib/supabase/client";
import type { FinancialGoal } from "@/types/database.types";
import type { ServiceListResponse, ServiceResponse } from "@/types/database.types";

/**
 * Fetches all financial goals for a user.
 * @param userId - The ID of the user.
 * @returns A promise that resolves to the list of financial goals or an error.
 */
export async function getFinancialGoals(userId: string): Promise<ServiceListResponse<FinancialGoal>> {
  // Simulate a successful response with mock data since auth is off
  const sampleGoals: FinancialGoal[] = [
    { id: 'goal1', user_id: userId, name: 'Viagem para a Europa', target_amount: 20000, current_amount: 8500, status: 'in_progress', deadline_date: '2025-12-31', icon: 'Plane', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'goal2', user_id: userId, name: 'Reserva de Emergência', target_amount: 15000, current_amount: 15000, status: 'achieved', deadline_date: null, icon: 'ShieldCheck', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'goal3', user_id: userId, name: 'Novo Computador', target_amount: 7000, current_amount: 3200, status: 'in_progress', deadline_date: '2024-12-31', icon: 'Laptop', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ];
  return new Promise(resolve => setTimeout(() => resolve({ data: sampleGoals, error: null }), 300));
}


export type NewFinancialGoalData = Omit<FinancialGoal, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'current_amount' | 'status'>;

/**
 * Adds a new financial goal for a user.
 * @param userId - The ID of the user.
 * @param goalData - The data for the new goal.
 * @returns A promise that resolves to the newly created goal or an error.
 */
export async function addFinancialGoal(userId: string, goalData: NewFinancialGoalData): Promise<ServiceResponse<FinancialGoal>> {
  // Simulate adding a new goal
   const newGoal: FinancialGoal = {
    id: `goal_${Date.now()}`,
    user_id: userId,
    ...goalData,
    current_amount: 0,
    status: 'in_progress',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
   return new Promise(resolve => setTimeout(() => resolve({ data: newGoal, error: null }), 300));
}

/**
 * Deletes a financial goal for a user.
 * @param goalId - The ID of the goal to delete.
 * @param userId - The ID of the user who owns the goal.
 * @returns A promise that resolves to a success status or an error.
 */
export async function deleteFinancialGoal(goalId: string, userId: string): Promise<{ error: Error | null }> {
    // Simulate deleting a goal
    console.log(`Simulating delete for goal ${goalId} for user ${userId}`);
    return new Promise(resolve => setTimeout(() => resolve({ error: null }), 300));
}

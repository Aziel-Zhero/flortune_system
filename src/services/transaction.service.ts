// src/services/transaction.service.ts
"use server";

import { supabase } from "@/lib/supabase/client";
import type { Transaction } from "@/types/database.types";
import type { ServiceListResponse, ServiceResponse } from "@/types/database.types";

/**
 * Fetches all transactions for a user, optionally filtered by month and year.
 * @param userId - The ID of the user.
 * @returns A promise that resolves to the list of transactions or an error.
 */
export async function getTransactions(userId: string): Promise<ServiceListResponse<Transaction>> {
  if (!supabase) {
    return { data: null, error: new Error("Supabase client is not initialized.") };
  }
  if (!userId) {
    return { data: null, error: new Error("User ID is required.") };
  }

  try {
    const { data, error } = await supabase
      .from("transactions")
      .select(`
        *,
        category:categories (
          id,
          name,
          type
        )
      `)
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching transactions:", error.message);
      throw error;
    }

    // O Supabase retorna `category` como um objeto, mas o tipo pode esperar um array.
    // Garantimos que o tipo esteja correto.
    const typedData = data as unknown as Transaction[];

    return { data: typedData, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
}

export type NewTransactionData = Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'category'>;

/**
 * Adds a new transaction for a user.
 * @param userId - The ID of the user.
 * @param transactionData - The data for the new transaction.
 * @returns A promise that resolves to the newly created transaction or an error.
 */
export async function addTransaction(userId: string, transactionData: NewTransactionData): Promise<ServiceResponse<Transaction>> {
  if (!supabase) {
    return { data: null, error: new Error("Supabase client is not initialized.") };
  }
  if (!userId) {
    return { data: null, error: new Error("User ID is required.") };
  }

  try {
    const { data, error } = await supabase
      .from("transactions")
      .insert([{ ...transactionData, user_id: userId }])
      .select()
      .single();

    if (error) {
      console.error("Error adding transaction:", error.message);
      throw error;
    }

    return { data, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
}


/**
 * Deletes a transaction for a user.
 * @param transactionId - The ID of the transaction to delete.
 * @param userId - The ID of the user who owns the transaction.
 * @returns A promise that resolves to a success status or an error.
 */
export async function deleteTransaction(transactionId: string, userId: string): Promise<{ error: Error | null }> {
    if (!supabase) {
        return { error: new Error("Supabase client is not initialized.") };
    }
    if (!userId || !transactionId) {
        return { error: new Error("Transaction ID and User ID are required.") };
    }

    try {
        const { error } = await supabase
            .from("transactions")
            .delete()
            .eq('id', transactionId)
            .eq('user_id', userId); // Security check to ensure user owns the transaction

        if (error) {
            console.error("Error deleting transaction:", error.message);
            throw error;
        }

        return { error: null };

    } catch (error: any) {
        return { error };
    }
}

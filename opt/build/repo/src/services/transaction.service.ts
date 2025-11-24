// src/services/transaction.service.ts
"use server";

import type { Transaction } from "@/types/database.types";
import type { ServiceListResponse, ServiceResponse } from "@/types/database.types";
import { createClient } from "@/lib/supabase/server";

export async function getTransactions(userId: string): Promise<ServiceListResponse<Transaction>> {
  if (!userId) {
    return { data: [], error: "ID do usuário não fornecido." };
  }
  
  const supabase = createClient();
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) {
    console.error("Erro ao buscar transações:", error.message);
    return { data: null, error: "Não foi possível carregar as transações." };
  }

  return { data, error: null };
}

export type NewTransactionData = Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'category'>;

export async function addTransaction(userId: string, transactionData: NewTransactionData): Promise<ServiceResponse<Transaction>> {
  if (!userId) {
    return { data: null, error: "ID do usuário não fornecido." };
  }
  
  const supabase = createClient();
  
  const { data: newTransaction, error } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      ...transactionData,
    })
    .select()
    .single();

  if (error) {
    console.error("Erro ao adicionar transação:", error.message);
    return { data: null, error: "Não foi possível salvar a nova transação." };
  }
  
  return { data: newTransaction, error: null };
}

export async function deleteTransaction(transactionId: string, userId: string): Promise<{ error: Error | null }> {
  if (!userId || !transactionId) {
    return { error: new Error("ID da transação ou do usuário não fornecido.") };
  }
  
  const supabase = createClient();
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId)
    .eq('user_id', userId); // Garante que o usuário só pode deletar suas próprias transações

  if (error) {
    console.error(`Erro ao deletar transação ${transactionId}:`, error.message);
    return { error: new Error("Não foi possível deletar a transação.") };
  }

  return { error: null };
}

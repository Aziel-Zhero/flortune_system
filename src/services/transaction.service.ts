
'use server';

import { supabase } from '@/lib/supabase/client';
import type { Transaction, ServiceListResponse, ServiceResponse } from '@/types/database.types';

// Tipo para os dados de entrada de uma nova transação
export type NewTransactionData = Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'category'>;
// Tipo para os dados de atualização de uma transação
export type UpdateTransactionData = Partial<NewTransactionData>;


// Buscar transações de um usuário, com informações da categoria
export async function getTransactions(userId: string): Promise<ServiceListResponse<Transaction>> {
  if (!userId) {
    const error = new Error("User ID is required to fetch transactions.");
    console.error(error.message);
    return { data: [], error, count: 0 };
  }
  try {
    const { data, error, count } = await supabase
      .from('transactions')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error.message);
      throw new Error(error.message);
    }
    // O Supabase retorna 'category' como um objeto ou null. Se for um array, pegamos o primeiro.
    // Isso é mais uma garantia, pois a relação é one-to-one.
    const transactions = data?.map(tx => ({
      ...tx,
      category: Array.isArray(tx.category) ? tx.category[0] : tx.category,
    })) || [];

    return { data: transactions as Transaction[], error: null, count };
  } catch (err) {
    const error = err as Error;
    console.error('Service error fetching transactions:', error.message);
    return { data: [], error, count: 0 };
  }
}

// Adicionar uma nova transação
export async function addTransaction(userId: string, transactionData: NewTransactionData): Promise<ServiceResponse<Transaction>> {
  if (!userId) {
    const error = new Error("User ID is required to add a transaction.");
    console.error(error.message);
    return { data: null, error };
  }
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert([{ ...transactionData, user_id: userId }])
      .select(`
        *,
        category:categories(*)
      `)
      .single();
    
    if (error) {
      console.error('Error adding transaction:', error.message);
      throw new Error(error.message);
    }
     const newTransaction = {
      ...data,
      category: Array.isArray(data.category) ? data.category[0] : data.category,
    } as Transaction;

    return { data: newTransaction, error: null };
  } catch (err) {
    const error = err as Error;
    console.error('Service error adding transaction:', error.message);
    return { data: null, error };
  }
}

// Atualizar uma transação existente
export async function updateTransaction(transactionId: number, userId: string, transactionData: UpdateTransactionData): Promise<ServiceResponse<Transaction>> {
  if (!userId) {
    const error = new Error("User ID is required to update a transaction.");
    return { data: null, error };
  }
  try {
    const { data, error } = await supabase
      .from('transactions')
      .update(transactionData)
      .eq('id', transactionId)
      .eq('user_id', userId) // Garante que o usuário só atualize suas próprias transações
      .select(`
        *,
        category:categories(*)
      `)
      .single();

    if (error) {
      console.error('Error updating transaction:', error.message);
      throw new Error(error.message);
    }
    const updatedTransaction = {
      ...data,
      category: Array.isArray(data.category) ? data.category[0] : data.category,
    } as Transaction;
    return { data: updatedTransaction, error: null };
  } catch (err) {
    const error = err as Error;
    console.error('Service error updating transaction:', error.message);
    return { data: null, error };
  }
}

// Deletar uma transação
export async function deleteTransaction(transactionId: number, userId: string): Promise<ServiceResponse<null>> {
   if (!userId) {
    const error = new Error("User ID is required to delete a transaction.");
    console.error(error.message);
    return { data: null, error };
  }
  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId)
      .eq('user_id', userId); // Garante que o usuário só delete suas próprias transações

    if (error) {
      console.error('Error deleting transaction:', error.message);
      throw new Error(error.message);
    }
    return { data: null, error: null };
  } catch (err) {
    const error = err as Error;
    console.error('Service error deleting transaction:', error.message);
    return { data: null, error };
  }
}

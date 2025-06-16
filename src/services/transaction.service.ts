
'use server';

import { supabase } from '@/lib/supabase/client';
import type { Transaction, ServiceListResponse, ServiceResponse, Category } from '@/types/database.types';

// Tipo para os dados de entrada de uma nova transação
// category_id é string (UUID)
export type NewTransactionData = Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'category'> & {
  category_id: string; // Explicitly string for UUID
};
// Tipo para os dados de atualização de uma transação
export type UpdateTransactionData = Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'category'>> & {
  category_id?: string; // Explicitly string for UUID if updating
};


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
        id, 
        user_id,
        category_id,
        description,
        amount,
        date,
        type,
        notes,
        created_at,
        updated_at,
        category:categories (id, name, type, icon, is_default)
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error.message);
      throw new Error(error.message);
    }
    
    const transactions = data?.map(tx => ({
      ...tx,
      category: tx.category as Category | null, // Supabase types might return array for one-to-one, ensure it's object or null
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
        id,
        user_id,
        category_id,
        description,
        amount,
        date,
        type,
        notes,
        created_at,
        updated_at,
        category:categories (id, name, type, icon, is_default)
      `)
      .single();
    
    if (error) {
      console.error('Error adding transaction:', error.message);
      throw new Error(error.message);
    }
     const newTransaction = {
      ...data,
      category: data.category as Category | null,
    } as Transaction;

    return { data: newTransaction, error: null };
  } catch (err) {
    const error = err as Error;
    console.error('Service error adding transaction:', error.message);
    return { data: null, error };
  }
}

// Atualizar uma transação existente
export async function updateTransaction(transactionId: string, userId: string, transactionData: UpdateTransactionData): Promise<ServiceResponse<Transaction>> {
  if (!userId) {
    const error = new Error("User ID is required to update a transaction.");
    return { data: null, error };
  }
  try {
    const { data, error } = await supabase
      .from('transactions')
      .update(transactionData)
      .eq('id', transactionId)
      .eq('user_id', userId) 
      .select(`
        id,
        user_id,
        category_id,
        description,
        amount,
        date,
        type,
        notes,
        created_at,
        updated_at,
        category:categories (id, name, type, icon, is_default)
      `)
      .single();

    if (error) {
      console.error('Error updating transaction:', error.message);
      throw new Error(error.message);
    }
    const updatedTransaction = {
      ...data,
      category: data.category as Category | null,
    } as Transaction;
    return { data: updatedTransaction, error: null };
  } catch (err) {
    const error = err as Error;
    console.error('Service error updating transaction:', error.message);
    return { data: null, error };
  }
}

// Deletar uma transação
export async function deleteTransaction(transactionId: string, userId: string): Promise<ServiceResponse<null>> {
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
      .eq('user_id', userId); 

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

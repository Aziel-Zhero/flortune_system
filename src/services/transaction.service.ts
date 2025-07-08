'use server';

// import { supabase } from '@/lib/supabase/client'; // Usaremos o cliente com token quando apropriado
import { createSupabaseClientWithToken } from '@/lib/supabase/client';
import { auth } from '@/app/api/auth/[...nextauth]/route'; // Para obter a sessão no servidor
import type { Transaction, ServiceListResponse, ServiceResponse, Category } from '@/types/database.types';

export type NewTransactionData = Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'category'> & {
  category_id: string;
  is_recurring: boolean;
};
export type UpdateTransactionData = Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'category'>>;

async function getSupabaseClientForUser() {
  const session = await auth(); // Obtém a sessão do NextAuth
  return createSupabaseClientWithToken(session);
}

export async function getTransactions(userId: string): Promise<ServiceListResponse<Transaction>> {
  const supabaseClient = await getSupabaseClientForUser();
  if (!userId) {
    const error = new Error("User ID is required to fetch transactions.");
    return { data: [], error, count: 0 };
  }
  try {
    const { data, error, count } = await supabaseClient
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
        is_recurring,
        created_at,
        updated_at,
        category:categories (id, name, type, icon, is_default)
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    const transactions = data?.map(tx => ({
      ...tx,
      category: tx.category as Category | null,
    })) || [];

    return { data: transactions as Transaction[], error: null, count };
  } catch (err) {
    const error = err as Error;
    console.error('Service error fetching transactions:', error.message);
    return { data: [], error, count: 0 };
  }
}

export async function addTransaction(userId: string, transactionData: NewTransactionData): Promise<ServiceResponse<Transaction>> {
  const supabaseClient = await getSupabaseClientForUser();
  if (!userId) {
    const error = new Error("User ID is required to add a transaction.");
    return { data: null, error };
  }
  try {
    const { data, error } = await supabaseClient
      .from('transactions')
      .insert([{ 
        ...transactionData, 
        user_id: userId,
      }])
      .select(`
        id,
        user_id,
        category_id,
        description,
        amount,
        date,
        type,
        notes,
        is_recurring,
        created_at,
        updated_at,
        category:categories (id, name, type, icon, is_default)
      `)
      .single();
    
    if (error) throw error;
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

export async function updateTransaction(transactionId: string, userId: string, transactionData: UpdateTransactionData): Promise<ServiceResponse<Transaction>> {
  const supabaseClient = await getSupabaseClientForUser();
  if (!userId) {
    const error = new Error("User ID is required to update a transaction.");
    return { data: null, error };
  }
  try {
    // Garantir que updated_at seja sempre atualizado
    const dataToUpdate = { ...transactionData, updated_at: new Date().toISOString() };

    const { data, error } = await supabaseClient
      .from('transactions')
      .update(dataToUpdate)
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
        is_recurring,
        created_at,
        updated_at,
        category:categories (id, name, type, icon, is_default)
      `)
      .single();

    if (error) throw error;
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

export async function deleteTransaction(transactionId: string, userId: string): Promise<ServiceResponse<null>> {
  const supabaseClient = await getSupabaseClientForUser();
   if (!userId) {
    const error = new Error("User ID is required to delete a transaction.");
    return { data: null, error };
  }
  try {
    const { error } = await supabaseClient
      .from('transactions')
      .delete()
      .eq('id', transactionId)
      .eq('user_id', userId); 

    if (error) throw error;
    return { data: null, error: null };
  } catch (err) {
    const error = err as Error;
    console.error('Service error deleting transaction:', error.message);
    return { data: null, error };
  }
}

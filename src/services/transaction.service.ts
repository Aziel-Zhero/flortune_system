// src/services/transaction.service.ts
"use server";

import type { Transaction } from "@/types/database.types";
import type { ServiceListResponse, ServiceResponse } from "@/types/database.types";

const mockTransactions: Transaction[] = [
    { id: 'tx-1', user_id: 'mock-user-id', category_id: 'cat-1', description: 'Salário Mensal', amount: 7500, date: '2024-07-01', type: 'income', is_recurring: true, created_at: '2024-07-01T09:00:00Z', updated_at: '2024-07-01T09:00:00Z', category: { id: 'cat-1', name: 'Salário', type: 'income', is_default: true, created_at: '', updated_at: '' } },
    { id: 'tx-2', user_id: 'mock-user-id', category_id: 'cat-2', description: 'Aluguel & Condomínio', amount: 1800, date: '2024-07-05', type: 'expense', is_recurring: true, created_at: '2024-07-05T10:00:00Z', updated_at: '2024-07-05T10:00:00Z', category: { id: 'cat-2', name: 'Moradia', type: 'expense', is_default: true, created_at: '', updated_at: '' } },
    { id: 'tx-3', user_id: 'mock-user-id', category_id: 'cat-3', description: 'Supermercado do Mês', amount: 850.20, date: '2024-07-06', type: 'expense', is_recurring: false, created_at: '2024-07-06T11:00:00Z', updated_at: '2024-07-06T11:00:00Z', category: { id: 'cat-3', name: 'Alimentação', type: 'expense', is_default: true, created_at: '', updated_at: '' } },
    { id: 'tx-4', user_id: 'mock-user-id', category_id: 'cat-4', description: 'Projeto Freelance', amount: 2100, date: '2024-07-10', type: 'income', is_recurring: false, created_at: '2024-07-10T15:00:00Z', updated_at: '2024-07-10T15:00:00Z', category: { id: 'cat-4', name: 'Freelance', type: 'income', is_default: false, created_at: '', updated_at: '' } },
    { id: 'tx-5', user_id: 'mock-user-id', category_id: 'cat-5', description: 'Show da Banda X', amount: 350.00, date: '2024-07-15', type: 'expense', is_recurring: false, created_at: '2024-07-15T20:00:00Z', updated_at: '2024-07-15T20:00:00Z', category: { id: 'cat-5', name: 'Lazer', type: 'expense', is_default: true, created_at: '', updated_at: '' } },
];

export async function getTransactions(userId: string): Promise<ServiceListResponse<Transaction>> {
  console.log(`Fetching mock transactions for user: ${userId}`);
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300)); 
  const sortedData = mockTransactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return { data: sortedData, error: null };
}

export type NewTransactionData = Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'category'>;

export async function addTransaction(userId: string, transactionData: NewTransactionData): Promise<ServiceResponse<Transaction>> {
    console.log(`Adding mock transaction for user: ${userId}`, transactionData);
    const newTransaction: Transaction = {
        id: `tx_${Date.now()}`,
        user_id: userId,
        ...transactionData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
    mockTransactions.push(newTransaction);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return { data: newTransaction, error: null };
}

export async function deleteTransaction(transactionId: string, userId: string): Promise<{ error: Error | null }> {
    console.log(`Deleting mock transaction: ${transactionId} for user: ${userId}`);
    const index = mockTransactions.findIndex(t => t.id === transactionId && t.user_id === userId);
    if (index > -1) {
        mockTransactions.splice(index, 1);
    }
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return { error: null };
}

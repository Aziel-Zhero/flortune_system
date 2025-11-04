// src/services/category.service.ts
"use server";

import type { Category } from "@/types/database.types";
import type { ServiceListResponse, ServiceResponse } from "@/types/database.types";


const mockCategories: Category[] = [
    { id: 'cat-1', user_id: null, name: 'Salário', type: 'income', is_default: true, created_at: '', updated_at: '' },
    { id: 'cat-2', user_id: null, name: 'Moradia', type: 'expense', is_default: true, created_at: '', updated_at: '' },
    { id: 'cat-3', user_id: null, name: 'Alimentação', type: 'expense', is_default: true, created_at: '', updated_at: '' },
    { id: 'cat-4', user_id: 'mock-user-id', name: 'Freelance', type: 'income', is_default: false, created_at: '', updated_at: '' },
    { id: 'cat-5', user_id: null, name: 'Lazer', type: 'expense', is_default: true, created_at: '', updated_at: '' },
    { id: 'cat-6', user_id: null, name: 'Transporte', type: 'expense', is_default: true, created_at: '', updated_at: '' },
];

export async function getCategories(userId: string): Promise<ServiceListResponse<Category>> {
  console.log(`Fetching mock categories for user ${userId}`);
  const userCategories = mockCategories.filter(c => c.is_default || c.user_id === userId);
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate delay
  return { data: userCategories, error: null };
}

export type NewCategoryData = Omit<Category, 'id' | 'created_at' | 'updated_at' | 'is_default' | 'user_id'> & {
    user_id?: string | null;
};

export async function addCategory(userId: string, categoryData: Omit<NewCategoryData, 'user_id'>): Promise<ServiceResponse<Category>> {
    console.log(`Adding mock category for user ${userId}`, categoryData);
    const newCategory: Category = {
        id: `cat_${Date.now()}`,
        user_id: userId,
        name: categoryData.name,
        type: categoryData.type,
        is_default: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
    mockCategories.push(newCategory);
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate delay
    return { data: newCategory, error: null };
}

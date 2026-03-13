
// opt/build/repo/src/services/category.service.ts
"use server";

import type { Category } from "@/types/database.types";
import type { ServiceListResponse, ServiceResponse } from "@/types/database.types";
import { createClient } from "@/lib/supabase/server";

// Mock categories using valid UUID strings
const mockCategories: Category[] = [
    { id: '00000000-0000-0000-0000-000000000001', user_id: null, name: 'Salário', type: 'income', is_default: true, created_at: '', updated_at: '' },
    { id: '00000000-0000-0000-0000-000000000002', user_id: null, name: 'Moradia', type: 'expense', is_default: true, created_at: '', updated_at: '' },
    { id: '00000000-0000-0000-0000-000000000003', user_id: null, name: 'Alimentação', type: 'expense', is_default: true, created_at: '', updated_at: '' },
    { id: '00000000-0000-0000-0000-000000000004', user_id: null, name: 'Lazer', type: 'expense', is_default: true, created_at: '', updated_at: '' },
    { id: '00000000-0000-0000-0000-000000000005', user_id: null, name: 'Transporte', type: 'expense', is_default: true, created_at: '', updated_at: '' },
];

export async function getCategories(userId: string): Promise<ServiceListResponse<Category>> {
  if (!userId) return { data: mockCategories, error: null };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .or(`user_id.eq.${userId},is_default.eq.true`)
      .order('name', { ascending: true });

    if (error) throw error;

    return { data: data && data.length > 0 ? data : mockCategories, error: null };
  } catch (error: any) {
    console.error("Error fetching categories:", error.message);
    return { data: mockCategories, error: null };
  }
}

export type NewCategoryData = Omit<Category, 'id' | 'created_at' | 'updated_at' | 'is_default' | 'user_id'>;

export async function addCategory(categoryData: NewCategoryData): Promise<ServiceResponse<Category>> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) throw new Error("Usuário não autenticado.");

        const { data, error } = await supabase
            .from('categories')
            .insert({
                user_id: user.id,
                name: categoryData.name,
                type: categoryData.type,
                is_default: false,
            })
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error: any) {
        console.error("Error adding category:", error.message);
        return { data: null, error: error.message };
    }
}

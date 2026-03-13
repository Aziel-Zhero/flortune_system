
'use server';

import type { Category } from "@/types/database.types";
import type { ServiceListResponse, ServiceResponse } from "@/types/database.types";
import { createClient } from "@/lib/supabase/server";

export async function getCategories(userId: string): Promise<ServiceListResponse<Category>> {
  if (!userId) return { data: [], error: "Usuário não identificado." };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .or(`user_id.eq.${userId},is_default.eq.true`)
      .order('name', { ascending: true });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error: any) {
    console.error("Error fetching categories:", error.message);
    return { data: [], error: "Falha ao carregar categorias." };
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

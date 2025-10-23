// src/services/category.service.ts
"use server";

import { supabase } from "@/lib/supabase/client";
import type { Category } from "@/types/database.types";
import type { ServiceListResponse, ServiceResponse } from "@/types/database.types";

/**
 * Fetches all default categories and user-specific categories.
 * @param userId - The ID of the user.
 * @returns A promise that resolves to the list of categories or an error.
 */
export async function getCategories(userId: string): Promise<ServiceListResponse<Category>> {
  if (!supabase) {
    console.error("Supabase client is not initialized.");
    return { data: null, error: new Error("Supabase client is not initialized.") };
  }
  if (!userId) {
    return { data: null, error: new Error("User ID is required.") };
  }

  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .or(`user_id.eq.${userId},is_default.eq.true`)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching categories:", error.message);
      throw error;
    }

    return { data, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
}

export type NewCategoryData = Omit<Category, 'id' | 'created_at' | 'updated_at' | 'is_default' | 'user_id'> & {
    user_id?: string | null;
};


/**
 * Adds a new category for a user.
 * @param userId - The ID of the user creating the category.
 * @param categoryData - The data for the new category.
 * @returns A promise that resolves to the newly created category or an error.
 */
export async function addCategory(userId: string, categoryData: Omit<NewCategoryData, 'user_id'>): Promise<ServiceResponse<Category>> {
    if (!supabase) {
        return { data: null, error: new Error("Supabase client is not initialized.") };
    }
     if (!userId) {
        return { data: null, error: new Error("User ID is required to create a category.") };
    }

    try {
        const { data, error } = await supabase
            .from("categories")
            .insert([{ ...categoryData, user_id: userId, is_default: false }])
            .select()
            .single();

        if (error) {
            console.error("Error adding category:", error.message);
            throw error;
        }

        return { data, error: null };

    } catch (error: any) {
        return { data: null, error };
    }
}

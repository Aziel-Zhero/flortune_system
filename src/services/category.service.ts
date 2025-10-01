'use server';

import { createSupabaseClientWithToken } from '@/lib/supabase/client';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import type { Category, ServiceListResponse, ServiceResponse } from '@/types/database.types';

async function getSupabaseClientForUser() {
  const session = await auth();
  return createSupabaseClientWithToken(session);
}

export async function getCategories(userId: string | null): Promise<ServiceListResponse<Category>> {
  const supabaseClient = await getSupabaseClientForUser();
  if (!supabaseClient) {
    return { data: [], error: new Error("Supabase client is not initialized. Check environment variables."), count: 0 };
  }
  
  try {
    let query = supabaseClient
      .from('categories')
      .select('*')
      .order('is_default', { ascending: false })
      .order('name', { ascending: true });

    if (userId) {
      query = query.or(`user_id.eq.${userId},is_default.is.true`);
    } else {
      query = query.eq('is_default', true);
    }
    
    const { data, error, count } = await query;

    if (error) throw error;
    return { data: data as Category[], error: null, count };
  } catch (err) {
    const error = err as Error;
    console.error('Service error fetching categories:', error.message);
    return { data: null, error, count: 0 };
  }
}

export async function addCategory(userId: string, categoryData: Omit<Category, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_default'>): Promise<ServiceResponse<Category>> {
  const supabaseClient = await getSupabaseClientForUser();
  if (!supabaseClient) {
    return { data: null, error: new Error("Supabase client is not initialized. Check environment variables.") };
  }
  if (!userId) {
    const error = new Error("User ID is required to add a category.");
    return { data: null, error };
  }
  try {
    const { data, error } = await supabaseClient
      .from('categories')
      .insert([{ ...categoryData, user_id: userId, is_default: false }])
      .select()
      .single();

    if (error) throw error;
    return { data: data as Category, error: null };
  } catch (err) {
    const error = err as Error;
    console.error('Service error adding category:', error.message);
    return { data: null, error };
  }
}

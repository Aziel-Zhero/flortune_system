// Schema: public
export interface Profile {
  id: string; // UUID, Primary Key
  full_name?: string | null;
  display_name?: string | null;
  email: string; // Unique
  avatar_url?: string | null;
  account_type?: 'pessoa' | 'empresa' | null;
  cpf_cnpj?: string | null; // Unique
  rg?: string | null;
  plan_id?: string;
  has_seen_welcome_message?: boolean;
  role?: 'user' | 'admin';
  created_at: string; // Timestamptz
  updated_at: string; // Timestamptz
}

export interface AdminProfile {
    id: string; // UUID, Primary Key
    full_name?: string | null;
    email: string; // Unique
    hashed_password?: string;
    created_at: string; // Timestamptz
    updated_at: string; // Timestamptz
}

export interface Category {
  id: string; // UUID, Primary Key
  user_id?: string | null; // UUID, Foreign Key to profiles.id
  name: string;
  type: 'income' | 'expense';
  icon?: string | null;
  is_default: boolean;
  created_at: string; // Timestamptz
  updated_at: string; // Timestamptz
}

export interface Transaction {
  id: string; // UUID, Primary Key
  user_id: string; // UUID, Foreign Key to profiles.id
  category_id?: string | null; // UUID, Foreign Key to categories.id
  description: string;
  amount: number;
  date: string; // Date
  type: 'income' | 'expense';
  notes?: string | null;
  is_recurring: boolean;
  created_at: string; // Timestamptz
  updated_at: string; // Timestamptz
  category?: Category | null; // For joins
}

export interface Budget {
  id: string; // UUID, Primary Key
  user_id: string; // UUID, Foreign Key to profiles.id
  category_id: string; // UUID, Foreign Key to categories.id
  limit_amount: number;
  spent_amount: number;
  period_start_date: string; // Date
  period_end_date: string; // Date
  created_at: string; // Timestamptz
  updated_at: string; // Timestamptz
  category?: Category; // For joins
}

export interface FinancialGoal {
  id: string; // UUID, Primary Key
  user_id: string; // UUID, Foreign Key to profiles.id
  name: string;
  target_amount: number;
  current_amount: number;
  deadline_date?: string | null; // Date
  icon?: string | null;
  status: 'in_progress' | 'achieved' | 'cancelled';
  notes?: string | null;
  created_at: string; // Timestamptz
  updated_at: string; // Timestamptz
}

export interface Todo {
  id: string; // UUID, Primary Key
  user_id: string; // UUID, Foreign Key to profiles.id
  description: string;
  is_completed: boolean;
  due_date?: string | null; // Date
  created_at: string; // Timestamptz
  updated_at: string; // Timestamptz
}

export interface Note {
  id: string; // UUID, Primary Key
  user_id: string; // UUID, Foreign Key to profiles.id
  title: string;
  content: string;
  color: string;
  is_pinned: boolean;
  created_at: string; // Timestamptz
  updated_at: string; // Timestamptz
}

export interface DevClient {
  id: string; // UUID, Primary Key
  user_id: string; // UUID, Foreign Key to profiles.id
  name: string;
  service_type: string;
  status: 'planning' | 'in_progress' | 'delivered' | 'on_hold' | 'delayed';
  priority: 'low' | 'medium' | 'high';
  start_date?: string | null; // Date
  deadline?: string | null; // Date
  total_price?: number | null;
  notes?: string | null;
  tasks?: string | null;
  created_at: string; // Timestamptz
  updated_at: string; // Timestamptz
}


// Schema: auth (for reference, managed by Supabase)
export interface AuthUser {
  id: string;
  // ...other auth fields
}

// Generic Service Response Types
export interface ServiceResponse<T> {
  data: T | null;
  error: string | null; // Changed from Error to string
}

export interface ServiceListResponse<T> {
  data: T[] | null;
  error: string | null; // Changed from Error to string
  count?: number | null;
}

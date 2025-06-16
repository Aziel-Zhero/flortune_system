
// Baseado no schema SQL fornecido

export interface Category {
  id: string; // UUID
  user_id: string | null; // UUID, nulo para categorias padrão
  name: string;
  type: 'income' | 'expense';
  icon?: string | null; // Nome do ícone Lucide ou similar
  is_default?: boolean; // True para categorias padrão
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

export interface Transaction {
  id: string; // UUID
  user_id: string; // UUID
  category_id: string | null; // UUID (FK para categories.id)
  description: string;
  amount: number; // NUMERIC
  date: string; // DATE (YYYY-MM-DD)
  type: 'income' | 'expense'; // Para consistência, embora a categoria já tenha
  notes?: string | null;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
  category?: Category | null; // Categoria associada (pode ser null se category_id for null)
}

export interface Budget {
  id: string; // UUID
  user_id: string; // UUID
  category_id: string; // UUID (FK para categories.id)
  limit_amount: number; // NUMERIC
  spent_amount: number; // NUMERIC
  period_start_date: string; // DATE (YYYY-MM-DD)
  period_end_date: string; // DATE (YYYY-MM-DD)
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
  category?: Category; // Categoria associada
}

export interface FinancialGoal {
  id: string; // UUID
  user_id: string; // UUID
  name: string;
  target_amount: number; // NUMERIC
  current_amount: number; // NUMERIC
  deadline_date?: string | null; // DATE (YYYY-MM-DD)
  icon?: string | null; // Nome do ícone Lucide ou similar
  notes?: string | null;
  status: 'in_progress' | 'achieved' | 'cancelled';
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

// Tipos para os serviços, para evitar dependência direta do Supabase nos componentes
export interface ServiceResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface ServiceListResponse<T> {
  data: T[] | null;
  error: Error | null;
  count?: number | null;
}

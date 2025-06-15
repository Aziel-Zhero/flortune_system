
// Baseado no schema SQL fornecido anteriormente

export interface Category {
  id: number; // BIGSERIAL
  user_id: string | null; // UUID, nulo para categorias padrão
  name: string;
  type: 'income' | 'expense';
  icon?: string | null; // Nome do ícone Lucide ou similar
  created_at: string; // TIMESTAMPTZ
}

export interface Transaction {
  id: number; // BIGSERIAL
  user_id: string; // UUID
  category_id: number; // BIGINT (FK para categories.id)
  description: string;
  amount: number; // NUMERIC
  date: string; // DATE (YYYY-MM-DD)
  type: 'income' | 'expense'; // Para consistência, embora a categoria já tenha
  notes?: string | null;
  created_at: string; // TIMESTAMPTZ
  // Para exibição na UI, podemos querer buscar a categoria associada
  category?: Category; 
}

export interface Budget {
  id: number; // BIGSERIAL
  user_id: string; // UUID
  category_id: number; // BIGINT (FK para categories.id)
  amount: number; // NUMERIC
  month: number; // INTEGER (1-12)
  year: number; // INTEGER
  created_at: string; // TIMESTAMPTZ
  // Para exibição na UI
  category?: Category;
}

export interface FinancialGoal {
  id: number; // BIGSERIAL
  user_id: string; // UUID
  name: string;
  target_amount: number; // NUMERIC
  current_amount: number; // NUMERIC
  deadline?: string | null; // DATE (YYYY-MM-DD)
  icon?: string | null; // Nome do ícone Lucide ou similar
  description?: string | null;
  created_at: string; // TIMESTAMPTZ
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

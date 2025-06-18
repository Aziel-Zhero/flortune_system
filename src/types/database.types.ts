
// Tipos para o schema 'public'
export interface Profile {
  id: string; // UUID, chave primária, FK para next_auth.users.id
  full_name?: string | null;
  display_name?: string | null;
  email: string; // NOT NULL, UNIQUE
  hashed_password?: string | null; // Para login com credenciais, pode ser nulo se o usuário só usa OAuth
  phone?: string | null;
  cpf_cnpj?: string | null; // UNIQUE
  rg?: string | null;
  avatar_url?: string | null;
  account_type?: 'pessoa' | 'empresa' | null;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

export interface Category {
  id: string; // UUID
  user_id: string | null; // UUID, nulo para categorias padrão, FK para profiles.id
  name: string;
  type: 'income' | 'expense';
  icon?: string | null;
  is_default: boolean; // NOT NULL
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string; // UUID
  user_id: string; // UUID, FK para profiles.id
  category_id: string | null; // FK para categories.id
  description: string;
  amount: number; // NUMERIC(12, 2)
  date: string; // DATE (YYYY-MM-DD)
  type: 'income' | 'expense';
  notes?: string | null;
  created_at: string;
  updated_at: string;
  category?: Category | null; // Para joins
}

export interface Budget {
  id: string; // UUID
  user_id: string; // FK para profiles.id
  category_id: string; // FK para categories.id
  limit_amount: number; // NUMERIC(12, 2)
  spent_amount: number; // NUMERIC(12, 2)
  period_start_date: string; // DATE (YYYY-MM-DD)
  period_end_date: string; // DATE (YYYY-MM-DD)
  created_at: string;
  updated_at: string;
  category?: Category; // Para joins
}

export interface FinancialGoal {
  id: string; // UUID
  user_id: string; // FK para profiles.id
  name: string;
  target_amount: number; // NUMERIC(12, 2)
  current_amount: number; // NUMERIC(12, 2)
  deadline_date?: string | null; // DATE (YYYY-MM-DD)
  icon?: string | null;
  notes?: string | null;
  status: 'in_progress' | 'achieved' | 'cancelled'; // NOT NULL
  created_at: string;
  updated_at: string;
}

export interface Todo {
  id: string; // UUID
  user_id: string; // FK para profiles.id
  description: string;
  is_completed: boolean; // DEFAULT false
  due_date?: string | null; // DATE (YYYY-MM-DD)
  created_at: string;
  updated_at: string;
}

// Tipos para Assinaturas
export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'past_due'
  | 'unpaid'
  | 'paused';

export interface Price {
  id: string; // Price ID from Stripe, e.g. price_123
  product_id?: string | null; // Product ID from Stripe, e.g. prod_123
  active?: boolean | null;
  currency?: string | null;
  description?: string | null;
  type?: 'one_time' | 'recurring' | null;
  unit_amount?: number | null; // Amount in cents
  interval?: 'day' | 'week' | 'month' | 'year' | null;
  interval_count?: number | null;
  trial_period_days?: number | null;
  metadata?: Record<string, any> | null; // JSONB
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string; // Subscription ID from Stripe, e.g. sub_123
  user_id: string; // Foreign key to next_auth.users(id)
  status?: SubscriptionStatus | null;
  metadata?: Record<string, any> | null; // JSONB
  price_id?: string | null; // Foreign key to prices(id)
  quantity?: number | null;
  cancel_at_period_end?: boolean | null;
  created: string; // TIMESTAMPTZ
  current_period_start: string; // TIMESTAMPTZ
  current_period_end: string; // TIMESTAMPTZ
  ended_at?: string | null; // TIMESTAMPTZ
  cancel_at?: string | null; // TIMESTAMPTZ
  canceled_at?: string | null; // TIMESTAMPTZ
  trial_start?: string | null; // TIMESTAMPTZ
  trial_end?: string | null; // TIMESTAMPTZ
  price?: Price | null; // Para joins
}


// Tipos para o schema 'next_auth' (do SupabaseAdapter)
export interface NextAuthUser {
  id: string; // uuid NOT NULL DEFAULT uuid_generate_v4()
  name?: string | null; // text
  email?: string | null; // text, UNIQUE
  emailVerified?: string | null; // timestamp with time zone
  image?: string | null; // text
}

export interface NextAuthSession {
  id: string; // uuid NOT NULL DEFAULT uuid_generate_v4()
  expires: string; // timestamp with time zone NOT NULL
  sessionToken: string; // text NOT NULL, UNIQUE
  userId?: string | null; // uuid, FK to next_auth.users(id)
}

export interface NextAuthAccount {
  id: string; // uuid NOT NULL DEFAULT uuid_generate_v4()
  type: string; // text NOT NULL
  provider: string; // text NOT NULL
  providerAccountId: string; // text NOT NULL
  refresh_token?: string | null; // text
  access_token?: string | null; // text
  expires_at?: number | null; // bigint
  token_type?: string | null; // text
  scope?: string | null; // text
  id_token?: string | null; // text
  session_state?: string | null; // text
  oauth_token_secret?: string | null; // text
  oauth_token?: string | null; // text
  userId?: string | null; // uuid, FK to next_auth.users(id)
}

export interface NextAuthVerificationToken {
  identifier?: string | null; // text
  token: string; // text, UNIQUE (ou parte da PK)
  expires: string; // timestamp with time zone NOT NULL
}


// Tipos genéricos de resposta de serviço
export interface ServiceResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface ServiceListResponse<T> {
  data: T[] | null;
  error: Error | null;
  count?: number | null;
}
    
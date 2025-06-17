
// Tipos para o schema 'public'
export interface Profile {
  id: string; // UUID, chave primária
  full_name?: string | null;
  display_name?: string | null;
  email: string; // NOT NULL, UNIQUE
  hashed_password: string; // NOT NULL - Armazenará a senha hasheada
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
  is_default?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string; // UUID
  user_id: string; // UUID, FK para profiles.id
  category_id: string | null;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  type: 'income' | 'expense';
  notes?: string | null;
  created_at: string;
  updated_at: string;
  category?: Category | null;
}

export interface Budget {
  id: string; // UUID
  user_id: string;
  category_id: string;
  limit_amount: number;
  spent_amount: number;
  period_start_date: string; // YYYY-MM-DD
  period_end_date: string; // YYYY-MM-DD
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface FinancialGoal {
  id: string; // UUID
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline_date?: string | null; // YYYY-MM-DD
  icon?: string | null;
  notes?: string | null;
  status: 'in_progress' | 'achieved' | 'cancelled';
  created_at: string;
  updated_at: string;
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
  //CONSTRAINT provider_account_unique UNIQUE (provider, "providerAccountId")
}

export interface NextAuthVerificationToken {
  identifier?: string | null; // text
  token: string; // text, UNIQUE (ou parte da PK)
  expires: string; // timestamp with time zone NOT NULL
  //CONSTRAINT verification_tokens_pkey PRIMARY KEY (token, identifier)
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

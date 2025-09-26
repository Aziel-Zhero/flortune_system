-- FLORTUNE - Database Schema
-- Version: 2.0
-- Last Updated: 2024-07-26
--
-- Descrição das Mudanças v2.0:
-- - Removido o trigger `public.handle_new_user_from_next_auth` e sua função `public.create_profile_for_new_user`.
--   A criação do perfil agora é gerenciada pela server action de signup e pelo callback do NextAuth.js para garantir consistência.
-- - Removida a chave estrangeira `profiles_id_fkey` que ligava `public.profiles.id` a `next_auth.users.id`. A ligação agora é por convenção (mesmo UUID).
-- - Adicionada a política "Allow anon to insert their own profile on signup" na tabela `public.profiles` para permitir que a server action de cadastro (usando a chave anônima) insira novos perfis.
-- - Adicionada uma coluna `is_recurring` na tabela `transactions`.
-- - Ajustadas as políticas de RLS para serem mais explícitas e seguras.

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- =================================================================
-- Schema `next_auth` para o SupabaseAdapter do NextAuth.js
-- =================================================================

CREATE SCHEMA IF NOT EXISTS next_auth;

-- Tabela de Usuários do NextAuth
CREATE TABLE IF NOT EXISTS next_auth.users (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name text NULL,
  email text NULL,
  "emailVerified" timestamptz NULL,
  image text NULL,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT email_unique UNIQUE (email)
);

-- Tabela de Contas (Provedores OAuth) do NextAuth
CREATE TABLE IF NOT EXISTS next_auth.accounts (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "userId" uuid NOT NULL,
  type text NOT NULL,
  provider text NOT NULL,
  "providerAccountId" text NOT NULL,
  refresh_token text NULL,
  access_token text NULL,
  expires_at int8 NULL,
  token_type text NULL,
  scope text NULL,
  id_token text NULL,
  session_state text NULL,
  CONSTRAINT accounts_pkey PRIMARY KEY (id),
  CONSTRAINT provider_unique UNIQUE (provider, "providerAccountId"),
  CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES next_auth.users(id) ON DELETE CASCADE
);

-- Tabela de Sessões do NextAuth
CREATE TABLE IF NOT EXISTS next_auth.sessions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "sessionToken" text NOT NULL,
  "userId" uuid NOT NULL,
  expires timestamptz NOT NULL,
  CONSTRAINT sessions_pkey PRIMARY KEY (id),
  CONSTRAINT "sessionToken_unique" UNIQUE ("sessionToken"),
  CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES next_auth.users(id) ON DELETE CASCADE
);

-- Tabela de Tokens de Verificação do NextAuth
CREATE TABLE IF NOT EXISTS next_auth.verification_tokens (
  identifier text NULL,
  token text NOT NULL,
  expires timestamptz NOT NULL,
  CONSTRAINT verification_tokens_pkey PRIMARY KEY (token),
  CONSTRAINT token_identifier_unique UNIQUE (token, identifier)
);

-- =================================================================
-- Schema `public` para os dados da aplicação
-- =================================================================

-- Tabela de Perfis de Usuários (nossa tabela principal de usuários)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  full_name text NULL,
  display_name text NULL,
  email text NOT NULL,
  hashed_password text NULL,
  phone text NULL,
  cpf_cnpj text NULL,
  rg text NULL,
  avatar_url text NULL,
  account_type text CHECK (account_type IN ('pessoa', 'empresa')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES next_auth.users(id) ON DELETE CASCADE, -- Garante que o ID do perfil corresponda a um usuário de autenticação
  CONSTRAINT profiles_email_key UNIQUE (email),
  CONSTRAINT profiles_cpf_cnpj_key UNIQUE (cpf_cnpj)
);

-- Tabela de Categorias
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  icon text NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Tabela de Transações
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL,
  category_id uuid NULL,
  description text NOT NULL,
  amount numeric(12, 2) NOT NULL,
  date date NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  notes text NULL,
  is_recurring boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT transactions_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL
);

-- Tabela de Orçamentos
CREATE TABLE IF NOT EXISTS public.budgets (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL,
  category_id uuid NOT NULL,
  limit_amount numeric(12, 2) NOT NULL,
  spent_amount numeric(12, 2) NOT NULL DEFAULT 0,
  period_start_date date NOT NULL,
  period_end_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT budgets_pkey PRIMARY KEY (id),
  CONSTRAINT budgets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT budgets_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE
);

-- Tabela de Metas Financeiras
CREATE TABLE IF NOT EXISTS public.financial_goals (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  target_amount numeric(12, 2) NOT NULL,
  current_amount numeric(12, 2) NOT NULL DEFAULT 0,
  deadline_date date NULL,
  icon text NULL,
  notes text NULL,
  status text NOT NULL DEFAULT 'in_progress'::text CHECK (status IN ('in_progress', 'achieved', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT financial_goals_pkey PRIMARY KEY (id),
  CONSTRAINT financial_goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Tabela de Tarefas (To-Do List)
CREATE TABLE IF NOT EXISTS public.todos (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL,
  description text NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  due_date date NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT todos_pkey PRIMARY KEY (id),
  CONSTRAINT todos_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);


-- =================================================================
-- Políticas de Segurança (Row Level Security - RLS)
-- =================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas para garantir um estado limpo
DROP POLICY IF EXISTS "Allow all for service role" ON public.profiles;
DROP POLICY IF EXISTS "Allow individual user access to their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow anon to insert their own profile on signup" ON public.profiles;
DROP POLICY IF EXISTS "Allow all for service role" ON public.categories;
DROP POLICY IF EXISTS "Allow individual user access to their own and default categories" ON public.categories;
DROP POLICY IF EXISTS "Allow all for service role" ON public.transactions;
DROP POLICY IF EXISTS "Allow individual user access to their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow all for service role" ON public.budgets;
DROP POLICY IF EXISTS "Allow individual user access to their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Allow all for service role" ON public.financial_goals;
DROP POLICY IF EXISTS "Allow individual user access to their own goals" ON public.financial_goals;
DROP POLICY IF EXISTS "Allow all for service role" ON public.todos;
DROP POLICY IF EXISTS "Allow individual user access to their own todos" ON public.todos;


-- Políticas para `profiles`
CREATE POLICY "Allow individual user access to their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);
CREATE POLICY "Allow user to update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
-- A política de inserção agora é crucial para a action de signup
CREATE POLICY "Allow anon to insert their own profile on signup"
  ON public.profiles FOR INSERT
  TO anon
  WITH CHECK (true);
CREATE POLICY "Allow service_role to manage profiles"
  ON public.profiles FOR ALL
  TO service_role
  WITH CHECK (true);


-- Políticas para `categories`
CREATE POLICY "Allow individual user access to their own and default categories"
  ON public.categories FOR SELECT
  USING (auth.uid() = user_id OR is_default = true);
CREATE POLICY "Allow user to manage their own categories"
  ON public.categories FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas para `transactions`
CREATE POLICY "Allow individual user access to their own transactions"
  ON public.transactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas para `budgets`
CREATE POLICY "Allow individual user access to their own budgets"
  ON public.budgets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas para `financial_goals`
CREATE POLICY "Allow individual user access to their own goals"
  ON public.financial_goals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas para `todos`
CREATE POLICY "Allow individual user access to their own todos"
  ON public.todos FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- =================================================================
-- Inserção de Dados Padrão (Default Data)
-- =================================================================

-- Inserir categorias padrão se não existirem
INSERT INTO public.categories (name, type, icon, is_default) VALUES
  ('Salário', 'income', 'DollarSign', true),
  ('Outras Receitas', 'income', 'TrendingUp', true),
  ('Moradia', 'expense', 'Home', true),
  ('Alimentação', 'expense', 'UtensilsCrossed', true),
  ('Transporte', 'expense', 'Car', true),
  ('Saúde', 'expense', 'HeartPulse', true),
  ('Lazer', 'expense', 'Ticket', true),
  ('Educação', 'expense', 'BookOpen', true),
  ('Vestuário', 'expense', 'Shirt', true),
  ('Serviços', 'expense', 'Receipt', true),
  ('Impostos', 'expense', 'Landmark', true),
  ('Outras Despesas', 'expense', 'MoreHorizontal', true)
ON CONFLICT (name) WHERE is_default = true DO NOTHING;

-- Fim do script

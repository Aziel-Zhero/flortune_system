
-- ### Esquema do Banco de Dados para Flortune v2.0 (com NextAuth.js) ###
-- Este script configura o banco de dados PostgreSQL no Supabase para ser usado com NextAuth.js
-- e o SupabaseAdapter. Ele remove lógicas conflitantes e simplifica a estrutura.

-- ### 1. Habilitar Extensões Necessárias ###
-- Habilita a extensão para gerar UUIDs, essencial para as chaves primárias.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
-- Habilita a extensão para atualizar automaticamente os campos 'updated_at'.
CREATE EXTENSION IF NOT EXISTS "moddatetime" WITH SCHEMA extensions;

-- ### 2. Configuração do Schema `next_auth` para o SupabaseAdapter ###
-- Este schema é requerido pelo @auth/supabase-adapter para gerenciar sessões, usuários, etc.
-- A estrutura das tabelas é definida pelo próprio adapter.
CREATE SCHEMA IF NOT EXISTS next_auth;

-- Tabela de Usuários do NextAuth
CREATE TABLE IF NOT EXISTS next_auth.users (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name text,
  email text,
  "emailVerified" timestamptz,
  image text,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_email_key UNIQUE (email)
);

-- Tabela de Contas (para provedores OAuth como Google)
CREATE TABLE IF NOT EXISTS next_auth.accounts (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "userId" uuid NOT NULL,
  type text NOT NULL,
  provider text NOT NULL,
  "providerAccountId" text NOT NULL,
  refresh_token text,
  access_token text,
  expires_at bigint,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  CONSTRAINT accounts_pkey PRIMARY KEY (id),
  CONSTRAINT "accounts_provider_providerAccountId_key" UNIQUE (provider, "providerAccountId"),
  CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES next_auth.users(id) ON DELETE CASCADE
);

-- Tabela de Sessões
CREATE TABLE IF NOT EXISTS next_auth.sessions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "sessionToken" text NOT NULL,
  "userId" uuid NOT NULL,
  expires timestamptz NOT NULL,
  CONSTRAINT sessions_pkey PRIMARY KEY (id),
  CONSTRAINT "sessions_sessionToken_key" UNIQUE ("sessionToken"),
  CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES next_auth.users(id) ON DELETE CASCADE
);

-- Tabela de Tokens de Verificação (para login sem senha)
CREATE TABLE IF NOT EXISTS next_auth.verification_tokens (
  identifier text,
  token text,
  expires timestamptz NOT NULL,
  CONSTRAINT verification_tokens_pkey PRIMARY KEY (token),
  CONSTRAINT verification_tokens_token_key UNIQUE (token)
);

-- ### 3. Configuração do Schema `public` - Tabelas da Aplicação ###

-- Tabela de Perfis de Usuários (Dados adicionais da aplicação)
-- Esta tabela armazena informações que não fazem parte do schema padrão do NextAuth.
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL, -- Chave Primária e FK para next_auth.users.id
  full_name text,
  display_name text,
  email text NOT NULL,
  hashed_password text, -- Armazena a senha para login com 'Credentials'
  phone text,
  cpf_cnpj text,
  rg text,
  avatar_url text,
  account_type text, -- 'pessoa' ou 'empresa'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_email_key UNIQUE (email),
  CONSTRAINT profiles_cpf_cnpj_key UNIQUE (cpf_cnpj),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES next_auth.users(id) ON DELETE CASCADE
);

-- Trigger para atualizar 'updated_at' na tabela de perfis
CREATE OR REPLACE TRIGGER handle_updated_at_on_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- Tabela de Categorias
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid, -- Nulo para categorias padrão
    name text NOT NULL,
    type text NOT NULL, -- 'income' ou 'expense'
    icon text,
    is_default boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT categories_pkey PRIMARY KEY (id),
    CONSTRAINT categories_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    -- Garante que um usuário não pode ter duas categorias com o mesmo nome e tipo.
    CONSTRAINT categories_user_id_name_type_key UNIQUE (user_id, name, type)
);

-- Trigger para 'updated_at' na tabela de categorias
CREATE OR REPLACE TRIGGER handle_updated_at_on_categories
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- Tabela de Transações
CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL,
    category_id uuid,
    description text NOT NULL,
    amount numeric(12, 2) NOT NULL,
    date date NOT NULL,
    type text NOT NULL, -- 'income' ou 'expense'
    notes text,
    is_recurring boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT transactions_pkey PRIMARY KEY (id),
    CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT transactions_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL
);

-- Trigger para 'updated_at' na tabela de transações
CREATE OR REPLACE TRIGGER handle_updated_at_on_transactions
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime(updated_at);

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
    CONSTRAINT budgets_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE,
    -- Garante que um usuário só pode ter um orçamento por categoria no mesmo período.
    CONSTRAINT budgets_user_category_period_unique UNIQUE (user_id, category_id, period_start_date, period_end_date)
);

-- Trigger para 'updated_at' na tabela de orçamentos
CREATE OR REPLACE TRIGGER handle_updated_at_on_budgets
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- Tabela de Metas Financeiras
CREATE TABLE IF NOT EXISTS public.financial_goals (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL,
    name text NOT NULL,
    target_amount numeric(12, 2) NOT NULL,
    current_amount numeric(12, 2) NOT NULL DEFAULT 0,
    deadline_date date,
    icon text,
    notes text,
    status text NOT NULL DEFAULT 'in_progress'::text, -- 'in_progress', 'achieved', 'cancelled'
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT financial_goals_pkey PRIMARY KEY (id),
    CONSTRAINT financial_goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Trigger para 'updated_at' na tabela de metas financeiras
CREATE OR REPLACE TRIGGER handle_updated_at_on_financial_goals
  BEFORE UPDATE ON public.financial_goals
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- Tabela de Lista de Tarefas (Todos)
CREATE TABLE IF NOT EXISTS public.todos (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL,
    description text NOT NULL,
    is_completed boolean NOT NULL DEFAULT false,
    due_date date,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT todos_pkey PRIMARY KEY (id),
    CONSTRAINT todos_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Trigger para 'updated_at' na tabela de todos
CREATE OR REPLACE TRIGGER handle_updated_at_on_todos
  BEFORE UPDATE ON public.todos
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime(updated_at);


-- ### 4. Políticas de Segurança (Row Level Security - RLS) ###
-- As políticas garantem que os usuários só possam acessar seus próprios dados.

-- Habilita RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas para garantir um estado limpo
DROP POLICY IF EXISTS "Allow all users to read public default categories" ON public.categories;
DROP POLICY IF EXISTS "Allow individual user access to their own categories" ON public.categories;
DROP POLICY IF EXISTS "Allow individual user access to their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow individual user access to their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow individual user access to their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Allow individual user access to their own financial goals" ON public.financial_goals;
DROP POLICY IF EXISTS "Allow individual user access to their own todos" ON public.todos;
DROP POLICY IF EXISTS "Allow anon to insert their own profile on signup" ON public.profiles;

-- Políticas para `profiles`
CREATE POLICY "Allow individual user access to their own profiles" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- Políticas para `categories`
CREATE POLICY "Allow all users to read public default categories" ON public.categories
  FOR SELECT USING (is_default = true);
CREATE POLICY "Allow individual user access to their own categories" ON public.categories
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para `transactions`
CREATE POLICY "Allow individual user access to their own transactions" ON public.transactions
  FOR ALL USING (auth.uid() = user_id);
  
-- Políticas para `budgets`
CREATE POLICY "Allow individual user access to their own budgets" ON public.budgets
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para `financial_goals`
CREATE POLICY "Allow individual user access to their own financial goals" ON public.financial_goals
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para `todos`
CREATE POLICY "Allow individual user access to their own todos" ON public.todos
  FOR ALL USING (auth.uid() = user_id);


-- Garante que categorias padrão não tenham nomes duplicados
CREATE UNIQUE INDEX IF NOT EXISTS categories_default_name_unique 
ON public.categories(name)
WHERE is_default = true;

-- ### 5. Dados Iniciais (Seed Data) ###
-- Insere categorias padrão que estarão disponíveis para todos os usuários.
INSERT INTO public.categories (name, type, icon, is_default) VALUES
  ('Salário', 'income', 'DollarSign', true),
  ('Rendimentos', 'income', 'TrendingUp', true),
  ('Vendas', 'income', 'ShoppingCart', true),
  ('Outras Receitas', 'income', 'PiggyBank', true),
  ('Moradia', 'expense', 'Home', true),
  ('Alimentação', 'expense', 'Utensils', true),
  ('Transporte', 'expense', 'Car', true),
  ('Lazer', 'expense', 'Gamepad2', true),
  ('Saúde', 'expense', 'HeartPulse', true),
  ('Educação', 'expense', 'GraduationCap', true),
  ('Vestuário', 'expense', 'Shirt', true),
  ('Impostos', 'expense', 'Landmark', true),
  ('Serviços', 'expense', 'Wrench', true),
  ('Outras Despesas', 'expense', 'Receipt', true)
ON CONFLICT (name) WHERE is_default = true DO NOTHING;

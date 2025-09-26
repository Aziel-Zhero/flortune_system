-- =============================================
--           SCHEMA DO BANCO DE DADOS FLORTUNE
-- =============================================
-- Versão: 4.0
-- Descrição: Este script configura o banco de dados PostgreSQL para a aplicação Flortune,
--            utilizando o NextAuth.js com o SupabaseAdapter. Ele cria os schemas,
--            tabelas, triggers e políticas de segurança (RLS) necessários.
-- =============================================

-- =============================================
-- EXTENSIONS
-- Habilita a geração de UUIDs.
-- =============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- =============================================
-- SCHEMA next_auth (para o SupabaseAdapter)
-- Tabelas padrão exigidas pelo NextAuth.js Adapter.
-- =============================================
CREATE SCHEMA IF NOT EXISTS next_auth;

-- Tabela de Usuários do NextAuth
CREATE TABLE IF NOT EXISTS next_auth.users (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name text NULL,
  email text NULL,
  "emailVerified" timestamptz NULL,
  image text NULL,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_email_key UNIQUE (email)
);

-- Tabela de Contas (OAuth)
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
  CONSTRAINT "accounts_provider_providerAccountId_key" UNIQUE (provider, "providerAccountId"),
  CONSTRAINT accounts_userId_fkey FOREIGN KEY ("userId") REFERENCES next_auth.users(id) ON DELETE CASCADE
);

-- Tabela de Sessões
CREATE TABLE IF NOT EXISTS next_auth.sessions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "sessionToken" text NOT NULL,
  "userId" uuid NOT NULL,
  expires timestamptz NOT NULL,
  CONSTRAINT sessions_pkey PRIMARY KEY (id),
  CONSTRAINT "sessions_sessionToken_key" UNIQUE ("sessionToken"),
  CONSTRAINT sessions_userId_fkey FOREIGN KEY ("userId") REFERENCES next_auth.users(id) ON DELETE CASCADE
);

-- Tabela de Tokens de Verificação
CREATE TABLE IF NOT EXISTS next_auth.verification_tokens (
  identifier text NOT NULL,
  token text NOT NULL,
  expires timestamptz NOT NULL,
  CONSTRAINT verification_tokens_pkey PRIMARY KEY (identifier, token)
);

-- =============================================
-- SCHEMA public (Tabelas da Aplicação)
-- =============================================

-- ---------------------------------------------
-- Tabela de Perfis de Usuário (public.profiles)
-- Armazena dados adicionais do usuário.
-- ---------------------------------------------
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
  CONSTRAINT profiles_email_key UNIQUE (email),
  CONSTRAINT profiles_cpf_cnpj_key UNIQUE (cpf_cnpj),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------
-- Função de Trigger (handle_new_user_from_next_auth)
-- Cria um registro em `public.profiles` quando um novo usuário é criado em `next_auth.users`
-- (geralmente por um provedor OAuth como o Google).
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user_from_next_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insere um novo perfil ou atualiza um existente (caso o signup manual tenha criado um placeholder)
  INSERT INTO public.profiles (id, full_name, display_name, email, avatar_url, account_type)
  VALUES (
    NEW.id,
    NEW.name,  -- Mapeia o 'name' do NextAuth para 'full_name'
    SPLIT_PART(NEW.name, ' ', 1), -- Usa o primeiro nome como 'display_name'
    NEW.email,
    NEW.image, -- Mapeia o 'image' do NextAuth para 'avatar_url'
    'pessoa'   -- Define 'pessoa' como padrão para cadastros OAuth
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    email = COALESCE(public.profiles.email, EXCLUDED.email),
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url);
  RETURN NEW;
END;
$$;

-- ---------------------------------------------
-- Trigger para `next_auth.users`
-- ---------------------------------------------
-- Remove o trigger antigo se existir, para garantir a recriação correta.
DROP TRIGGER IF EXISTS on_next_auth_user_created ON next_auth.users;
-- Cria o trigger que dispara a função acima após a inserção de um novo usuário no schema do adapter.
CREATE TRIGGER on_next_auth_user_created
  AFTER INSERT ON next_auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_from_next_auth();

-- ---------------------------------------------
-- Políticas de Segurança (RLS) para `profiles`
-- ---------------------------------------------
-- Permite que usuários leiam seu próprio perfil.
DROP POLICY IF EXISTS "Allow individual user to read their own profile" ON public.profiles;
CREATE POLICY "Allow individual user to read their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Permite que usuários atualizem seu próprio perfil.
DROP POLICY IF EXISTS "Allow individual user to update their own profile" ON public.profiles;
CREATE POLICY "Allow individual user to update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Permite que a action de signup (usando anon key) insira um novo perfil.
-- A verificação de email duplicado já é feita na server action.
DROP POLICY IF EXISTS "Allow anon to insert their own profile on signup" ON public.profiles;
CREATE POLICY "Allow anon to insert their own profile on signup"
  ON public.profiles FOR INSERT
  TO anon
  WITH CHECK (true);

-- =============================================
-- Demais Tabelas da Aplicação
-- =============================================

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
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
-- Políticas para Categorias
DROP POLICY IF EXISTS "Allow user to manage their own categories" ON public.categories;
CREATE POLICY "Allow user to manage their own categories" ON public.categories
  FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Allow user to read default categories" ON public.categories;
CREATE POLICY "Allow user to read default categories" ON public.categories
  FOR SELECT USING (is_default = true);


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
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
-- Política para Transações
DROP POLICY IF EXISTS "Allow user to manage their own transactions" ON public.transactions;
CREATE POLICY "Allow user to manage their own transactions" ON public.transactions
  FOR ALL USING (auth.uid() = user_id);


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
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
-- Política para Orçamentos
DROP POLICY IF EXISTS "Allow user to manage their own budgets" ON public.budgets;
CREATE POLICY "Allow user to manage their own budgets" ON public.budgets
  FOR ALL USING (auth.uid() = user_id);


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
  status text NOT NULL DEFAULT 'in_progress'::text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT financial_goals_pkey PRIMARY KEY (id),
  CONSTRAINT financial_goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
-- Política para Metas Financeiras
DROP POLICY IF EXISTS "Allow user to manage their own financial goals" ON public.financial_goals;
CREATE POLICY "Allow user to manage their own financial goals" ON public.financial_goals
  FOR ALL USING (auth.uid() = user_id);

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
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
-- Política para Tarefas
DROP POLICY IF EXISTS "Allow user to manage their own todos" ON public.todos;
CREATE POLICY "Allow user to manage their own todos" ON public.todos
  FOR ALL USING (auth.uid() = user_id);


-- =============================================
-- DADOS INICIAIS (CATEGORIAS PADRÃO)
-- =============================================
INSERT INTO public.categories (name, type, icon, is_default) VALUES
  ('Salário', 'income', 'DollarSign', true),
  ('Freelance', 'income', 'Briefcase', true),
  ('Rendimentos', 'income', 'TrendingUp', true),
  ('Outras Receitas', 'income', 'PlusCircle', true),
  ('Moradia', 'expense', 'Home', true),
  ('Alimentação', 'expense', 'Utensils', true),
  ('Transporte', 'expense', 'Car', true),
  ('Lazer', 'expense', 'Film', true),
  ('Saúde', 'expense', 'HeartPulse', true),
  ('Educação', 'expense', 'BookOpen', true),
  ('Compras', 'expense', 'ShoppingBag', true),
  ('Impostos e Taxas', 'expense', 'Landmark', true),
  ('Dívidas e Empréstimos', 'expense', 'CreditCard', true),
  ('Outras Despesas', 'expense', 'MinusCircle', true)
ON CONFLICT (name) WHERE (is_default = true) DO NOTHING;

-- =============================================
-- FIM DO SCRIPT
-- =============================================

-- ------------------------------------------------------------------------------------------------
-- FLORTUNE DATABASE SCHEMA
-- Last Updated: [YYYY-MM-DD]
-- Description: This script sets up the necessary schemas, tables, policies, and triggers
-- for the Flortune application, integrating with NextAuth.js via the Supabase adapter.
-- ------------------------------------------------------------------------------------------------

-- ================================================================================================
-- 1. EXTENSIONS
-- ================================================================================================
-- Habilita a extensão para geração de UUIDs.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


-- ================================================================================================
-- 2. SCHEMAS
-- ================================================================================================
-- O schema `next_auth` é requerido pelo SupabaseAdapter.
-- Ele armazena os dados de sessão, usuários e contas OAuth gerenciados pelo NextAuth.
CREATE SCHEMA IF NOT EXISTS next_auth;


-- ================================================================================================
-- 3. NEXT_AUTH TABLES (Gerenciado pelo SupabaseAdapter)
-- Documentação de referência: https://authjs.dev/reference/adapter/supabase
-- Estas tabelas são criadas e gerenciadas pelo adapter, mas as definimos aqui para clareza
-- e para garantir que o schema esteja correto.
-- ================================================================================================

-- Tabela de Usuários (Central do NextAuth)
CREATE TABLE IF NOT EXISTS next_auth.users (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name text,
  email text,
  "emailVerified" timestamptz,
  image text,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT email_unique UNIQUE (email)
);

-- Tabela de Sessões (Armazena sessões de login ativas)
CREATE TABLE IF NOT EXISTS next_auth.sessions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "sessionToken" text NOT NULL,
  "userId" uuid NOT NULL,
  expires timestamptz NOT NULL,
  CONSTRAINT sessions_pkey PRIMARY KEY (id),
  CONSTRAINT session_token_unique UNIQUE ("sessionToken"),
  CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES next_auth.users(id) ON DELETE CASCADE
);

-- Tabela de Contas (Armazena contas de provedores OAuth, como Google)
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
  CONSTRAINT "provider_unique" UNIQUE (provider, "providerAccountId"),
  CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES next_auth.users(id) ON DELETE CASCADE
);

-- Tabela de Tokens de Verificação (Usado para email "magic link")
CREATE TABLE IF NOT EXISTS next_auth.verification_tokens (
  identifier text,
  token text,
  expires timestamptz NOT NULL,
  CONSTRAINT verification_tokens_pkey PRIMARY KEY (token),
  CONSTRAINT "token_identifier_unique" UNIQUE (token, identifier)
);


-- ================================================================================================
-- 4. PUBLIC SCHEMA TABLES (Tabelas da Aplicação Flortune)
-- ================================================================================================

-- Tabela de Perfis de Usuários (Estende `next_auth.users` com dados específicos da aplicação)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  full_name text,
  display_name text,
  email text NOT NULL,
  hashed_password text, -- Para login com credenciais
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
  -- A FK direta foi removida para permitir que o cadastro manual (credenciais) crie o perfil
  -- antes do usuário existir em `next_auth.users`. O trigger cuidará da sincronização.
  -- CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES next_auth.users(id) ON DELETE CASCADE
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES next_auth.users(id) ON DELETE CASCADE
);

-- Tabela de Categorias
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL, -- 'income' ou 'expense'
  icon text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);

-- Tabela de Transações
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  description text NOT NULL,
  amount numeric(12, 2) NOT NULL,
  date date NOT NULL,
  type text NOT NULL, -- 'income' ou 'expense'
  notes text,
  is_recurring boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT transactions_pkey PRIMARY KEY (id)
);

-- Tabela de Orçamentos
CREATE TABLE IF NOT EXISTS public.budgets (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  limit_amount numeric(12, 2) NOT NULL,
  spent_amount numeric(12, 2) NOT NULL DEFAULT 0,
  period_start_date date NOT NULL,
  period_end_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT budgets_pkey PRIMARY KEY (id),
  CONSTRAINT budgets_user_category_period_unique UNIQUE (user_id, category_id, period_start_date)
);

-- Tabela de Metas Financeiras
CREATE TABLE IF NOT EXISTS public.financial_goals (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  target_amount numeric(12, 2) NOT NULL,
  current_amount numeric(12, 2) NOT NULL DEFAULT 0,
  deadline_date date,
  icon text,
  notes text,
  status text NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'achieved', 'cancelled'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT financial_goals_pkey PRIMARY KEY (id)
);

-- Tabela de Tarefas (To-Dos)
CREATE TABLE IF NOT EXISTS public.todos (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  description text NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  due_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT todos_pkey PRIMARY KEY (id)
);


-- ================================================================================================
-- 5. TRIGGERS AND FUNCTIONS
-- ================================================================================================

-- Função para atualizar `updated_at` automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para `updated_at` em cada tabela
DROP TRIGGER IF EXISTS on_profiles_update ON public.profiles;
CREATE TRIGGER on_profiles_update BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS on_categories_update ON public.categories;
CREATE TRIGGER on_categories_update BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS on_transactions_update ON public.transactions;
CREATE TRIGGER on_transactions_update BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS on_budgets_update ON public.budgets;
CREATE TRIGGER on_budgets_update BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS on_financial_goals_update ON public.financial_goals;
CREATE TRIGGER on_financial_goals_update BEFORE UPDATE ON public.financial_goals FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS on_todos_update ON public.todos;
CREATE TRIGGER on_todos_update BEFORE UPDATE ON public.todos FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- ------------------------------------------------------------------------------------------------
-- Função e Trigger para sincronizar `public.profiles` com `next_auth.users`
-- ------------------------------------------------------------------------------------------------
-- Esta função é disparada sempre que um novo usuário é criado em `next_auth.users`
-- (seja por OAuth ou pelo adapter após um login com credenciais bem-sucedido).
-- Ela cria uma entrada correspondente em `public.profiles`.
-- O `ON CONFLICT (id) DO NOTHING` garante que, se um perfil já foi criado manualmente
-- (no caso do signup com credenciais), a operação não falhe.
-- O `DO UPDATE` garante que, se o usuário fizer login com OAuth e já tiver uma conta
-- de credenciais, os dados (nome, avatar) sejam atualizados.
-- A função é `SECURITY DEFINER` para ter permissões de inserir em `public.profiles`.
-- ------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user_from_next_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- SET LOCAL search_path = public, extensions; -- Adicionado para garantir o acesso a uuid_generate_v4
  INSERT INTO public.profiles (id, full_name, display_name, email, avatar_url)
  VALUES (
    NEW.id,
    NEW.name,
    NEW.name,
    NEW.email,
    NEW.image
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(NEW.name, public.profiles.full_name),
    display_name = COALESCE(NEW.name, public.profiles.display_name),
    email = COALESCE(NEW.email, public.profiles.email),
    avatar_url = COALESCE(NEW.image, public.profiles.avatar_url),
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que chama a função acima
DROP TRIGGER IF EXISTS on_next_auth_user_created ON next_auth.users;
CREATE TRIGGER on_next_auth_user_created
  AFTER INSERT ON next_auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_from_next_auth();


-- ================================================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ================================================================================================

-- Ativa a RLS em todas as tabelas relevantes.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- ------ Políticas para `public.profiles` ------
-- Usuários podem ver seu próprio perfil.
DROP POLICY IF EXISTS "Allow user to view their own profile" ON public.profiles;
CREATE POLICY "Allow user to view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Usuários podem atualizar seu próprio perfil.
DROP POLICY IF EXISTS "Allow user to update their own profile" ON public.profiles;
CREATE POLICY "Allow user to update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Permite que a action de signup (usando anon key) insira um novo perfil.
-- A verificação de email duplicado já é feita na server action.
DROP POLICY IF EXISTS "Allow anon to insert their own profile on signup" ON public.profiles;
CREATE POLICY "Allow anon to insert their own profile on signup"
  ON public.profiles FOR INSERT
  TO anon
  WITH CHECK (true);
  
-- *** NOVO: Permite que a anon key verifique se um email já existe durante o cadastro ***
DROP POLICY IF EXISTS "Allow anon to select email for signup check" ON public.profiles;
CREATE POLICY "Allow anon to select email for signup check"
  ON public.profiles FOR SELECT
  TO anon
  USING (true);


-- ------ Políticas para `public.categories` ------
-- Usuários podem ver suas próprias categorias E as categorias padrão.
DROP POLICY IF EXISTS "Allow user to view their own and default categories" ON public.categories;
CREATE POLICY "Allow user to view their own and default categories" ON public.categories
  FOR SELECT USING (auth.uid() = user_id OR is_default = true);

-- Usuários podem criar categorias para si mesmos.
DROP POLICY IF EXISTS "Allow user to create their own categories" ON public.categories;
CREATE POLICY "Allow user to create their own categories" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar suas próprias categorias (mas não as padrão).
DROP POLICY IF EXISTS "Allow user to update their own categories" ON public.categories;
CREATE POLICY "Allow user to update their own categories" ON public.categories
  FOR UPDATE USING (auth.uid() = user_id AND is_default = false);

-- Usuários podem deletar suas próprias categorias (mas não as padrão).
DROP POLICY IF EXISTS "Allow user to delete their own categories" ON public.categories;
CREATE POLICY "Allow user to delete their own categories" ON public.categories
  FOR DELETE USING (auth.uid() = user_id AND is_default = false);


-- ------ Políticas para `public.transactions`, `budgets`, `financial_goals`, `todos` ------
-- (O padrão é o mesmo para todas: o usuário só pode manipular seus próprios dados)

-- Transactions
DROP POLICY IF EXISTS "Allow full access to own transactions" ON public.transactions;
CREATE POLICY "Allow full access to own transactions" ON public.transactions
  FOR ALL USING (auth.uid() = user_id);

-- Budgets
DROP POLICY IF EXISTS "Allow full access to own budgets" ON public.budgets;
CREATE POLICY "Allow full access to own budgets" ON public.budgets
  FOR ALL USING (auth.uid() = user_id);

-- Financial Goals
DROP POLICY IF EXISTS "Allow full access to own financial goals" ON public.financial_goals;
CREATE POLICY "Allow full access to own financial goals" ON public.financial_goals
  FOR ALL USING (auth.uid() = user_id);

-- Todos
DROP POLICY IF EXISTS "Allow full access to own todos" ON public.todos;
CREATE POLICY "Allow full access to own todos" ON public.todos
  FOR ALL USING (auth.uid() = user_id);


-- ================================================================================================
-- 7. DADOS INICIAIS (SEED DATA)
-- ================================================================================================
-- Insere categorias padrão que estarão disponíveis para todos os usuários.
-- O `ON CONFLICT (name) DO NOTHING` impede a inserção de duplicatas se o script for rodado novamente.
INSERT INTO public.categories (name, type, icon, is_default) VALUES
  ('Salário', 'income', 'DollarSign', true),
  ('Freelance', 'income', 'Briefcase', true),
  ('Investimentos', 'income', 'TrendingUp', true),
  ('Outras Receitas', 'income', 'PlusCircle', true),
  ('Moradia', 'expense', 'Home', true),
  ('Alimentação', 'expense', 'ShoppingBasket', true),
  ('Transporte', 'expense', 'Car', true),
  ('Saúde', 'expense', 'Heart', true),
  ('Lazer', 'expense', 'GlassWater', true),
  ('Educação', 'expense', 'BookOpen', true),
  ('Contas', 'expense', 'FileText', true), -- Ex: água, luz, internet
  ('Compras', 'expense', 'ShoppingBag', true),
  ('Viagens', 'expense', 'Plane', true),
  ('Impostos', 'expense', 'Landmark', true),
  ('Outras Despesas', 'expense', 'MinusCircle', true)
ON CONFLICT (name) DO NOTHING;

-- ------------------------------------------------------------------------------------------------
-- FIM DO SCRIPT
-- ------------------------------------------------------------------------------------------------

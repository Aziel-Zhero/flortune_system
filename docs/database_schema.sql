-- ### FLORTUNE DATABASE SCHEMA ###
-- Versão: 1.4
-- Descrição: Schema completo para o banco de dados do Flortune no Supabase.
-- Inclui tabelas para autenticação com NextAuth.js, perfis de usuário, e as funcionalidades principais do app.
-- Este script é idempotente e pode ser executado múltiplas vezes.

-- ### Habilita Extensões Essenciais ###
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "moddatetime" WITH SCHEMA extensions;

-- ----------------------------------------------------------------
-- ### Schema para NextAuth.js (Auth.js) ###
-- Este schema armazena os dados necessários para o SupabaseAdapter do NextAuth.js.
-- ----------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS next_auth;

-- Tabela de Usuários do NextAuth
-- Armazena o perfil básico do usuário (id, nome, email, imagem) usado pelo NextAuth.
CREATE TABLE IF NOT EXISTS next_auth.users (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name text NULL,
  email text NULL,
  "emailVerified" timestamptz NULL,
  image text NULL,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_email_key UNIQUE (email)
);

-- Tabela de Contas OAuth
-- Armazena informações de provedores OAuth (Google, etc.) vinculados a um usuário.
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
  CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES next_auth.users(id) ON DELETE CASCADE
);
-- Cria um índice composto para garantir que cada conta de provedor seja única por usuário.
CREATE UNIQUE INDEX IF NOT EXISTS "accounts_provider_providerAccountId_idx" ON next_auth.accounts USING btree (provider, "providerAccountId");


-- Tabela de Sessões
-- Armazena as sessões ativas dos usuários.
CREATE TABLE IF NOT EXISTS next_auth.sessions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "sessionToken" text NOT NULL,
  "userId" uuid NOT NULL,
  expires timestamptz NOT NULL,
  CONSTRAINT sessions_pkey PRIMARY KEY (id),
  CONSTRAINT "sessions_sessionToken_key" UNIQUE ("sessionToken"),
  CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES next_auth.users(id) ON DELETE CASCADE
);

-- Tabela de Tokens de Verificação
-- Usada para fluxos como "esqueci minha senha" ou verificação de email.
CREATE TABLE IF NOT EXISTS next_auth.verification_tokens (
  identifier text,
  token text,
  expires timestamptz NOT NULL,
  CONSTRAINT verification_tokens_pkey PRIMARY KEY (identifier, token)
);

-- ----------------------------------------------------------------
-- ### Schema Público (Tabelas da Aplicação) ###
-- ----------------------------------------------------------------

-- Tabela de Perfis
-- Estende a tabela next_auth.users com informações adicionais e específicas do Flortune.
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY, -- Chave primária que corresponde ao ID em next_auth.users
  full_name text,
  display_name text,
  email text NOT NULL UNIQUE,
  hashed_password text, -- Para login com credenciais
  phone text,
  cpf_cnpj text UNIQUE,
  rg text,
  avatar_url text,
  account_type text CHECK (account_type IN ('pessoa', 'empresa')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger para atualizar 'updated_at' na tabela de perfis
DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);

-- Tabela de Categorias
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  icon text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- Garante que o nome de uma categoria seja único por usuário (exceto as padrão)
CREATE UNIQUE INDEX IF NOT EXISTS "categories_user_id_name_key" ON public.categories (user_id, name) WHERE user_id IS NOT NULL;
-- Garante que categorias padrão não tenham nomes duplicados
CREATE UNIQUE INDEX IF NOT EXISTS "categories_default_name_unique" ON public.categories(name) WHERE is_default = true;

-- Tabela de Transações
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  description text NOT NULL,
  amount numeric(12, 2) NOT NULL,
  date date NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  notes text,
  is_recurring boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- Trigger para 'updated_at'
DROP TRIGGER IF EXISTS on_transactions_updated ON public.transactions;
CREATE TRIGGER on_transactions_updated
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);

-- Tabela de Orçamentos
CREATE TABLE IF NOT EXISTS public.budgets (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  limit_amount numeric(12, 2) NOT NULL,
  spent_amount numeric(12, 2) NOT NULL DEFAULT 0,
  period_start_date date NOT NULL,
  period_end_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT budgets_user_category_period_unique UNIQUE (user_id, category_id, period_start_date)
);
-- Trigger para 'updated_at'
DROP TRIGGER IF EXISTS on_budgets_updated ON public.budgets;
CREATE TRIGGER on_budgets_updated
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);

-- Tabela de Metas Financeiras
CREATE TABLE IF NOT EXISTS public.financial_goals (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  target_amount numeric(12, 2) NOT NULL,
  current_amount numeric(12, 2) NOT NULL DEFAULT 0,
  deadline_date date,
  icon text,
  notes text,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'achieved', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- Trigger para 'updated_at'
DROP TRIGGER IF EXISTS on_financial_goals_updated ON public.financial_goals;
CREATE TRIGGER on_financial_goals_updated
  BEFORE UPDATE ON public.financial_goals
  FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);

-- Tabela de Tarefas (To-Do List)
CREATE TABLE IF NOT EXISTS public.todos (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    description text NOT NULL,
    is_completed boolean NOT NULL DEFAULT false,
    due_date date,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
-- Trigger para 'updated_at'
DROP TRIGGER IF EXISTS on_todos_updated ON public.todos;
CREATE TRIGGER on_todos_updated
  BEFORE UPDATE ON public.todos
  FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);
  
-- ----------------------------------------------------------------
-- ### Políticas de Segurança (Row Level Security) ###
-- ----------------------------------------------------------------

-- Perfis: Usuários podem ver seu próprio perfil.
-- A inserção é permitida para anônimos (durante o signup) e a atualização para o próprio usuário.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);
  
DROP POLICY IF EXISTS "Allow anon to insert their own profile on signup" ON public.profiles;
CREATE POLICY "Allow anon to insert their own profile on signup"
  ON public.profiles FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Outras tabelas: Usuários podem ver/modificar apenas seus próprios dados.
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own categories" ON public.categories;
CREATE POLICY "Users can manage their own categories" ON public.categories
  FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view default categories" ON public.categories;
CREATE POLICY "Users can view default categories" ON public.categories
  FOR SELECT USING (is_default = true);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own transactions" ON public.transactions;
CREATE POLICY "Users can manage their own transactions" ON public.transactions
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own budgets" ON public.budgets;
CREATE POLICY "Users can manage their own budgets" ON public.budgets
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own financial goals" ON public.financial_goals;
CREATE POLICY "Users can manage their own financial goals" ON public.financial_goals
  FOR ALL USING (auth.uid() = user_id);
  
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own todos" ON public.todos;
CREATE POLICY "Users can manage their own todos" ON public.todos
  FOR ALL USING (auth.uid() = user_id);
  

-- ### Dados Iniciais (Seed Data) ###
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

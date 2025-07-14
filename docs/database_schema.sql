-- ### FLORTUNE DATABASE SCHEMA ###
-- Last updated: 2024-07-15
-- Este script configura o banco de dados para o aplicativo Flortune,
-- incluindo o schema necessário para o NextAuth.js Supabase Adapter e as tabelas da aplicação.

-- =================================================================
-- 1. HABILITAR EXTENSÕES E CONFIGURAR SCHEMA
-- =================================================================
-- Habilita a extensão para geração de UUIDs se ainda não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- Cria o schema 'next_auth' se ele não existir, para uso do Adapter
CREATE SCHEMA IF NOT EXISTS next_auth;

-- =================================================================
-- 2. TABELAS PARA O NEXT-AUTH.JS SUPABASE ADAPTER
-- =================================================================
-- Estas tabelas são gerenciadas pelo @auth/supabase-adapter e NÃO DEVEM ser modificadas manualmente.
-- Elas armazenam usuários, sessões, contas de provedores OAuth, etc.

-- Tabela de Usuários (Central para NextAuth)
CREATE TABLE IF NOT EXISTS next_auth.users (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name text NULL,
  email text NULL,
  "emailVerified" timestamptz NULL,
  image text NULL,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT email_unique UNIQUE (email)
);

-- Tabela de Contas (Para provedores OAuth como Google, GitHub, etc.)
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

-- Tabela de Sessões (Para gerenciar sessões JWT)
CREATE TABLE IF NOT EXISTS next_auth.sessions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "sessionToken" text NOT NULL,
  "userId" uuid NOT NULL,
  expires timestamptz NOT NULL,
  CONSTRAINT sessions_pkey PRIMARY KEY (id),
  CONSTRAINT "sessionToken_unique" UNIQUE ("sessionToken"),
  CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES next_auth.users(id) ON DELETE CASCADE
);

-- Tabela de Tokens de Verificação (Para login com email "mágico", etc.)
CREATE TABLE IF NOT EXISTS next_auth.verification_tokens (
  identifier text NULL,
  token text NOT NULL,
  expires timestamptz NOT NULL,
  CONSTRAINT "verification_tokens_token_key" UNIQUE (token),
  CONSTRAINT verification_tokens_pkey PRIMARY KEY (identifier, token)
);

-- =================================================================
-- 3. TABELAS DA APLICAÇÃO (SCHEMA 'public')
-- =================================================================

-- Tabela de Perfis de Usuário (Dados adicionais dos usuários)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  full_name text,
  display_name text,
  email text NOT NULL,
  hashed_password text, -- Armazena a senha para login com credenciais
  phone text,
  cpf_cnpj text UNIQUE,
  rg text,
  avatar_url text,
  account_type text CHECK (account_type IN ('pessoa', 'empresa')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_email_key UNIQUE (email),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE -- **REMOVIDO E AGORA GERENCIADO PELA SERVER ACTION**
);
COMMENT ON TABLE public.profiles IS 'Stores public-facing profile information for each user, extending the base user data from next_auth.users.';
COMMENT ON COLUMN public.profiles.id IS 'References auth.users.id. Ensures a 1-to-1 relationship.';

-- Tabela de Categorias (Receitas e Despesas)
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NULL, -- FK para profiles.id. Nulo para categorias padrão.
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  icon text NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.categories IS 'Stores user-defined and default categories for transactions.';

-- Tabela de Transações (Movimentações Financeiras)
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
COMMENT ON TABLE public.transactions IS 'Records all financial movements for users.';

-- Tabela de Orçamentos
CREATE TABLE IF NOT EXISTS public.budgets (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL,
  category_id uuid NOT NULL,
  limit_amount numeric(12, 2) NOT NULL,
  spent_amount numeric(12, 2) NOT NULL DEFAULT 0.00,
  period_start_date date NOT NULL,
  period_end_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT budgets_pkey PRIMARY KEY (id),
  CONSTRAINT budgets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT budgets_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.budgets IS 'Defines spending limits for categories over specific periods.';

-- Tabela de Metas Financeiras
CREATE TABLE IF NOT EXISTS public.financial_goals (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  target_amount numeric(12, 2) NOT NULL,
  current_amount numeric(12, 2) NOT NULL DEFAULT 0.00,
  deadline_date date NULL,
  icon text NULL,
  notes text NULL,
  status text NOT NULL DEFAULT 'in_progress'::text CHECK (status IN ('in_progress', 'achieved', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT financial_goals_pkey PRIMARY KEY (id),
  CONSTRAINT financial_goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.financial_goals IS 'Tracks user savings goals and progress.';

-- Tabela de Lista de Tarefas (To-Do List)
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
COMMENT ON TABLE public.todos IS 'Simple to-do list for users.';

-- =================================================================
-- 4. TRIGGERS, FUNÇÕES E POLÍTICAS DE RLS
-- =================================================================

-- Função para atualizar o timestamp 'updated_at'
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para 'updated_at' em cada tabela
DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS on_categories_updated ON public.categories;
CREATE TRIGGER on_categories_updated BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS on_transactions_updated ON public.transactions;
CREATE TRIGGER on_transactions_updated BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS on_budgets_updated ON public.budgets;
CREATE TRIGGER on_budgets_updated BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS on_financial_goals_updated ON public.financial_goals;
CREATE TRIGGER on_financial_goals_updated BEFORE UPDATE ON public.financial_goals FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS on_todos_updated ON public.todos;
CREATE TRIGGER on_todos_updated BEFORE UPDATE ON public.todos FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();


-- ** REMOVIDO ** --
-- O trigger a seguir foi removido pois a lógica de sincronização
-- foi movida para a Server Action de cadastro para maior confiabilidade.
DROP FUNCTION IF EXISTS public.handle_new_user_from_next_auth();
-- A função e o trigger foram deletados.


-- Ativa Row Level Security (RLS) para todas as tabelas relevantes
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;


-- Políticas de RLS para a tabela 'profiles'
DROP POLICY IF EXISTS "Allow individual user access to their own profile" ON public.profiles;
CREATE POLICY "Allow individual user access to their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow user to update their own profile" ON public.profiles;
CREATE POLICY "Allow user to update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- **NOVA POLÍTICA**: Permite que a Server Action de signup (usando anon key) insira um novo perfil.
-- A validação de segurança é feita na própria Server Action.
DROP POLICY IF EXISTS "Allow anon to insert their own profile on signup" ON public.profiles;
CREATE POLICY "Allow anon to insert their own profile on signup"
  ON public.profiles FOR INSERT
  TO anon
  WITH CHECK (true);

-- Políticas de RLS para outras tabelas (exemplo para 'transactions')
DROP POLICY IF EXISTS "Allow individual user access to their own transactions" ON public.transactions;
CREATE POLICY "Allow individual user access to their own transactions" ON public.transactions
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para as outras tabelas seguem o mesmo padrão
DROP POLICY IF EXISTS "Allow individual user access to their own categories" ON public.categories;
CREATE POLICY "Allow individual user access to their own categories" ON public.categories
  FOR ALL USING (auth.uid() = user_id);
  
DROP POLICY IF EXISTS "Allow public read access to default categories" ON public.categories;
CREATE POLICY "Allow public read access to default categories" ON public.categories
  FOR SELECT TO authenticated, anon USING (is_default = true);

DROP POLICY IF EXISTS "Allow individual user access to their own budgets" ON public.budgets;
CREATE POLICY "Allow individual user access to their own budgets" ON public.budgets
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow individual user access to their own goals" ON public.financial_goals;
CREATE POLICY "Allow individual user access to their own goals" ON public.financial_goals
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow individual user access to their own todos" ON public.todos;
CREATE POLICY "Allow individual user access to their own todos" ON public.todos
  FOR ALL USING (auth.uid() = user_id);


-- =================================================================
-- 5. INSERÇÃO DE DADOS PADRÃO (DEFAULT DATA)
-- =================================================================
-- Insere categorias padrão que estarão disponíveis para todos os usuários.
-- A cláusula ON CONFLICT previne duplicatas caso o script seja rodado novamente.

INSERT INTO public.categories (name, type, icon, is_default) VALUES
  ('Salário', 'income', 'DollarSign', true),
  ('Freelance', 'income', 'Briefcase', true),
  ('Investimentos', 'income', 'TrendingUp', true),
  ('Outras Receitas', 'income', 'PlusCircle', true),
  ('Moradia', 'expense', 'Home', true),
  ('Alimentação', 'expense', 'UtensilsCrossed', true),
  ('Transporte', 'expense', 'Car', true),
  ('Saúde', 'expense', 'HeartPulse', true),
  ('Lazer', 'expense', 'Ticket', true),
  ('Educação', 'expense', 'BookOpen', true),
  ('Compras', 'expense', 'ShoppingBag', true),
  ('Contas e Utilidades', 'expense', 'Receipt', true),
  ('Impostos e Taxas', 'expense', 'Landmark', true),
  ('Outras Despesas', 'expense', 'MinusCircle', true)
ON CONFLICT (name) WHERE is_default = true DO NOTHING;

-- Final do script.
```
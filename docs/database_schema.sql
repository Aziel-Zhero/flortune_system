
-- ### Gerenciamento de Extensões ###
-- Habilita a extensão para gerar UUIDs, caso não exista.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
-- Habilita a extensão para atualizar automaticamente o campo `updated_at`, caso não exista.
CREATE EXTENSION IF NOT EXISTS "moddatetime" WITH SCHEMA extensions;

-- #############################################################################
-- ### Schema para NextAuth.js (Auth.js) ###
-- Este schema é requerido pelo SupabaseAdapter do NextAuth.js para gerenciar sessões,
-- usuários, contas vinculadas e tokens de verificação.
-- #############################################################################

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

-- Tabela de Contas Vinculadas (OAuth)
CREATE TABLE IF NOT EXISTS next_auth.accounts (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
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
  "userId" uuid NULL,
  CONSTRAINT accounts_pkey PRIMARY KEY (id),
  CONSTRAINT "accounts_provider_providerAccountId_key" UNIQUE (provider, "providerAccountId"),
  CONSTRAINT accounts_userId_fkey FOREIGN KEY ("userId") REFERENCES next_auth.users(id) ON DELETE CASCADE
);

-- Tabela de Sessões
CREATE TABLE IF NOT EXISTS next_auth.sessions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  expires timestam_tz NOT NULL,
  "sessionToken" text NOT NULL,
  "userId" uuid NULL,
  CONSTRAINT sessions_pkey PRIMARY KEY (id),
  CONSTRAINT "sessions_sessionToken_key" UNIQUE ("sessionToken"),
  CONSTRAINT sessions_userId_fkey FOREIGN KEY ("userId") REFERENCES next_auth.users(id) ON DELETE CASCADE
);

-- Tabela de Tokens de Verificação (ex: para reset de senha, email mágico)
CREATE TABLE IF NOT EXISTS next_auth.verification_tokens (
  identifier text NULL,
  token text NOT NULL,
  expires timestamptz NOT NULL,
  CONSTRAINT "verification_tokens_token_key" UNIQUE (token),
  CONSTRAINT verification_tokens_pkey PRIMARY KEY (token, identifier)
);

-- #############################################################################
-- ### Schema Público (Tabelas da Aplicação Flortune) ###
-- #############################################################################

-- Tabela de Perfis de Usuário
-- Armazena informações adicionais do usuário, incluindo dados para login com credenciais.
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL,
    full_name text,
    display_name text,
    email text NOT NULL,
    hashed_password text,
    phone text,
    cpf_cnpj text,
    rg text,
    avatar_url text,
    account_type text CHECK (account_type IN ('pessoa', 'empresa')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_email_key UNIQUE (email),
    CONSTRAINT profiles_cpf_cnpj_key UNIQUE (cpf_cnpj),
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.profiles IS 'Stores extended user profile information, including credentials for email/password login.';

-- Tabela de Categorias
-- Armazena categorias de despesas e receitas. Inclui categorias padrão e personalizadas.
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid,
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('income', 'expense')),
    icon text,
    is_default boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT categories_pkey PRIMARY KEY (id),
    CONSTRAINT categories_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    -- Garante que um usuário não pode ter duas categorias com o mesmo nome e tipo.
    CONSTRAINT categories_user_name_type_unique UNIQUE (user_id, name, type)
);
COMMENT ON TABLE public.categories IS 'Stores default and user-created categories for transactions.';

-- Tabela de Transações
CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL,
    category_id uuid,
    description text NOT NULL,
    amount numeric(12, 2) NOT NULL,
    date date NOT NULL,
    type text NOT NULL CHECK (type IN ('income', 'expense')),
    notes text,
    is_recurring boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT transactions_pkey PRIMARY KEY (id),
    CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT transactions_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.transactions IS 'Records all financial income and expense transactions for users.';

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
COMMENT ON TABLE public.budgets IS 'Defines spending limits for specific categories over a period.';

-- Tabela de Metas Financeiras
CREATE TABLE IF NOT EXISTS public.financial_goals (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL,
    name text NOT NULL,
    target_amount numeric(12, 2) NOT NULL,
    current_amount numeric(12, 2) NOT NULL DEFAULT 0.00,
    deadline_date date,
    icon text,
    notes text,
    status text NOT NULL DEFAULT 'in_progress'::text CHECK (status IN ('in_progress', 'achieved', 'cancelled')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT financial_goals_pkey PRIMARY KEY (id),
    CONSTRAINT financial_goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.financial_goals IS 'Tracks user-defined financial savings goals.';

-- Tabela de Lista de Tarefas (To-Dos)
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
COMMENT ON TABLE public.todos IS 'Simple to-do list for user tasks.';


-- #############################################################################
-- ### Triggers para atualização automática do campo 'updated_at' ###
-- #############################################################################
-- Estes triggers usam a extensão `moddatetime` para garantir que o campo `updated_at`
-- seja atualizado em qualquer modificação de linha nas tabelas especificadas.

DROP TRIGGER IF EXISTS on_public_profiles_updated ON public.profiles;
CREATE TRIGGER on_public_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime(updated_at);

DROP TRIGGER IF EXISTS on_public_categories_updated ON public.categories;
CREATE TRIGGER on_public_categories_updated
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime(updated_at);

DROP TRIGGER IF EXISTS on_public_transactions_updated ON public.transactions;
CREATE TRIGGER on_public_transactions_updated
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime(updated_at);

DROP TRIGGER IF EXISTS on_public_budgets_updated ON public.budgets;
CREATE TRIGGER on_public_budgets_updated
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime(updated_at);

DROP TRIGGER IF EXISTS on_public_financial_goals_updated ON public.financial_goals;
CREATE TRIGGER on_public_financial_goals_updated
  BEFORE UPDATE ON public.financial_goals
  FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime(updated_at);

DROP TRIGGER IF EXISTS on_public_todos_updated ON public.todos;
CREATE TRIGGER on_public_todos_updated
  BEFORE UPDATE ON public.todos
  FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime(updated_at);


-- #############################################################################
-- ### Políticas de Segurança (Row Level Security - RLS) ###
-- #############################################################################
-- As políticas RLS são a principal camada de segurança, garantindo que os usuários
-- só possam acessar e manipular seus próprios dados.

-- --- Policies for public.profiles ---
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow individual user to read their own profile" ON public.profiles;
CREATE POLICY "Allow individual user to read their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow individual user to update their own profile" ON public.profiles;
CREATE POLICY "Allow individual user to update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
  
DROP POLICY IF EXISTS "Allow anon to insert their own profile on signup" ON public.profiles;
CREATE POLICY "Allow anon to insert their own profile on signup"
  ON public.profiles FOR INSERT
  TO anon
  WITH CHECK (true);


-- --- Policies for public.categories ---
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow individual user to read their own categories and defaults" ON public.categories;
CREATE POLICY "Allow individual user to read their own categories and defaults"
  ON public.categories FOR SELECT
  USING (auth.uid() = user_id OR is_default = true);

DROP POLICY IF EXISTS "Allow individual user to manage their own categories" ON public.categories;
CREATE POLICY "Allow individual user to manage their own categories"
  ON public.categories FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND is_default = false);


-- --- Policies for public.transactions ---
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow individual user to manage their own transactions" ON public.transactions;
CREATE POLICY "Allow individual user to manage their own transactions"
  ON public.transactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- --- Policies for public.budgets ---
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow individual user to manage their own budgets" ON public.budgets;
CREATE POLICY "Allow individual user to manage their own budgets"
  ON public.budgets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- --- Policies for public.financial_goals ---
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow individual user to manage their own financial goals" ON public.financial_goals;
CREATE POLICY "Allow individual user to manage their own financial goals"
  ON public.financial_goals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- --- Policies for public.todos ---
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow individual user to manage their own todos" ON public.todos;
CREATE POLICY "Allow individual user to manage their own todos"
  ON public.todos FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Garante que categorias padrão não tenham nomes duplicados
CREATE UNIQUE INDEX IF NOT EXISTS categories_default_name_unique 
ON public.categories(name)
WHERE is_default = true;

-- #############################################################################
-- ### Dados Iniciais (Seed Data) ###
-- #############################################################################

-- Insere categorias padrão que estarão disponíveis para todos os usuários.
-- A cláusula ON CONFLICT garante que a operação não falhará se o script for executado novamente.
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

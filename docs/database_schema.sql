
-- ### Gerenciador de Extensões ###
-- Habilita a extensão para geração de UUIDs, essencial para chaves primárias.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
-- Habilita a extensão para auto-atualização de campos 'updated_at'.
CREATE EXTENSION IF NOT EXISTS "moddatetime" WITH SCHEMA extensions;

-- ### Schema para Next-Auth.js ###
-- Isola as tabelas de gerenciamento de sessão do NextAuth.js.
CREATE SCHEMA IF NOT EXISTS next_auth;

-- Tabela de Usuários do NextAuth.js
DROP TABLE IF EXISTS next_auth.users CASCADE;
CREATE TABLE next_auth.users (
    id uuid NOT NULL PRIMARY KEY,
    name text NULL,
    email text NULL,
    "emailVerified" timestamptz NULL,
    image text NULL,
    CONSTRAINT users_email_key UNIQUE (email)
);

-- Tabela de Contas (Provedores OAuth) do NextAuth.js
DROP TABLE IF EXISTS next_auth.accounts CASCADE;
CREATE TABLE next_auth.accounts (
    id uuid NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    "userId" uuid NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
    type text NOT NULL,
    provider text NOT NULL,
    "providerAccountId" text NOT NULL,
    refresh_token text NULL,
    access_token text NULL,
    expires_at int8 NULL,
    token_type text NULL,
    scope text NULL,
    id_token text NULL,
    session_state text NULL
);
CREATE UNIQUE INDEX accounts_provider_providerAccountId_idx ON next_auth.accounts(provider, "providerAccountId");

-- Tabela de Sessões do NextAuth.js
DROP TABLE IF EXISTS next_auth.sessions CASCADE;
CREATE TABLE next_auth.sessions (
    id uuid NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    expires timestamptz NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" uuid NULL REFERENCES next_auth.users(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX sessions_sessionToken_idx ON next_auth.sessions("sessionToken");


-- Tabela de Tokens de Verificação do NextAuth.js
DROP TABLE IF EXISTS next_auth.verification_tokens CASCADE;
CREATE TABLE next_auth.verification_tokens (
    identifier text NOT NULL,
    token text NOT NULL,
    expires timestamptz NOT NULL,
    CONSTRAINT verification_tokens_pkey PRIMARY KEY (identifier, token)
);


-- ### Schema Público (Tabelas da Aplicação) ###

-- Tabela de Perfis de Usuário
DROP TABLE IF EXISTS public.profiles CASCADE;
CREATE TABLE public.profiles (
    id uuid NOT NULL PRIMARY KEY, -- FK para next_auth.users.id
    full_name text,
    display_name text,
    email text NOT NULL UNIQUE,
    hashed_password text,
    phone text,
    cpf_cnpj text UNIQUE,
    rg text,
    avatar_url text,
    account_type text, -- 'pessoa' ou 'empresa'
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de Categorias
DROP TABLE IF EXISTS public.categories CASCADE;
CREATE TABLE public.categories (
    id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('income', 'expense')),
    icon text,
    is_default boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de Transações
DROP TABLE IF EXISTS public.transactions CASCADE;
CREATE TABLE public.transactions (
    id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
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

-- Tabela de Orçamentos
DROP TABLE IF EXISTS public.budgets CASCADE;
CREATE TABLE public.budgets (
    id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    limit_amount numeric(12, 2) NOT NULL,
    spent_amount numeric(12, 2) NOT NULL DEFAULT 0.00,
    period_start_date date NOT NULL,
    period_end_date date NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de Metas Financeiras
DROP TABLE IF EXISTS public.financial_goals CASCADE;
CREATE TABLE public.financial_goals (
    id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    target_amount numeric(12, 2) NOT NULL,
    current_amount numeric(12, 2) NOT NULL DEFAULT 0.00,
    deadline_date date,
    icon text,
    notes text,
    status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'achieved', 'cancelled')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de Lista de Tarefas (Todos)
DROP TABLE IF EXISTS public.todos CASCADE;
CREATE TABLE public.todos (
    id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    description text NOT NULL,
    is_completed boolean NOT NULL DEFAULT false,
    due_date date,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- ### Triggers para 'updated_at' ###
-- Adiciona triggers para atualizar automaticamente o campo 'updated_at' em cada tabela.
DROP TRIGGER IF EXISTS handle_updated_at ON public.profiles;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.profiles 
  FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);

DROP TRIGGER IF EXISTS handle_updated_at ON public.categories;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.categories 
  FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);

DROP TRIGGER IF EXISTS handle_updated_at ON public.transactions;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.transactions 
  FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);

DROP TRIGGER IF EXISTS handle_updated_at ON public.budgets;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.budgets 
  FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);

DROP TRIGGER IF EXISTS handle_updated_at ON public.financial_goals;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.financial_goals 
  FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);

DROP TRIGGER IF EXISTS handle_updated_at ON public.todos;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.todos 
  FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);


-- ### Políticas de Segurança (Row Level Security - RLS) ###

-- Habilita RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Remove políticas existentes para garantir um estado limpo
DROP POLICY IF EXISTS "Allow all for auth users" ON public.profiles;
DROP POLICY IF EXISTS "Allow individual read access" ON public.profiles;
DROP POLICY IF EXISTS "Allow individual update access" ON public.profiles;
DROP POLICY IF EXISTS "Allow anon to insert own profile" ON public.profiles;

DROP POLICY IF EXISTS "Allow all for auth users" ON public.categories;
DROP POLICY IF EXISTS "Allow read access for owner and default" ON public.categories;

DROP POLICY IF EXISTS "Allow all for auth users" ON public.transactions;
DROP POLICY IF EXISTS "Allow all for auth users" ON public.budgets;
DROP POLICY IF EXISTS "Allow all for auth users" ON public.financial_goals;
DROP POLICY IF EXISTS "Allow all for auth users" ON public.todos;

-- Políticas para 'profiles'
-- Usuários podem ver seu próprio perfil.
CREATE POLICY "Allow individual read access" ON public.profiles FOR SELECT
  USING (auth.uid() = id);
-- Usuários podem atualizar seu próprio perfil.
CREATE POLICY "Allow individual update access" ON public.profiles FOR UPDATE
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
-- Permite que a server action de signup (usando anon key) insira um novo perfil.
CREATE POLICY "Allow anon to insert own profile" ON public.profiles FOR INSERT
  TO anon
  WITH CHECK (true);
  
-- Políticas para 'categories'
-- Usuários podem gerenciar (CRUD) suas próprias categorias e ver as categorias padrão.
CREATE POLICY "Allow all for auth users" ON public.categories FOR ALL
  USING (auth.uid() = user_id OR is_default = true);

-- Políticas para outras tabelas (Transações, Orçamentos, Metas, Tarefas)
-- Usuários só podem realizar operações (CRUD) em seus próprios dados.
CREATE POLICY "Allow all for auth users" ON public.transactions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow all for auth users" ON public.budgets FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Allow all for auth users" ON public.financial_goals FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Allow all for auth users" ON public.todos FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  

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
ON CONFLICT (name) DO NOTHING; -- Evita duplicatas se o script for executado novamente.

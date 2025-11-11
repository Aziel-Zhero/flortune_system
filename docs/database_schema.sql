-- Arquivo: docs/database_schema.sql
-- Descrição: Script completo para configurar o banco de dados do Flortune no Supabase.
-- ATENÇÃO: Executar este script limpará e recriará políticas e funções para garantir a versão mais recente.

-- Inicia a transação
BEGIN;

-- Instala a extensão para gerar UUIDs se não existir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- Revoga permissões padrão do schema public para a role public
REVOKE ALL ON SCHEMA public FROM public;

-- Garante ao usuário 'postgres' (superusuário) e 'anon' (chave anônima) o uso do schema
GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;

-- Remove o schema `next_auth` se ele já existir, para uma reinstalação limpa
DROP SCHEMA IF EXISTS next_auth CASCADE;

-- Cria o schema para o NextAuth.js (Auth.js)
CREATE SCHEMA next_auth;

-- Concede permissões para o schema `next_auth`
-- O usuário 'supabase_auth_admin' precisa gerenciar o schema do next-auth
GRANT USAGE ON SCHEMA next_auth TO supabase_auth_admin;
GRANT ALL ON ALL TABLES IN SCHEMA next_auth TO supabase_auth_admin;
GRANT ALL ON ALL ROUTINES IN SCHEMA next_auth TO supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA next_auth TO supabase_auth_admin;

-- As tabelas do NextAuth.js Adapter
-- A função de `uid()` e `current_setting()` será usada pelo RLS

CREATE TABLE next_auth.users (
  id uuid NOT NULL PRIMARY KEY,
  name text,
  email text,
  "emailVerified" timestamp with time zone,
  image text
);

CREATE TABLE next_auth.accounts (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  "userId" uuid NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  provider text NOT NULL,
  "providerAccountId" text NOT NULL,
  refresh_token text,
  access_token text,
  expires_at bigint,
  token_type text,
  scope text,
  id_token text,
  session_state text
);

CREATE TABLE next_auth.sessions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  "sessionToken" text NOT NULL,
  "userId" uuid NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
  expires timestamp with time zone NOT NULL
);

CREATE TABLE next_auth.verification_tokens (
  identifier text,
  token text,
  expires timestamp with time zone
);

-- Índices e constraints para otimização e integridade
CREATE UNIQUE INDEX accounts_provider_provider_account_id_idx ON next_auth.accounts(provider, "providerAccountId");
CREATE UNIQUE INDEX sessions_session_token_idx ON next_auth.sessions("sessionToken");
CREATE UNIQUE INDEX users_email_idx ON next_auth.users(email);
CREATE UNIQUE INDEX verification_tokens_identifier_token_idx ON next_auth.verification_tokens(identifier, token);

-- Tabela de Perfis de Usuários (public.profiles)
-- Esta tabela armazena dados adicionais não gerenciados pelo NextAuth.js
DROP TABLE IF EXISTS public.profiles;
CREATE TABLE public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    display_name text,
    email text UNIQUE,
    phone text,
    avatar_url text,
    account_type text,
    cpf_cnpj text UNIQUE,
    rg text,
    plan_id text DEFAULT 'tier-cultivador',
    has_seen_welcome_message boolean DEFAULT false,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.profiles IS 'Tabela de perfis para armazenar dados adicionais do usuário.';

-- Trigger para atualizar o timestamp 'updated_at'
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profiles_update ON public.profiles;
CREATE TRIGGER on_profiles_update
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();


-- Função para criar um perfil quando um novo usuário é criado no Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, display_name, avatar_url, account_type, plan_id, has_seen_welcome_message, cpf_cnpj, phone, rg)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'display_name',
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'account_type',
        NEW.raw_user_meta_data->>'plan_id',
        (NEW.raw_user_meta_data->>'has_seen_welcome_message')::boolean,
        NEW.raw_user_meta_data->>'cpf_cnpj',
        NEW.raw_user_meta_data->>'phone',
        NEW.raw_user_meta_data->>'rg'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para chamar a função handle_new_user na criação de um usuário no auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- Políticas de Segurança a Nível de Linha (RLS)

-- Habilitar RLS em todas as tabelas relevantes
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para a tabela `profiles`
DROP POLICY IF EXISTS "Allow authenticated users to read their own profile" ON public.profiles;
CREATE POLICY "Allow authenticated users to read their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow authenticated users to update their own profile" ON public.profiles;
CREATE POLICY "Allow authenticated users to update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- Outras Tabelas da Aplicação (transactions, categories, etc.)

-- Tabela de Categorias
DROP TABLE IF EXISTS public.categories CASCADE;
CREATE TABLE public.categories (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('income', 'expense')),
    icon text,
    is_default boolean DEFAULT false,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.categories IS 'Categorias para transações, podem ser padrão ou do usuário.';
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Políticas para `categories`
DROP POLICY IF EXISTS "Allow authenticated users to read default and their own categories" ON public.categories;
CREATE POLICY "Allow authenticated users to read default and their own categories"
  ON public.categories FOR SELECT
  TO authenticated
  USING (is_default = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow authenticated users to create their own categories" ON public.categories;
CREATE POLICY "Allow authenticated users to create their own categories"
  ON public.categories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND is_default = false);

DROP POLICY IF EXISTS "Allow authenticated users to update their own categories" ON public.categories;
CREATE POLICY "Allow authenticated users to update their own categories"
  ON public.categories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND is_default = false)
  WITH CHECK (auth.uid() = user_id AND is_default = false);


-- Tabela de Transações
DROP TABLE IF EXISTS public.transactions CASCADE;
CREATE TABLE public.transactions (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    description text NOT NULL,
    amount real NOT NULL,
    date date NOT NULL,
    type text NOT NULL CHECK (type IN ('income', 'expense')),
    notes text,
    is_recurring boolean DEFAULT false,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.transactions IS 'Registros de receitas e despesas do usuário.';
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Políticas para `transactions`
DROP POLICY IF EXISTS "Allow users to manage their own transactions" ON public.transactions;
CREATE POLICY "Allow users to manage their own transactions"
  ON public.transactions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- Tabela de Orçamentos
DROP TABLE IF EXISTS public.budgets CASCADE;
CREATE TABLE public.budgets (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    limit_amount real NOT NULL,
    spent_amount real DEFAULT 0 NOT NULL,
    period_start_date date NOT NULL,
    period_end_date date NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.budgets IS 'Orçamentos de gastos por categoria e período.';
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Políticas para `budgets`
DROP POLICY IF EXISTS "Allow users to manage their own budgets" ON public.budgets;
CREATE POLICY "Allow users to manage their own budgets"
  ON public.budgets FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- Tabela de Metas Financeiras
DROP TABLE IF EXISTS public.financial_goals CASCADE;
CREATE TABLE public.financial_goals (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    target_amount real NOT NULL,
    current_amount real DEFAULT 0 NOT NULL,
    deadline_date date,
    icon text,
    status text DEFAULT 'in_progress'::text NOT NULL CHECK (status IN ('in_progress', 'achieved', 'cancelled')),
    notes text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.financial_goals IS 'Metas financeiras dos usuários, como economizar para uma viagem.';
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;

-- Políticas para `financial_goals`
DROP POLICY IF EXISTS "Allow users to manage their own financial goals" ON public.financial_goals;
CREATE POLICY "Allow users to manage their own financial goals"
  ON public.financial_goals FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- Tabela de Lista de Tarefas (Todos)
DROP TABLE IF EXISTS public.todos CASCADE;
CREATE TABLE public.todos (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    description text NOT NULL,
    is_completed boolean DEFAULT false NOT NULL,
    due_date date,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.todos IS 'Lista de tarefas simples para os usuários.';
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Políticas para `todos`
DROP POLICY IF EXISTS "Allow users to manage their own todos" ON public.todos;
CREATE POLICY "Allow users to manage their own todos"
  ON public.todos FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Finaliza a transação
COMMIT;
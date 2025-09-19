
-- ### FLORTUNE DATABASE SCHEMA ###
-- Versão: 2.0
-- Última Atualização: 2024-07-26
--
-- INSTRUÇÕES:
-- 1. Vá para o seu projeto no painel do Supabase.
-- 2. Navegue até o "SQL Editor".
-- 3. Clique em "+ New query".
-- 4. Copie e cole TODO o conteúdo deste arquivo no editor.
-- 5. Clique em "RUN".
--
-- O que este script faz:
-- - Cria a extensão "uuid-ossp" se ela não existir.
-- - Cria o schema "next_auth" necessário para o NextAuth.js Supabase Adapter.
-- - Cria as tabelas do schema "next_auth" (users, sessions, accounts).
-- - Cria a tabela "public.profiles" para armazenar detalhes adicionais do usuário, incluindo senhas para login com credenciais.
-- - Cria as tabelas da aplicação principal (transactions, categories, budgets, financial_goals, todos).
-- - Define as políticas de Row Level Security (RLS) para garantir que os usuários só possam acessar seus próprios dados.
-- - Remove o trigger antigo `handle_new_user_from_next_auth` que foi substituído pela lógica do NextAuth.js Adapter e políticas RLS.

-- =================================================================
-- 1. CONFIGURAÇÃO INICIAL E EXTENSÕES
-- =================================================================
-- Garante que a extensão para gerar UUIDs esteja disponível.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- =================================================================
-- 2. SCHEMA E TABELAS PARA O NEXT-AUTH (AUTH.JS)
-- Adaptado da documentação oficial do Supabase Adapter
-- =================================================================

-- Criação do Schema para o NextAuth.js
CREATE SCHEMA IF NOT EXISTS next_auth;

-- Tabela de Usuários do NextAuth
-- Armazena informações básicas de usuários de todos os provedores.
CREATE TABLE IF NOT EXISTS next_auth.users
(
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    name text,
    email text,
    "emailVerified" timestamp with time zone,
    image text,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_email_key UNIQUE (email)
);

-- Tabela de Contas do NextAuth
-- Armazena contas de provedores OAuth (Google, etc.).
CREATE TABLE IF NOT EXISTS next_auth.accounts
(
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
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
    "userId" uuid,
    CONSTRAINT accounts_pkey PRIMARY KEY (id),
    CONSTRAINT "accounts_provider_providerAccountId_key" UNIQUE (provider, "providerAccountId"),
    CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES next_auth.users(id) ON DELETE CASCADE
);

-- Tabela de Sessões do NextAuth
-- Armazena as sessões ativas dos usuários.
CREATE TABLE IF NOT EXISTS next_auth.sessions
(
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    expires timestamp with time zone NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" uuid,
    CONSTRAINT sessions_pkey PRIMARY KEY (id),
    CONSTRAINT "sessions_sessionToken_key" UNIQUE ("sessionToken"),
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES next_auth.users(id) ON DELETE CASCADE
);

-- Tabela de Tokens de Verificação do NextAuth
-- Usada para fluxos de verificação de email (magic links).
CREATE TABLE IF NOT EXISTS next_auth.verification_tokens
(
    identifier text,
    token text,
    expires timestamp with time zone NOT NULL,
    CONSTRAINT "verification_tokens_token_key" UNIQUE (token),
    CONSTRAINT verification_tokens_pkey PRIMARY KEY (identifier, token)
);


-- =================================================================
-- 3. TABELAS DA APLICAÇÃO (SCHEMA PUBLIC)
-- =================================================================

-- Tabela de Perfis de Usuários (public.profiles)
-- Estende a tabela next_auth.users com informações específicas do Flortune.
-- O 'id' aqui é a chave primária e corresponde ao 'id' de 'next_auth.users'.
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY NOT NULL,
  full_name text,
  display_name text,
  email text NOT NULL UNIQUE,
  hashed_password text, -- Para login com email/senha. Nulo para usuários OAuth.
  phone text,
  cpf_cnpj text UNIQUE,
  rg text,
  avatar_url text,
  account_type text, -- 'pessoa' ou 'empresa'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES next_auth.users(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.profiles IS 'Armazena detalhes do perfil de usuário, estendendo a tabela de autenticação.';
COMMENT ON COLUMN public.profiles.hashed_password IS 'Senha criptografada para login via credenciais. Nulo se o usuário utiliza apenas OAuth.';

-- Tabela de Categorias
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  icon text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, name, type)
);
COMMENT ON TABLE public.categories IS 'Categorias para transações, podendo ser padrão ou criadas pelo usuário.';

-- Tabela de Transações
CREATE TABLE IF NOT EXISTS public.transactions (
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
COMMENT ON TABLE public.transactions IS 'Registros de receitas e despesas do usuário.';

-- Tabela de Orçamentos
CREATE TABLE IF NOT EXISTS public.budgets (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  limit_amount numeric(12, 2) NOT NULL,
  spent_amount numeric(12, 2) NOT NULL DEFAULT 0.00,
  period_start_date date NOT NULL,
  period_end_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, category_id, period_start_date)
);
COMMENT ON TABLE public.budgets IS 'Orçamentos definidos pelo usuário para categorias de despesas.';

-- Tabela de Metas Financeiras
CREATE TABLE IF NOT EXISTS public.financial_goals (
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
COMMENT ON TABLE public.financial_goals IS 'Metas de economia e objetivos financeiros do usuário.';

-- Tabela de Lista de Tarefas (To-Dos)
CREATE TABLE IF NOT EXISTS public.todos (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  description text NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  due_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.todos IS 'Lista de tarefas do usuário.';


-- =================================================================
-- 4. REMOÇÃO DE TRIGGERS ANTIGOS (Cleanup)
-- =================================================================

-- Remove a função e o trigger antigos que criavam perfis, pois o NextAuth Adapter agora gerencia isso.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_from_next_auth;


-- =================================================================
-- 5. POLÍTICAS DE ROW LEVEL SECURITY (RLS)
-- Essencial para a segurança dos dados multi-tenant.
-- =================================================================

-- --- Tabela `public.profiles` ---
-- Habilita RLS na tabela de perfis
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- Permite que usuários leiam seu próprio perfil.
DROP POLICY IF EXISTS "Allow individual user to read their own profile" ON public.profiles;
CREATE POLICY "Allow individual user to read their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);
-- Permite que usuários atualizem seu próprio perfil.
DROP POLICY IF EXISTS "Allow individual user to update their own profile" ON public.profiles;
CREATE POLICY "Allow individual user to update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
-- Permite que a server action de signup (usando a anon key) insira um novo perfil.
-- A validação de dados duplicados é feita na server action antes da inserção.
DROP POLICY IF EXISTS "Allow anon to insert their own profile on signup" ON public.profiles;
CREATE POLICY "Allow anon to insert their own profile on signup"
  ON public.profiles FOR INSERT
  TO anon
  WITH CHECK (true);
-- Permite que a service_role (usada pelo NextAuth Adapter no backend) realize todas as operações.
DROP POLICY IF EXISTS "Allow service_role full access to profiles" ON public.profiles;
CREATE POLICY "Allow service_role full access to profiles"
  ON public.profiles FOR ALL
  TO service_role
  WITH CHECK (true);


-- --- Tabela `public.categories` ---
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow individual user to manage their own categories" ON public.categories;
CREATE POLICY "Allow individual user to manage their own categories"
  ON public.categories FOR ALL
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Allow all authenticated users to read default categories" ON public.categories;
CREATE POLICY "Allow all authenticated users to read default categories"
  ON public.categories FOR SELECT
  TO authenticated
  USING (is_default = true);

-- --- Tabela `public.transactions` ---
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow individual user to manage their own transactions" ON public.transactions;
CREATE POLICY "Allow individual user to manage their own transactions"
  ON public.transactions FOR ALL
  USING (auth.uid() = user_id);

-- --- Tabela `public.budgets` ---
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow individual user to manage their own budgets" ON public.budgets;
CREATE POLICY "Allow individual user to manage their own budgets"
  ON public.budgets FOR ALL
  USING (auth.uid() = user_id);

-- --- Tabela `public.financial_goals` ---
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow individual user to manage their own financial goals" ON public.financial_goals;
CREATE POLICY "Allow individual user to manage their own financial goals"
  ON public.financial_goals FOR ALL
  USING (auth.uid() = user_id);

-- --- Tabela `public.todos` ---
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow individual user to manage their own todos" ON public.todos;
CREATE POLICY "Allow individual user to manage their own todos"
  ON public.todos FOR ALL
  USING (auth.uid() = user_id);

-- =================================================================
-- FIM DO SCRIPT
-- =================================================================

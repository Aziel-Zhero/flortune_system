
-- docs/database_schema.sql

-- PASSO 1: Habilitar a extensão uuid-ossp no schema 'extensions' (se ainda não estiver habilitada)
-- O Supabase geralmente faz isso por padrão, mas para garantir:
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- PASSO 2: Criação do Schema next_auth e suas tabelas (para o SupabaseAdapter)
-- Este schema é gerenciado pelo SupabaseAdapter, mas o definimos aqui para clareza e controle.

CREATE SCHEMA IF NOT EXISTS next_auth;

-- Função para obter o UID do usuário autenticado via NextAuth
CREATE OR REPLACE FUNCTION next_auth.uid() RETURNS uuid AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::uuid;
$$ LANGUAGE sql STABLE;


-- Tabelas do NextAuth Adapter (necessárias para @auth/supabase-adapter)
CREATE TABLE IF NOT EXISTS next_auth.users (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    "emailVerified" TIMESTAMPTZ,
    image TEXT
);

CREATE TABLE IF NOT EXISTS next_auth.accounts (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at BIGINT,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    "userId" uuid REFERENCES next_auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS next_auth.sessions (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    expires TIMESTAMPTZ NOT NULL,
    "sessionToken" TEXT NOT NULL UNIQUE,
    "userId" uuid REFERENCES next_auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS next_auth.verification_tokens (
    identifier TEXT,
    token TEXT UNIQUE,
    expires TIMESTAMPTZ,
    PRIMARY KEY (identifier, token)
);

-- PASSO 3: Criação da Tabela public.profiles e o Trigger de Sincronização

CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES next_auth.users(id) ON DELETE CASCADE, -- Chave estrangeira para next_auth.users.id
    full_name TEXT,
    display_name TEXT,
    email TEXT UNIQUE NOT NULL, -- Garante que o email seja único e não nulo
    hashed_password TEXT,       -- Para login com credenciais
    phone TEXT,
    cpf_cnpj TEXT UNIQUE,       -- Pode ser CPF ou CNPJ, único
    rg TEXT,
    avatar_url TEXT,
    account_type TEXT CHECK (account_type IN ('pessoa', 'empresa')), -- 'pessoa' ou 'empresa'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger para atualizar 'updated_at' na tabela 'profiles'
CREATE OR REPLACE FUNCTION public.handle_profile_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profile_update_timestamp();

-- Função de Trigger para criar um perfil em public.profiles quando um novo usuário é criado em next_auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user_from_next_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- Define um search_path seguro para a função SECURITY DEFINER
  SET search_path = public, extensions;

  INSERT INTO public.profiles (id, email, display_name, full_name, avatar_url, account_type)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.name,  -- Usa o 'name' do NextAuth como 'display_name' inicial
    NEW.name,  -- E também como 'full_name' inicial
    NEW.image, -- Usa a 'image' do NextAuth como 'avatar_url'
    'pessoa'   -- Define 'account_type' como 'pessoa' por padrão para usuários OAuth.
               -- Isso pode ser atualizado pelo usuário posteriormente.
  )
  ON CONFLICT (id) DO NOTHING; -- Se o perfil já existir (ex: criado pela action de signup), não faz nada.
  -- ON CONFLICT (email) DO NOTHING; -- Conflito de email deve ser tratado na lógica da aplicação ou constraint da tabela.
                                  -- A tabela profiles já tem UNIQUE(email).
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que chama a função acima quando um novo usuário é inserido em next_auth.users
DROP TRIGGER IF EXISTS on_next_auth_user_created ON next_auth.users;
CREATE TRIGGER on_next_auth_user_created
  AFTER INSERT ON next_auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_from_next_auth();


-- PASSO 4: RLS (Row Level Security) Policies

-- RLS para public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow authenticated users to read their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = next_auth.uid()); -- Compara com o ID do usuário da sessão NextAuth

CREATE POLICY IF NOT EXISTS "Allow authenticated users to update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = next_auth.uid())
  WITH CHECK (id = next_auth.uid());

-- Para a verificação de email existente na action `signupUser` (que usa anon key):
CREATE POLICY IF NOT EXISTS "Allow anon to select email from profiles for signup check"
  ON public.profiles FOR SELECT
  TO anon -- A chave anônima do Supabase
  USING (true); -- Permite ler todos os emails, mas só selecionamos a coluna email.


-- RLS para outras tabelas
-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow users to manage their own categories"
  ON public.categories FOR ALL
  TO authenticated
  USING (user_id = next_auth.uid())
  WITH CHECK (user_id = next_auth.uid());
CREATE POLICY IF NOT EXISTS "Allow users to read default categories"
  ON public.categories FOR SELECT
  TO authenticated
  USING (is_default = true);
CREATE POLICY IF NOT EXISTS "Allow anon to read default categories"
  ON public.categories FOR SELECT
  TO anon
  USING (is_default = true);


-- Transactions
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow users to manage their own transactions"
  ON public.transactions FOR ALL
  TO authenticated
  USING (user_id = next_auth.uid())
  WITH CHECK (user_id = next_auth.uid());

-- Budgets
CREATE TABLE IF NOT EXISTS public.budgets (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  limit_amount NUMERIC(10, 2) NOT NULL,
  spent_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow users to manage their own budgets"
  ON public.budgets FOR ALL
  TO authenticated
  USING (user_id = next_auth.uid())
  WITH CHECK (user_id = next_auth.uid());

-- Financial Goals
CREATE TABLE IF NOT EXISTS public.financial_goals (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC(10, 2) NOT NULL,
  current_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  deadline_date DATE,
  icon TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'achieved', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow users to manage their own financial goals"
  ON public.financial_goals FOR ALL
  TO authenticated
  USING (user_id = next_auth.uid())
  WITH CHECK (user_id = next_auth.uid());

-- PASSO 5: Conceder permissões necessárias para os roles anon e authenticated
-- O SupabaseAdapter precisa que esses roles tenham permissão de USAGE nos schemas.
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA next_auth TO anon, authenticated, service_role;

-- Permissões de SELECT em tabelas do next_auth para anon e authenticated (conforme necessidade do adapter e callbacks)
GRANT SELECT ON next_auth.users TO anon, authenticated, service_role;
GRANT SELECT ON next_auth.sessions TO anon, authenticated, service_role;
GRANT SELECT ON next_auth.accounts TO anon, authenticated, service_role;
GRANT SELECT ON next_auth.verification_tokens TO anon, authenticated, service_role;

-- Permissões de INSERT, UPDATE, DELETE para service_role (usado pelo adapter)
GRANT INSERT, UPDATE, DELETE ON next_auth.users TO service_role;
GRANT INSERT, UPDATE, DELETE ON next_auth.sessions TO service_role;
GRANT INSERT, UPDATE, DELETE ON next_auth.accounts TO service_role;
GRANT INSERT, UPDATE, DELETE ON next_auth.verification_tokens TO service_role;

-- Permissões para tabelas públicas para o role authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated; -- Usuário gerencia seu perfil
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.budgets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_goals TO authenticated;

-- Permissões para anon (se necessário, ex: ler categorias padrão)
GRANT SELECT ON public.categories TO anon; -- Para anon ler categorias default=true

-- PASSO 6: Queries de Verificação (Opcional, para debug no SQL Editor)
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'next_auth';
SELECT COUNT(*) as next_auth_users_table_exists FROM pg_tables WHERE schemaname = 'next_auth' AND tablename = 'users';
SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email';
SELECT tgname FROM pg_trigger WHERE tgrelid = 'next_auth.users'::regclass; -- Verifica triggers em next_auth.users
SELECT routine_name, routine_schema, routine_type from information_schema.routines where specific_name = 'handle_new_user_from_next_auth'; -- Verifica se a função do trigger existe


SELECT 'Schema script executado. Verifique os resultados das queries de verificação acima.' as script_status;

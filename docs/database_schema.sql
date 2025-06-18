
-- docs/database_schema.sql

-- Habilita a extensão uuid-ossp no schema 'extensions' (se ainda não habilitada)
-- Isso garante que extensions.uuid_generate_v4() esteja disponível.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- Schema para tabelas do NextAuth.js Supabase Adapter
DROP SCHEMA IF EXISTS next_auth CASCADE;
CREATE SCHEMA IF NOT EXISTS next_auth;

-- Tabela next_auth.users (adaptada do SupabaseAdapter)
DROP TABLE IF EXISTS next_auth.users CASCADE;
CREATE TABLE IF NOT EXISTS next_auth.users (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  name text,
  email text UNIQUE,
  "emailVerified" timestamptz, -- Aspas duplas para manter camelCase
  image text
);

-- Tabela next_auth.accounts (adaptada do SupabaseAdapter)
DROP TABLE IF EXISTS next_auth.accounts CASCADE;
CREATE TABLE IF NOT EXISTS next_auth.accounts (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  type text NOT NULL,
  provider text NOT NULL,
  "providerAccountId" text NOT NULL, -- Aspas duplas
  refresh_token text,
  access_token text,
  expires_at bigint,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  "userId" uuid REFERENCES next_auth.users(id) ON DELETE CASCADE, -- Aspas duplas
  UNIQUE (provider, "providerAccountId") -- Aspas duplas
);

-- Tabela next_auth.sessions (adaptada do SupabaseAdapter)
DROP TABLE IF EXISTS next_auth.sessions CASCADE;
CREATE TABLE IF NOT EXISTS next_auth.sessions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  expires timestamptz NOT NULL,
  "sessionToken" text NOT NULL UNIQUE, -- Aspas duplas
  "userId" uuid REFERENCES next_auth.users(id) ON DELETE CASCADE -- Aspas duplas
);

-- Tabela next_auth.verification_tokens (adaptada do SupabaseAdapter)
DROP TABLE IF EXISTS next_auth.verification_tokens CASCADE;
CREATE TABLE IF NOT EXISTS next_auth.verification_tokens (
  identifier text,
  token text NOT NULL UNIQUE,
  expires timestamptz NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- Tabela pública para perfis de usuário, ligada a next_auth.users
DROP TABLE IF EXISTS public.profiles CASCADE;
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES next_auth.users(id) ON DELETE CASCADE, -- Chave primária e estrangeira para next_auth.users.id
  full_name text,
  display_name text,
  email text UNIQUE NOT NULL, -- Deve corresponder ao email em next_auth.users
  hashed_password text,       -- Para login com credenciais
  phone text,
  cpf_cnpj text UNIQUE,
  rg text,
  avatar_url text,
  account_type text CHECK (account_type IN ('pessoa', 'empresa')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Função para obter o UID do usuário da sessão NextAuth
-- Esta função será usada nas políticas RLS
DROP FUNCTION IF EXISTS next_auth.uid() CASCADE;
CREATE OR REPLACE FUNCTION next_auth.uid()
RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid;
$$;

-- Function to copy new user from next_auth.users to public.profiles
DROP FUNCTION IF EXISTS public.handle_new_user_from_next_auth() CASCADE;
CREATE OR REPLACE FUNCTION public.handle_new_user_from_next_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- <<< IMPORTANT for Supabase triggers on auth.users
AS $$
BEGIN
  SET LOCAL search_path = public, extensions; -- MUDANÇA: SET LOCAL search_path aqui dentro

  -- Attempt to insert into public.profiles
  -- Use the id, email, and name from the new user in next_auth.users
  -- Set account_type to 'pessoa' for new users created via NextAuth (OAuth or initial Adapter sync)
  -- The signupUser action will set a specific account_type for credentials signup.
  INSERT INTO public.profiles (id, email, display_name, full_name, avatar_url, account_type)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.name,         -- Use NEW.name for display_name if available from provider
    NEW.name,         -- Use NEW.name for full_name if available from provider
    NEW.image,        -- Use NEW.image for avatar_url if available from provider
    'pessoa'          -- Default for OAuth, can be updated later by user or credentials signup
  )
  ON CONFLICT (id) DO NOTHING; -- If profile with this ID already exists (e.g., created by credentials signup), do nothing.
  -- ON CONFLICT (email) DO NOTHING; -- Consider this if email should also be a conflict target handled here.

  RETURN NEW;
END;
$$;

-- Trigger para chamar handle_new_user_from_next_auth quando um novo usuário é inserido em next_auth.users
DROP TRIGGER IF EXISTS on_next_auth_user_created ON next_auth.users;
CREATE TRIGGER on_next_auth_user_created
  AFTER INSERT ON next_auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_from_next_auth();

-- RLS para public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to read their own profile" ON public.profiles;
CREATE POLICY "Allow authenticated users to read their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = next_auth.uid());

DROP POLICY IF EXISTS "Allow authenticated users to update their own profile" ON public.profiles;
CREATE POLICY "Allow authenticated users to update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = next_auth.uid())
  WITH CHECK (id = next_auth.uid());

-- Política para permitir que a action signupUser (usando anon key) insira novos perfis.
-- A verificação de email duplicado deve ser feita na action ANTES de tentar inserir.
DROP POLICY IF EXISTS "Allow anon to insert into profiles" ON public.profiles;
CREATE POLICY "Allow anon to insert into profiles"
  ON public.profiles FOR INSERT
  TO anon
  WITH CHECK (true); -- A validação de duplicação de email é feita na server action

-- Para a verificação de email existente na action `signupUser` (que usa anon key):
DROP POLICY IF EXISTS "Allow anon to select email from profiles for signup check" ON public.profiles;
CREATE POLICY "Allow anon to select email from profiles for signup check"
  ON public.profiles FOR SELECT
  TO anon
  USING (true); -- Permite ler todos os emails; a action deve selecionar apenas a coluna 'email'.


-- RLS para outras tabelas (exemplo, ajuste conforme necessário)
-- Categories
DROP TABLE IF EXISTS public.categories CASCADE;
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
DROP POLICY IF EXISTS "Allow users to manage their own categories" ON public.categories;
CREATE POLICY "Allow users to manage their own categories"
  ON public.categories FOR ALL
  TO authenticated
  USING (user_id = next_auth.uid())
  WITH CHECK (user_id = next_auth.uid());
DROP POLICY IF EXISTS "Allow users to read default categories" ON public.categories;
CREATE POLICY "Allow users to read default categories"
  ON public.categories FOR SELECT
  TO authenticated
  USING (is_default = true);

-- Transactions
DROP TABLE IF EXISTS public.transactions CASCADE;
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
DROP POLICY IF EXISTS "Allow users to manage their own transactions" ON public.transactions;
CREATE POLICY "Allow users to manage their own transactions"
  ON public.transactions FOR ALL
  TO authenticated
  USING (user_id = next_auth.uid())
  WITH CHECK (user_id = next_auth.uid());

-- Budgets
DROP TABLE IF EXISTS public.budgets CASCADE;
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
DROP POLICY IF EXISTS "Allow users to manage their own budgets" ON public.budgets;
CREATE POLICY "Allow users to manage their own budgets"
  ON public.budgets FOR ALL
  TO authenticated
  USING (user_id = next_auth.uid())
  WITH CHECK (user_id = next_auth.uid());

-- Financial Goals
DROP TABLE IF EXISTS public.financial_goals CASCADE;
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
DROP POLICY IF EXISTS "Allow users to manage their own financial goals" ON public.financial_goals;
CREATE POLICY "Allow users to manage their own financial goals"
  ON public.financial_goals FOR ALL
  TO authenticated
  USING (user_id = next_auth.uid())
  WITH CHECK (user_id = next_auth.uid());


-- Concede permissões ao role anon e authenticated para os schemas
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA next_auth TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role; -- Para uuid_generate_v4

-- Permissões para tabelas do next_auth (o adapter precisa disso)
-- O role service_role já tem muitos privilégios, mas ser explícito não custa.
GRANT ALL ON ALL TABLES IN SCHEMA next_auth TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA next_auth TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA next_auth TO service_role;

-- Permissões para SELECT para anon e authenticated em tabelas do next_auth (se necessário para alguma lógica de cliente)
GRANT SELECT ON next_auth.users TO anon, authenticated;
GRANT SELECT ON next_auth.sessions TO anon, authenticated;


-- Permissões para public.profiles (além do RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO service_role; -- Permitir que service_role gerencie perfis
GRANT SELECT ON public.profiles TO authenticated, anon; -- RLS controlará o que pode ser visto
GRANT UPDATE (full_name, display_name, phone, cpf_cnpj, rg, avatar_url, account_type, updated_at) ON public.profiles TO authenticated; -- Colunas que o usuário pode atualizar em seu próprio perfil
GRANT INSERT ON public.profiles TO anon; -- RLS controlará se a linha pode ser inserida.

-- Permissões para outras tabelas públicas
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.budgets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_goals TO authenticated;

-- Verifica se o schema next_auth foi criado
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'next_auth';

-- Verifica se a tabela next_auth.users foi criada
SELECT COUNT(*) as next_auth_users_table_exists FROM pg_tables WHERE schemaname = 'next_auth' AND tablename = 'users';

-- Verifica se a coluna 'email' existe em 'public.profiles'
SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email';

SELECT 'Schema script executado. Verifique os resultados das queries de verificação acima.' as script_status;
      
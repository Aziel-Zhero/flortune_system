
-- docs/database_schema.sql

-- Habilita a extensão uuid-ossp para gerar UUIDs, se ainda não estiver habilitada.
-- Criando no schema 'extensions' como recomendado pelo Supabase.
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- Schema para NextAuth.js Supabase Adapter
CREATE SCHEMA IF NOT EXISTS next_auth;

-- Função para obter o UID do usuário autenticado (usada em RLS)
-- DROP FUNCTION IF EXISTS next_auth.uid(); -- Removido pois o adapter pode criá-la ou o uso explícito de auth.uid() é melhor.
-- Tentar usar auth.uid() diretamente nas políticas RLS. Se der erro, precisaremos recriar next_auth.uid().

-- Tabela de Usuários do NextAuth (gerenciada pelo SupabaseAdapter)
CREATE TABLE IF NOT EXISTS next_auth.users (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    "emailVerified" TIMESTAMPTZ,
    image TEXT
);

-- Tabela de Sessões do NextAuth
CREATE TABLE IF NOT EXISTS next_auth.sessions (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    expires TIMESTAMPTZ NOT NULL,
    "sessionToken" TEXT NOT NULL UNIQUE,
    "userId" uuid REFERENCES next_auth.users(id) ON DELETE CASCADE
);

-- Tabela de Contas OAuth do NextAuth
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
    "userId" uuid REFERENCES next_auth.users(id) ON DELETE CASCADE,
    UNIQUE (provider, "providerAccountId")
);

-- Tabela de Tokens de Verificação do NextAuth (para login sem senha/email)
CREATE TABLE IF NOT EXISTS next_auth.verification_tokens (
    identifier TEXT,
    token TEXT NOT NULL UNIQUE,
    expires TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (identifier, token)
);

-- Tabela de Perfis de Usuário no schema public (para dados adicionais)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES next_auth.users(id) ON DELETE CASCADE, -- Chave estrangeira para next_auth.users.id
  full_name TEXT,
  display_name TEXT,
  email TEXT UNIQUE NOT NULL, -- Deve ser o mesmo email de next_auth.users
  hashed_password TEXT, -- Para login com credenciais
  phone TEXT,
  cpf_cnpj TEXT UNIQUE,
  rg TEXT,
  avatar_url TEXT,
  account_type TEXT CHECK (account_type IN ('pessoa', 'empresa')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger e Função para sincronizar novos usuários do NextAuth para public.profiles
DROP FUNCTION IF EXISTS public.handle_new_user_from_next_auth();
CREATE OR REPLACE FUNCTION public.handle_new_user_from_next_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com os privilégios do definidor (postgres)
AS $$
BEGIN
  -- Adiciona um SET search_path para garantir que o schema 'extensions' seja visível
  SET search_path = extensions, public;

  INSERT INTO public.profiles (id, email, display_name, full_name, avatar_url, account_type)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.name, -- Nome do NextAuth como display_name inicial
    NEW.name, -- Nome do NextAuth como full_name inicial
    NEW.image, -- Imagem do NextAuth como avatar_url inicial
    'pessoa' -- Define 'pessoa' como padrão para usuários criados via OAuth/NextAuth
             -- Se for cadastro por credencial, a action `signupUser` preenche isso.
  )
  ON CONFLICT (id) DO NOTHING; -- Se o perfil já existir (ex: criado pela action signupUser antes do login com Google), não faz nada.
  -- ON CONFLICT (email) DO NOTHING; -- Pode ser útil se o email for a constraint principal, mas id é mais seguro.
  RETURN NEW;
END;
$$;

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
  USING (id = auth.uid()); -- Usando auth.uid() diretamente

DROP POLICY IF EXISTS "Allow authenticated users to update their own profile" ON public.profiles;
CREATE POLICY "Allow authenticated users to update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Allow anon to select email from profiles for signup check" ON public.profiles;
CREATE POLICY "Allow anon to select email from profiles for signup check"
  ON public.profiles FOR SELECT
  TO anon
  USING (true); -- Permite ler todos os emails para verificação de duplicidade no cadastro.
                -- A action de signup deve apenas selecionar a coluna 'email'.


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

DROP POLICY IF EXISTS "Allow users to manage their own categories" ON public.categories;
CREATE POLICY "Allow users to manage their own categories"
  ON public.categories FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Allow users to read default categories" ON public.categories;
CREATE POLICY "Allow users to read default categories"
  ON public.categories FOR SELECT
  TO authenticated
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

DROP POLICY IF EXISTS "Allow users to manage their own transactions" ON public.transactions;
CREATE POLICY "Allow users to manage their own transactions"
  ON public.transactions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

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

DROP POLICY IF EXISTS "Allow users to manage their own budgets" ON public.budgets;
CREATE POLICY "Allow users to manage their own budgets"
  ON public.budgets FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

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

DROP POLICY IF EXISTS "Allow users to manage their own financial goals" ON public.financial_goals;
CREATE POLICY "Allow users to manage their own financial goals"
  ON public.financial_goals FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Concede permissões de uso aos schemas para os roles padrão do Supabase
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA next_auth TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role; -- Para uuid_generate_v4

-- Permissões para tabelas do next_auth (o adapter e o trigger precisam disso)
-- O role service_role já bypassa RLS, mas para clareza:
GRANT ALL ON TABLE next_auth.users TO service_role;
GRANT ALL ON TABLE next_auth.sessions TO service_role;
GRANT ALL ON TABLE next_auth.accounts TO service_role;
GRANT ALL ON TABLE next_auth.verification_tokens TO service_role;

-- Os roles anon e authenticated não precisam de insert/update/delete direto nessas tabelas.
-- Eles interagem via NextAuth.js. Apenas SELECT pode ser necessário para o Adapter em alguns cenários.
GRANT SELECT ON TABLE next_auth.users TO anon, authenticated;
GRANT SELECT ON TABLE next_auth.sessions TO anon, authenticated;
GRANT SELECT ON TABLE next_auth.accounts TO anon, authenticated;
GRANT SELECT ON TABLE next_auth.verification_tokens TO anon, authenticated;


-- Concede permissões para as tabelas no schema public para o role authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.budgets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.financial_goals TO authenticated;

-- Permite que o role anon selecione da tabela profiles (para a verificação de email no signup)
GRANT SELECT ON TABLE public.profiles TO anon;


-- Verifica se o schema next_auth foi criado
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'next_auth';

-- Verifica se a tabela next_auth.users foi criada
SELECT COUNT(*) as next_auth_users_table_exists FROM pg_tables WHERE schemaname = 'next_auth' AND tablename = 'users';

-- Verifica se a coluna 'email' existe em 'public.profiles'
SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email';

SELECT 'Schema script executado. Verifique os resultados das queries de verificação acima.' as script_status;


-- Habilita a extensão uuid-ossp para gerar UUIDs, se ainda não estiver habilitada.
-- É criada no schema 'extensions' para seguir as melhores práticas do Supabase.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- Cria o schema next_auth se ele não existir. Este schema é usado pelo SupabaseAdapter.
CREATE SCHEMA IF NOT EXISTS next_auth;

-- Concede permissões de uso no schema next_auth para os roles anon e authenticated.
-- Isso permite que eles acessem funções e outros objetos no schema se tiverem permissões específicas.
GRANT USAGE ON SCHEMA next_auth TO anon, authenticated;


-- Tabela next_auth.users: Armazena os usuários gerenciados pelo NextAuth.
DROP TABLE IF EXISTS next_auth.users CASCADE;
CREATE TABLE IF NOT EXISTS next_auth.users (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    name text,
    email text,
    "emailVerified" timestamp with time zone,
    image text,
    CONSTRAINT users_email_unique UNIQUE (email)
);
COMMENT ON TABLE next_auth.users IS 'Tabela de usuários gerenciada pelo NextAuth.js e SupabaseAdapter.';

-- Tabela next_auth.accounts: Usada para vincular contas de provedores OAuth (Google, GitHub, etc.).
DROP TABLE IF EXISTS next_auth.accounts CASCADE;
CREATE TABLE IF NOT EXISTS next_auth.accounts (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
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
    "userId" uuid REFERENCES next_auth.users(id) ON DELETE CASCADE,
    CONSTRAINT accounts_provider_providerAccountId_unique UNIQUE (provider, "providerAccountId")
);
COMMENT ON TABLE next_auth.accounts IS 'Armazena contas OAuth vinculadas aos usuários do NextAuth.';

-- Tabela next_auth.sessions: Gerencia as sessões de login dos usuários.
DROP TABLE IF EXISTS next_auth.sessions CASCADE;
CREATE TABLE IF NOT EXISTS next_auth.sessions (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    expires timestamp with time zone NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" uuid REFERENCES next_auth.users(id) ON DELETE CASCADE,
    CONSTRAINT sessions_sessionToken_unique UNIQUE ("sessionToken")
);
COMMENT ON TABLE next_auth.sessions IS 'Armazena tokens de sessão para usuários autenticados pelo NextAuth.';

-- Tabela next_auth.verification_tokens: Usada para fluxos de verificação de email ou login sem senha.
DROP TABLE IF EXISTS next_auth.verification_tokens;
CREATE TABLE IF NOT EXISTS next_auth.verification_tokens (
    identifier text,
    token text,
    expires timestamp with time zone NOT NULL,
    CONSTRAINT verification_tokens_token_unique UNIQUE (token),
    CONSTRAINT verification_tokens_identifier_token_unique UNIQUE (identifier, token)
);
COMMENT ON TABLE next_auth.verification_tokens IS 'Usada para tokens de verificação (ex: login por email sem senha).';


-- Tabela public.profiles: Tabela customizada para armazenar informações adicionais do perfil do usuário.
-- O 'id' desta tabela DEVE corresponder ao 'id' da tabela 'next_auth.users'.
DROP TABLE IF EXISTS public.profiles CASCADE;
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY, -- FK para next_auth.users.id
  full_name TEXT,
  display_name TEXT,
  email TEXT NOT NULL UNIQUE, -- Consistência com next_auth.users.email
  hashed_password TEXT,       -- Para login com credenciais
  phone TEXT,
  cpf_cnpj TEXT UNIQUE,       -- CPF ou CNPJ, deve ser único
  rg TEXT,
  avatar_url TEXT,
  account_type TEXT CHECK (account_type IN ('pessoa', 'empresa')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES next_auth.users(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.profiles IS 'Armazena detalhes adicionais do perfil do usuário, sincronizados com next_auth.users.';

-- Função utilitária para obter o ID do usuário autenticado (do token JWT do NextAuth).
DROP FUNCTION IF EXISTS next_auth.uid();
CREATE OR REPLACE FUNCTION next_auth.uid()
RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::uuid;
$$;
COMMENT ON FUNCTION next_auth.uid() IS 'Retorna o ID do usuário (sub) do token JWT da sessão NextAuth atual.';


-- Trigger para sincronizar novos usuários de next_auth.users para public.profiles.
-- Quando um novo usuário é criado em next_auth.users (pelo SupabaseAdapter),
-- este trigger cria um registro correspondente em public.profiles.
DROP TRIGGER IF EXISTS on_new_next_auth_user ON next_auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_from_next_auth();

CREATE OR REPLACE FUNCTION public.handle_new_user_from_next_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com os privilégios do definidor da função (geralmente 'postgres')
SET search_path = public, extensions, next_auth; -- Garante que os schemas corretos estão no search_path
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, full_name, avatar_url, account_type, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.name, -- Usa o 'name' do NextAuth como 'display_name' inicial
    NEW.name, -- E também como 'full_name' inicial
    NEW.image, -- Usa o 'image' do NextAuth como 'avatar_url'
    CASE
        WHEN NEW.email LIKE '%@example.com' THEN 'pessoa' -- Lógica de exemplo, pode ser ajustada
        ELSE 'pessoa' -- Default para 'pessoa' se não for especificado de outra forma
    END,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET -- Se o perfil já existir (ex: criado pela action signupUser), atualiza
    email = EXCLUDED.email, -- Mantém o email do NextAuth
    -- Não atualiza display_name, full_name ou avatar_url aqui para não sobrescrever dados que o usuário pode ter editado em `profiles`
    -- A menos que sejam nulos em `profiles` e preenchidos em `next_auth.users`
    display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
    updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_next_auth_user
  AFTER INSERT ON next_auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_from_next_auth();
COMMENT ON TRIGGER on_new_next_auth_user ON next_auth.users IS 'Sincroniza novos usuários do NextAuth para a tabela public.profiles.';


-- RLS para public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to read their own profile" ON public.profiles;
CREATE POLICY "Allow authenticated users to read their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = next_auth.uid()); -- Compara com o ID do usuário da sessão NextAuth

DROP POLICY IF EXISTS "Allow authenticated users to update their own profile" ON public.profiles;
CREATE POLICY "Allow authenticated users to update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = next_auth.uid())
  WITH CHECK (id = next_auth.uid());

-- Política para permitir que a action signupUser (usando anon key) insira um novo perfil.
-- A action já deve verificar a unicidade do email.
-- A tabela já tem constraints UNIQUE para id e email.
DROP POLICY IF EXISTS "Allow anon to insert their own profile" ON public.profiles;
CREATE POLICY "Allow anon to insert their own profile"
  ON public.profiles FOR INSERT
  TO anon
  WITH CHECK (true); -- Mantendo simples, pois a action e constraints de tabela fazem o trabalho pesado.

-- Para a verificação de email existente na action `signupUser` (que usa anon key):
DROP POLICY IF EXISTS "Allow anon to select email from profiles for signup check" ON public.profiles;
CREATE POLICY "Allow anon to select email from profiles for signup check"
  ON public.profiles FOR SELECT
  TO anon -- A chave anônima do Supabase
  USING (true); -- Permite ler todos os emails, mas só selecionamos a coluna email.


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


-- Concede permissões de uso nos schemas para os roles anon e authenticated
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT USAGE ON SCHEMA next_auth TO anon, authenticated;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated; -- Para a função uuid_generate_v4

-- Permite que anon e authenticated chamem a função uuid_generate_v4
GRANT EXECUTE ON FUNCTION extensions.uuid_generate_v4() TO anon, authenticated;

-- Permissões para tabelas do next_auth (o adapter precisa disso)
-- O role service_role (usado pelo adapter) já tem privilégios e bypassa RLS.
-- As permissões para anon/authenticated aqui são para cenários onde eles podem precisar ler (raro).
GRANT SELECT ON next_auth.users TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON next_auth.users TO service_role;

GRANT SELECT ON next_auth.sessions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON next_auth.sessions TO service_role;

GRANT SELECT ON next_auth.accounts TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON next_auth.accounts TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON next_auth.verification_tokens TO service_role;
GRANT SELECT ON next_auth.verification_tokens TO anon, authenticated;


-- Queries de verificação final
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'next_auth';
SELECT COUNT(*) as next_auth_users_table_exists FROM pg_tables WHERE schemaname = 'next_auth' AND tablename = 'users';
SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email';

SELECT 'Schema script executado. Verifique os resultados das queries de verificação acima.' as script_status;


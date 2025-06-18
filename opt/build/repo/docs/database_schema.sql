
-- Esquema: next_auth (Gerenciado pelo Supabase Adapter para NextAuth.js)
-- Este schema é crucial para o funcionamento do @auth/supabase-adapter.

-- PASSO 1: Habilitar a extensão pgcrypto se ainda não estiver habilitada (para gen_random_uuid())
-- O Supabase geralmente já tem isso habilitado. uuid-ossp também é comum.
-- Vamos usar extensions.uuid_generate_v4() que é o padrão do Supabase.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- PASSO 2: Criar o schema next_auth SE NÃO EXISTIR
CREATE SCHEMA IF NOT EXISTS next_auth;

-- Concede permissão de uso do schema 'extensions' para os roles relevantes
-- Isso garante que `extensions.uuid_generate_v4()` possa ser chamado.
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;


-- PASSO 3: Criar as tabelas dentro do schema next_auth SE NÃO EXISTIREM

CREATE TABLE IF NOT EXISTS next_auth.users (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name text NULL,
  email text NULL,
  "emailVerified" timestamptz NULL,
  image text NULL,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT email_unique UNIQUE (email)
);

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

CREATE TABLE IF NOT EXISTS next_auth.sessions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  expires timestamptz NOT NULL,
  "sessionToken" text NOT NULL,
  "userId" uuid NULL,
  CONSTRAINT sessions_pkey PRIMARY KEY (id),
  CONSTRAINT sessiontoken_unique UNIQUE ("sessionToken"),
  CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES next_auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS next_auth.verification_tokens (
  identifier text NULL,
  token text NOT NULL,
  expires timestamptz NOT NULL,
  CONSTRAINT verification_tokens_pkey PRIMARY KEY (token),
  CONSTRAINT token_identifier_unique UNIQUE (token, identifier)
);

-- PASSO 4: Criar a tabela public.profiles
-- REMOVIDA A CHAVE ESTRANGEIRA DIRETA de profiles.id para next_auth.users.id
-- A ligação será por CONVENÇÃO (mesmo ID) e gerenciada pelo trigger.
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY, -- Será o mesmo ID de next_auth.users.id
  full_name TEXT,
  display_name TEXT,
  email TEXT NOT NULL UNIQUE, -- Manter email aqui para referência e busca rápida
  hashed_password TEXT,       -- Para login por credenciais
  phone TEXT,
  cpf_cnpj TEXT UNIQUE,
  rg TEXT,
  avatar_url TEXT,
  account_type TEXT CHECK (account_type IN ('pessoa', 'empresa')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PASSO 5: Função de gatilho para sincronizar dados de next_auth.users para public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user_from_next_auth()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
BEGIN
  SET LOCAL search_path = 'public', 'extensions'; -- Garante que os schemas corretos sejam visíveis

  -- Insere ou atualiza o perfil público.
  -- Se o perfil foi criado primeiro pela action signupUser, esta operação irá ATUALIZAR
  -- os campos que podem vir de um provedor OAuth (email, display_name, avatar_url).
  -- Campos como hashed_password, full_name, cpf_cnpj, account_type específicos do signup por credenciais
  -- NÃO serão sobrescritos se já existirem e não vierem de NEW (next_auth.users).
  INSERT INTO public.profiles (id, email, display_name, avatar_url, account_type, created_at, updated_at)
  VALUES (
    NEW.id,                                      -- id from next_auth.users
    NEW.email,                                   -- email from next_auth.users
    COALESCE(NEW.name, SPLIT_PART(NEW.email, '@', 1)), -- display_name de next_auth.users.name ou derivado do email
    NEW.image,                                   -- avatar_url de next_auth.users.image
    'pessoa',                                    -- account_type padrão para usuários criados via trigger (tipicamente OAuth)
    NOW(),                                       -- created_at
    NOW()                                        -- updated_at
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,                      -- Sincroniza email (deve ser o mesmo)
    -- Atualiza display_name se EXCLUDED.display_name (de NEW.name) for fornecido, caso contrário, mantém o existente.
    display_name = COALESCE(EXCLUDED.display_name, public.profiles.display_name),
    -- Atualiza avatar_url se EXCLUDED.avatar_url (de NEW.image) for fornecido, caso contrário, mantém o existente.
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    -- Não sobrescreve account_type se já foi definido (ex: por signupUser). Se for nulo, usa o default do EXCLUDED.
    account_type = COALESCE(public.profiles.account_type, EXCLUDED.account_type),
    updated_at = NOW()
  WHERE public.profiles.id = EXCLUDED.id;

  RAISE NOTICE 'Trigger handle_new_user_from_next_auth executado para user ID: %. Email: %', NEW.id, NEW.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASSO 6: Criar o gatilho na tabela next_auth.users
DROP TRIGGER IF EXISTS on_next_auth_user_created ON next_auth.users;
CREATE TRIGGER on_next_auth_user_created
  AFTER INSERT ON next_auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_from_next_auth();

-- PASSO 7: Função auxiliar next_auth.uid() para RLS (se não existir)
CREATE OR REPLACE FUNCTION next_auth.uid()
RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid;
$$;

-- PASSO 8: Row Level Security (RLS)
-- Habilitar RLS e FORÇAR para todas as tabelas que contêm dados do usuário.

-- RLS para public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
FORCE ROW LEVEL SECURITY public.profiles;

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

-- Permite que a role 'anon' (usada pela action 'signupUser' com a supabase anon key) insira novos perfis.
DROP POLICY IF EXISTS "Allow anon to insert new profiles" ON public.profiles;
CREATE POLICY "Allow anon to insert new profiles"
  ON public.profiles FOR INSERT
  TO anon
  WITH CHECK (true); -- A validação de dados (ex: email único) é feita na action e por constraints da tabela.

-- Permite que a action 'signupUser' (usando anon key) verifique se um email já existe.
DROP POLICY IF EXISTS "Allow anon to select email from profiles for signup check" ON public.profiles;
CREATE POLICY "Allow anon to select email from profiles for signup check"
  ON public.profiles FOR SELECT
  TO anon
  USING (true); -- Esta política permite ler todos os perfis para o role anon se apenas 'email' for selecionado.
                 -- A query na action `signupUser` deve ser específica: .select('email').eq('email', email)

-- RLS para outras tabelas (categories, transactions, budgets, financial_goals)

-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE, -- Referencia public.profiles
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
FORCE ROW LEVEL SECURITY public.categories;
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
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- Referencia public.profiles
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
FORCE ROW LEVEL SECURITY public.transactions;
DROP POLICY IF EXISTS "Allow users to manage their own transactions" ON public.transactions;
CREATE POLICY "Allow users to manage their own transactions"
  ON public.transactions FOR ALL
  TO authenticated
  USING (user_id = next_auth.uid())
  WITH CHECK (user_id = next_auth.uid());

-- Budgets
CREATE TABLE IF NOT EXISTS public.budgets (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- Referencia public.profiles
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  limit_amount NUMERIC(10, 2) NOT NULL,
  spent_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
FORCE ROW LEVEL SECURITY public.budgets;
DROP POLICY IF EXISTS "Allow users to manage their own budgets" ON public.budgets;
CREATE POLICY "Allow users to manage their own budgets"
  ON public.budgets FOR ALL
  TO authenticated
  USING (user_id = next_auth.uid())
  WITH CHECK (user_id = next_auth.uid());

-- Financial Goals
CREATE TABLE IF NOT EXISTS public.financial_goals (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- Referencia public.profiles
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
FORCE ROW LEVEL SECURITY public.financial_goals;
DROP POLICY IF EXISTS "Allow users to manage their own financial goals" ON public.financial_goals;
CREATE POLICY "Allow users to manage their own financial goals"
  ON public.financial_goals FOR ALL
  TO authenticated
  USING (user_id = next_auth.uid())
  WITH CHECK (user_id = next_auth.uid());


-- PASSO 9: Conceder permissões
-- Concede permissões aos roles anon e authenticated para os schemas relevantes
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA next_auth TO anon, authenticated, service_role;

-- Permissões para tabelas do next_auth (o adapter precisa disso)
-- O role 'service_role' é usado pelo Supabase Adapter.
-- O role 'postgres' (o superusuário que cria as tabelas) implicitamente tem todas as permissões.
GRANT ALL ON ALL TABLES IN SCHEMA next_auth TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA next_auth TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA next_auth TO service_role;

-- Permite que 'authenticated' e 'anon' leiam de next_auth.users para o adapter funcionar
-- (Ex: adapter pode precisar ler user para popular a sessão)
GRANT SELECT ON next_auth.users TO authenticated, anon;
GRANT SELECT ON next_auth.sessions TO authenticated, anon;
GRANT SELECT ON next_auth.accounts TO authenticated, anon;

-- Permissões para tabelas públicas (profiles, categories, etc.)
-- A RLS cuidará do acesso a nível de linha. Aqui damos permissões básicas a nível de tabela.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated;
GRANT SELECT, INSERT ON TABLE public.profiles TO anon; -- Anon pode ler (para checar email) e inserir (para signup)

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.categories TO authenticated;
GRANT SELECT ON TABLE public.categories TO anon; -- Anon pode ler categorias default

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.budgets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.financial_goals TO authenticated;


-- PASSO 10: Queries de Verificação (Opcional, mas útil)
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'next_auth';
SELECT COUNT(*) as next_auth_users_table_exists FROM pg_tables WHERE schemaname = 'next_auth' AND tablename = 'users';
SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email';
SELECT conname, confrelid::regclass, conrelid::regclass FROM pg_constraint WHERE conname = 'profiles_id_fkey'; -- Deve retornar 0 linhas agora

SELECT tgname FROM pg_trigger WHERE tgfoid = 'public.handle_new_user_from_next_auth'::regproc; -- Verifica se o trigger existe

SELECT 'Schema script executado. Verifique os resultados das queries de verificação acima.' as script_status;


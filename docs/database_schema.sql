
-- Habilitar a extensão pgcrypto se ainda não estiver habilitada (necessária para uuid_generate_v4())
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA public;

-- =================================================================
-- SCHEMA: next_auth (para o SupabaseAdapter do NextAuth.js)
-- Este schema e suas tabelas são gerenciados pelo SupabaseAdapter.
-- Referência: https://authjs.dev/reference/adapter/supabase
-- =================================================================
CREATE SCHEMA IF NOT EXISTS next_auth;

GRANT USAGE ON SCHEMA next_auth TO service_role;
GRANT ALL ON SCHEMA next_auth TO postgres;

-- Tabela de Usuários do NextAuth
CREATE TABLE IF NOT EXISTS next_auth.users
(
    id uuid NOT NULL DEFAULT public.uuid_generate_v4(),
    name text,
    email text,
    "emailVerified" timestamp with time zone,
    image text,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT email_unique UNIQUE (email)
);
GRANT ALL ON TABLE next_auth.users TO postgres;
GRANT ALL ON TABLE next_auth.users TO service_role;


-- Função UID do NextAuth (para RLS)
CREATE OR REPLACE FUNCTION next_auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select
    coalesce(
        nullif(current_setting('request.jwt.claim.sub', true), ''),
        (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
    )::uuid
$$;
GRANT EXECUTE ON FUNCTION next_auth.uid() TO service_role;
GRANT EXECUTE ON FUNCTION next_auth.uid() TO authenticated;
GRANT EXECUTE ON FUNCTION next_auth.uid() TO anon;


-- Tabela de Sessões do NextAuth
CREATE TABLE IF NOT EXISTS next_auth.sessions
(
    id uuid NOT NULL DEFAULT public.uuid_generate_v4(),
    expires timestamp with time zone NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" uuid,
    CONSTRAINT sessions_pkey PRIMARY KEY (id),
    CONSTRAINT sessionToken_unique UNIQUE ("sessionToken"),
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES next_auth.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);
GRANT ALL ON TABLE next_auth.sessions TO postgres;
GRANT ALL ON TABLE next_auth.sessions TO service_role;


-- Tabela de Contas OAuth do NextAuth
CREATE TABLE IF NOT EXISTS next_auth.accounts
(
    id uuid NOT NULL DEFAULT public.uuid_generate_v4(),
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
    oauth_token_secret text,
    oauth_token text,
    "userId" uuid,
    CONSTRAINT accounts_pkey PRIMARY KEY (id),
    CONSTRAINT provider_unique UNIQUE (provider, "providerAccountId"),
    CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES next_auth.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);
GRANT ALL ON TABLE next_auth.accounts TO postgres;
GRANT ALL ON TABLE next_auth.accounts TO service_role;


-- Tabela de Tokens de Verificação do NextAuth (para login por email mágico, se usado)
CREATE TABLE IF NOT EXISTS next_auth.verification_tokens
(
    identifier text,
    token text,
    expires timestamp with time zone NOT NULL,
    CONSTRAINT verification_tokens_pkey PRIMARY KEY (token),
    CONSTRAINT token_unique UNIQUE (token),
    CONSTRAINT token_identifier_unique UNIQUE (token, identifier)
);
GRANT ALL ON TABLE next_auth.verification_tokens TO postgres;
GRANT ALL ON TABLE next_auth.verification_tokens TO service_role;


-- =================================================================
-- SCHEMA: public (para as tabelas da sua aplicação)
-- =================================================================

-- Tabela de Perfis de Usuário (Flortune)
-- Esta tabela armazena informações adicionais do usuário e a senha hasheada para login por credenciais.
-- O 'id' aqui DEVE corresponder ao 'id' da tabela next_auth.users.
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL PRIMARY KEY, -- FK para next_auth.users.id
    full_name text,
    display_name text,
    email text NOT NULL UNIQUE, -- Redundante mas útil para queries diretas e consistência
    hashed_password text NOT NULL, -- Para login com credenciais
    phone text,
    cpf_cnpj text UNIQUE,
    rg text,
    avatar_url text,
    account_type text CHECK (account_type IN ('pessoa', 'empresa')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_user_id FOREIGN KEY (id) REFERENCES next_auth.users(id) ON DELETE CASCADE
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política de RLS para profiles:
-- 1. Permite que usuários anônimos criem seus perfis (necessário para o signup).
CREATE POLICY "Allow anon to insert profiles"
ON public.profiles
FOR INSERT
TO anon
WITH CHECK (true);

-- 2. Permite que usuários autenticados leiam e atualizem SEU PRÓPRIO perfil.
CREATE POLICY "Allow authenticated users to manage their own profile"
ON public.profiles
FOR ALL
TO authenticated
USING (next_auth.uid() = id)
WITH CHECK (next_auth.uid() = id);

-- 3. (Opcional, para administradores) Permite que service_role acesse tudo.
-- CREATE POLICY "Allow service_role to manage all profiles"
-- ON public.profiles
-- FOR ALL
-- TO service_role
-- USING (true)
-- WITH CHECK (true);

GRANT ALL ON TABLE public.profiles TO postgres;
GRANT ALL ON TABLE public.profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO anon; -- Ajustado para ser mais permissivo temporariamente durante o signup
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated;


-- Tabela de Categorias
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid NOT NULL DEFAULT public.uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE, -- Nulo para categorias padrão
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('income', 'expense')),
    icon text,
    is_default boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to default categories"
ON public.categories
FOR SELECT
TO anon, authenticated
USING (is_default = true);

CREATE POLICY "Allow users to manage their own categories"
ON public.categories
FOR ALL
TO authenticated
USING (user_id = next_auth.uid())
WITH CHECK (user_id = next_auth.uid());

GRANT ALL ON TABLE public.categories TO postgres;
GRANT ALL ON TABLE public.categories TO service_role;
GRANT SELECT ON TABLE public.categories TO anon;
GRANT ALL ON TABLE public.categories TO authenticated;


-- Tabela de Transações
CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid NOT NULL DEFAULT public.uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    description text NOT NULL,
    amount numeric(12, 2) NOT NULL,
    date date NOT NULL,
    type text NOT NULL CHECK (type IN ('income', 'expense')),
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to manage their own transactions"
ON public.transactions
FOR ALL
TO authenticated
USING (user_id = next_auth.uid())
WITH CHECK (user_id = next_auth.uid());

GRANT ALL ON TABLE public.transactions TO postgres;
GRANT ALL ON TABLE public.transactions TO service_role;
GRANT ALL ON TABLE public.transactions TO authenticated;


-- Tabela de Orçamentos
CREATE TABLE IF NOT EXISTS public.budgets (
    id uuid NOT NULL DEFAULT public.uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    limit_amount numeric(12, 2) NOT NULL,
    spent_amount numeric(12, 2) NOT NULL DEFAULT 0.00,
    period_start_date date NOT NULL,
    period_end_date date NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_category_period UNIQUE (user_id, category_id, period_start_date)
);
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to manage their own budgets"
ON public.budgets
FOR ALL
TO authenticated
USING (user_id = next_auth.uid())
WITH CHECK (user_id = next_auth.uid());

GRANT ALL ON TABLE public.budgets TO postgres;
GRANT ALL ON TABLE public.budgets TO service_role;
GRANT ALL ON TABLE public.budgets TO authenticated;


-- Tabela de Metas Financeiras
CREATE TABLE IF NOT EXISTS public.financial_goals (
    id uuid NOT NULL DEFAULT public.uuid_generate_v4() PRIMARY KEY,
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
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to manage their own financial goals"
ON public.financial_goals
FOR ALL
TO authenticated
USING (user_id = next_auth.uid())
WITH CHECK (user_id = next_auth.uid());

GRANT ALL ON TABLE public.financial_goals TO postgres;
GRANT ALL ON TABLE public.financial_goals TO service_role;
GRANT ALL ON TABLE public.financial_goals TO authenticated;

-- Trigger para criar um perfil em public.profiles quando um usuário é criado em next_auth.users
-- Isso é crucial para OAuth (ex: Google login) e também para garantir que o ID seja o mesmo.
CREATE OR REPLACE FUNCTION public.handle_new_user_from_next_auth()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, full_name, avatar_url, hashed_password, account_type)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.name, -- SupabaseAdapter mapeia 'name' do Google para 'name' aqui
    NEW.name, -- Pode ser o mesmo inicialmente
    NEW.image, -- SupabaseAdapter mapeia 'picture' do Google para 'image' aqui
    md5(random()::text || clock_timestamp()::text)::uuid::text, -- Placeholder para hashed_password, já que OAuth não fornece
    'pessoa' -- Default account type, pode ser atualizado depois
  )
  ON CONFLICT (id) DO NOTHING; -- Não faz nada se o perfil já existir (ex: criado por credenciais primeiro)
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_next_auth_user_created
  AFTER INSERT ON next_auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_from_next_auth();
  
-- Função para atualizar `updated_at` automaticamente
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger às tabelas
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_budgets_updated_at
BEFORE UPDATE ON public.budgets
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_financial_goals_updated_at
BEFORE UPDATE ON public.financial_goals
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


-- Verificações finais após executar o script completo
SELECT 'Script SQL executado. Verificações abaixo:' as script_status;

-- 1. Verificar se o schema next_auth foi criado
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'next_auth';

-- 2. Verificar se a tabela next_auth.users existe e contar linhas (deve ser 0 se acabou de criar)
SELECT COUNT(*) as next_auth_users_count 
FROM pg_tables 
WHERE schemaname = 'next_auth' AND tablename = 'users';

-- 3. Verificar se a tabela public.profiles existe e a coluna 'email' está presente
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email';

SELECT 'Fim das verificações.' as script_end_status;

    

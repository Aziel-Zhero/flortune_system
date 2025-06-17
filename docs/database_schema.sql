
-- Habilita a extensão pgcrypto se ainda não estiver habilitada (necessária para uuid_generate_v4())
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA public;

-- Remove as RLS policies antigas da tabela profiles se existirem, para evitar conflitos
DROP POLICY IF EXISTS "Allow anon read access" ON public.profiles;
DROP POLICY IF EXISTS "Allow individual read access" ON public.profiles;
DROP POLICY IF EXISTS "Allow individual update access" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated user to insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;

-- Remove o trigger antigo da tabela profiles se existir
DROP TRIGGER IF EXISTS sync_public_profiles_from_auth_users ON auth.users;
DROP FUNCTION IF EXISTS public.sync_profile_from_auth_user();

-- Remove a tabela profiles existente para recriá-la com a nova estrutura
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Recria a tabela public.profiles para detalhes customizados do usuário e senha hasheada
CREATE TABLE public.profiles (
    id uuid NOT NULL DEFAULT public.uuid_generate_v4() PRIMARY KEY,
    full_name text,
    display_name text,
    email text NOT NULL UNIQUE,
    hashed_password text NOT NULL,
    phone text,
    cpf_cnpj text UNIQUE,
    rg text,
    avatar_url text,
    account_type text CHECK (account_type IN ('pessoa', 'empresa')),
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Permissões bem abertas para public.profiles (temporário para debugging, refinar depois)
-- GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;
-- Permitir que anon (usuários não logados) insiram na tabela profiles (para cadastro)
CREATE POLICY "Allow anon to insert profiles" ON public.profiles FOR INSERT TO anon WITH CHECK (true);
-- Permitir que usuários autenticados leiam seus próprios perfis
CREATE POLICY "Allow authenticated users to read their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
-- Permitir que usuários autenticados atualizem seus próprios perfis
CREATE POLICY "Allow authenticated users to update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);


-- Schema e tabelas para o SupabaseAdapter do NextAuth.js
-- Fonte: Documentação do @auth/supabase-adapter

CREATE SCHEMA IF NOT EXISTS next_auth;

GRANT USAGE ON SCHEMA next_auth TO service_role, anon, authenticated;
GRANT ALL ON SCHEMA next_auth TO postgres; -- 'postgres' é o superusuário do banco

-- Tabela next_auth.users
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
ALTER TABLE next_auth.users ENABLE ROW LEVEL SECURITY; -- Geralmente o adapter gerencia isso com service_role, mas por via das dúvidas.
GRANT ALL ON TABLE next_auth.users TO postgres;
GRANT ALL ON TABLE next_auth.users TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE next_auth.users TO anon, authenticated;


-- Função next_auth.uid() (usada em RLS policies se você criar tabelas públicas vinculadas)
CREATE OR REPLACE FUNCTION next_auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select
  	coalesce(
		nullif(current_setting('request.jwt.claim.sub', true), ''),
		(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
	)::uuid
$$;

-- Tabela next_auth.sessions
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
ALTER TABLE next_auth.sessions ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE next_auth.sessions TO postgres;
GRANT ALL ON TABLE next_auth.sessions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE next_auth.sessions TO anon, authenticated;


-- Tabela next_auth.accounts
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
    CONSTRAINT provider_account_unique UNIQUE (provider, "providerAccountId"), -- Nome da constraint ajustado
    CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES next_auth.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);
ALTER TABLE next_auth.accounts ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE next_auth.accounts TO postgres;
GRANT ALL ON TABLE next_auth.accounts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE next_auth.accounts TO anon, authenticated;


-- Tabela next_auth.verification_tokens
CREATE TABLE IF NOT EXISTS next_auth.verification_tokens
(
    identifier text,
    token text,
    expires timestamp with time zone NOT NULL,
    CONSTRAINT verification_tokens_pkey PRIMARY KEY (token, identifier), -- Chave primária composta
    CONSTRAINT token_v_unique UNIQUE (token) -- Nome da constraint ajustado
    -- A constraint token_identifier_unique é redundante se (token, identifier) é PK
);
ALTER TABLE next_auth.verification_tokens ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE next_auth.verification_tokens TO postgres;
GRANT ALL ON TABLE next_auth.verification_tokens TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE next_auth.verification_tokens TO anon, authenticated;


-- Configurações de RLS para outras tabelas (categories, transactions, budgets, financial_goals)
-- Elas permanecerão como estavam, mas as políticas precisarão usar auth.uid() e
-- o cliente Supabase precisará ser configurado com o supabaseAccessToken da sessão NextAuth.

-- Tabela categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to default categories" ON public.categories;
CREATE POLICY "Allow public read access to default categories" ON public.categories FOR SELECT TO anon, authenticated USING (is_default = true);
DROP POLICY IF EXISTS "Allow individual read access to own categories" ON public.categories;
CREATE POLICY "Allow individual read access to own categories" ON public.categories FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Allow individual CRUD access to own categories" ON public.categories;
CREATE POLICY "Allow individual CRUD access to own categories" ON public.categories FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND is_default = false);

-- Tabela transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow individual CRUD access to own transactions" ON public.transactions;
CREATE POLICY "Allow individual CRUD access to own transactions" ON public.transactions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Tabela budgets
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow individual CRUD access to own budgets" ON public.budgets;
CREATE POLICY "Allow individual CRUD access to own budgets" ON public.budgets FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Tabela financial_goals
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow individual CRUD access to own financial_goals" ON public.financial_goals;
CREATE POLICY "Allow individual CRUD access to own financial_goals" ON public.financial_goals FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- Função para atualizar 'updated_at'
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para 'updated_at' em public.profiles
DROP TRIGGER IF EXISTS set_timestamp_profiles ON public.profiles;
CREATE TRIGGER set_timestamp_profiles
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- (Adicionar triggers similares para categories, transactions, budgets, financial_goals se ainda não existirem ou se foram removidos)
-- Exemplo para categories:
DROP TRIGGER IF EXISTS set_timestamp_categories ON public.categories;
CREATE TRIGGER set_timestamp_categories
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_timestamp_transactions ON public.transactions;
CREATE TRIGGER set_timestamp_transactions
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_timestamp_budgets ON public.budgets;
CREATE TRIGGER set_timestamp_budgets
BEFORE UPDATE ON public.budgets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_timestamp_financial_goals ON public.financial_goals;
CREATE TRIGGER set_timestamp_financial_goals
BEFORE UPDATE ON public.financial_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Expor o schema 'next_auth' na API do Supabase (deve ser feito nas configurações do projeto Supabase também)
-- Configurações > API > Schema (em "Exposed schemas", adicionar 'next_auth')

COMMENT ON COLUMN public.profiles.id IS 'Chave primária UUID, gerada automaticamente.';
COMMENT ON COLUMN public.profiles.email IS 'Email do usuário, deve ser único e não nulo.';
COMMENT ON COLUMN public.profiles.hashed_password IS 'Senha do usuário após hashing (bcrypt), não nula.';
COMMENT ON COLUMN public.profiles.account_type IS 'Tipo de conta: ''pessoa'' ou ''empresa''.';

-- Adicionar categorias padrão (se ainda não existirem ou se a tabela foi recriada)
INSERT INTO public.categories (user_id, name, type, icon, is_default, created_at, updated_at) VALUES
(NULL, 'Alimentação', 'expense', 'Utensils', TRUE, NOW(), NOW()),
(NULL, 'Transporte', 'expense', 'Car', TRUE, NOW(), NOW()),
(NULL, 'Moradia', 'expense', 'Home', TRUE, NOW(), NOW()),
(NULL, 'Saúde', 'expense', 'HeartPulse', TRUE, NOW(), NOW()),
(NULL, 'Educação', 'expense', 'BookOpen', TRUE, NOW(), NOW()),
(NULL, 'Lazer', 'expense', 'Ticket', TRUE, NOW(), NOW()),
(NULL, 'Vestuário', 'expense', 'Shirt', TRUE, NOW(), NOW()),
(NULL, 'Salário', 'income', 'DollarSign', TRUE, NOW(), NOW()),
(NULL, 'Investimentos', 'income', 'LineChart', TRUE, NOW(), NOW()),
(NULL, 'Outras Receitas', 'income', 'PlusCircle', TRUE, NOW(), NOW()),
(NULL, 'Outras Despesas', 'expense', 'MinusCircle', TRUE, NOW(), NOW())
ON CONFLICT (name, user_id, is_default) DO NOTHING; -- Evita duplicatas se is_default=true e user_id=NULL


-- Este comando abaixo deve ser executado manualmente no painel do Supabase
-- em Configurações > API > Configurações de URL (Authentication > URL Configuration).
-- Marque 'next_auth' como um dos "Exposed schemas".
-- O Supabase CLI também pode fazer isso se você estiver usando migrations locais com `supabase link` e `supabase db push`.
-- Exemplo de como seria no config.toml (se usando CLI localmente):
-- [api]
--   schemas = ["public", "storage", "graphql_public", "next_auth"]


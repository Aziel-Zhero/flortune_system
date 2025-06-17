-- Script de Criação do Schema para Flortune com NextAuth.js e SupabaseAdapter

-- Habilitar a extensão uuid-ossp se ainda não estiver habilitada (essencial para uuid_generate_v4)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

--------------------------------------------------------------------------------
-- Schema para NextAuth.js (gerenciado pelo SupabaseAdapter)
--------------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS next_auth;

GRANT USAGE ON SCHEMA next_auth TO service_role;
GRANT ALL ON SCHEMA next_auth TO postgres;

-- Tabela de Usuários (NextAuth)
CREATE TABLE IF NOT EXISTS next_auth.users
(
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    name text,
    email text,
    "emailVerified" timestamp with time zone,
    image text,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT email_unique UNIQUE (email)
);
ALTER TABLE next_auth.users OWNER TO postgres;
GRANT ALL ON TABLE next_auth.users TO postgres;
GRANT ALL ON TABLE next_auth.users TO service_role;

-- Função uid() para RLS (NextAuth)
CREATE OR REPLACE FUNCTION next_auth.uid() RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
    AS $$
  select
  	coalesce(
		nullif(current_setting('request.jwt.claim.sub', true), ''),
		(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
	)::uuid
$$;
ALTER FUNCTION next_auth.uid() OWNER TO supabase_admin;
GRANT EXECUTE ON FUNCTION next_auth.uid() TO authenticated;
GRANT EXECUTE ON FUNCTION next_auth.uid() TO service_role;


-- Tabela de Sessões (NextAuth)
CREATE TABLE IF NOT EXISTS next_auth.sessions
(
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
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
ALTER TABLE next_auth.sessions OWNER TO postgres;
GRANT ALL ON TABLE next_auth.sessions TO postgres;
GRANT ALL ON TABLE next_auth.sessions TO service_role;

-- Tabela de Contas (NextAuth OAuth)
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
ALTER TABLE next_auth.accounts OWNER TO postgres;
GRANT ALL ON TABLE next_auth.accounts TO postgres;
GRANT ALL ON TABLE next_auth.accounts TO service_role;

-- Tabela de Tokens de Verificação (NextAuth Email)
CREATE TABLE IF NOT EXISTS next_auth.verification_tokens
(
    identifier text,
    token text NOT NULL,
    expires timestamp with time zone NOT NULL,
    CONSTRAINT verification_tokens_pkey PRIMARY KEY (token),
    CONSTRAINT token_identifier_unique UNIQUE (token, identifier)
);
ALTER TABLE next_auth.verification_tokens OWNER TO postgres;
GRANT ALL ON TABLE next_auth.verification_tokens TO postgres;
GRANT ALL ON TABLE next_auth.verification_tokens TO service_role;


--------------------------------------------------------------------------------
-- Schema Público (Tabelas da Aplicação Flortune)
--------------------------------------------------------------------------------

-- Tabela de Perfis de Usuário (Flortune)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    full_name text,
    display_name text,
    email text NOT NULL UNIQUE,
    hashed_password text,
    phone text,
    cpf_cnpj text UNIQUE,
    rg text,
    avatar_url text,
    account_type text CHECK (account_type IN ('pessoa', 'empresa')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES next_auth.users(id) ON DELETE CASCADE ON UPDATE CASCADE
);
ALTER TABLE public.profiles OWNER TO postgres;
GRANT ALL ON TABLE public.profiles TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO service_role;
GRANT SELECT, INSERT, UPDATE (full_name, display_name, phone, cpf_cnpj, rg, avatar_url, account_type, updated_at) ON TABLE public.profiles TO authenticated;
GRANT SELECT (email) ON TABLE public.profiles TO anon; -- Para verificação de email existente no cadastro
GRANT INSERT (id, full_name, display_name, email, hashed_password, phone, cpf_cnpj, rg, avatar_url, account_type, created_at, updated_at) ON TABLE public.profiles TO anon; -- Para cadastro

-- Habilitar RLS na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies RLS para profiles
DROP POLICY IF EXISTS "Allow public read access to minimal profile info" ON public.profiles;
CREATE POLICY "Allow public read access to minimal profile info"
    ON public.profiles FOR SELECT
    TO anon, authenticated
    USING (true); -- Pode ser mais restritivo se necessário, e.g., para avatares

DROP POLICY IF EXISTS "Allow authenticated users to read their own profile" ON public.profiles;
CREATE POLICY "Allow authenticated users to read their own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING ((next_auth.uid() = id));

DROP POLICY IF EXISTS "Allow authenticated users to update their own profile" ON public.profiles;
CREATE POLICY "Allow authenticated users to update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING ((next_auth.uid() = id))
    WITH CHECK ((next_auth.uid() = id));

DROP POLICY IF EXISTS "Allow anon to insert for signup" ON public.profiles;
CREATE POLICY "Allow anon to insert for signup"
    ON public.profiles FOR INSERT
    TO anon
    WITH CHECK (true); -- O controle de duplicação de email é feito por UNIQUE constraint e verificação na action.

-- Trigger para sincronizar dados de next_auth.users para public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user_from_next_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, extensions, next_auth
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, full_name, avatar_url, account_type, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.name, -- Usar o 'name' do NextAuth como 'display_name' inicial
    NEW.name, -- Usar o 'name' do NextAuth como 'full_name' inicial
    NEW.image, -- Usar o 'image' do NextAuth como 'avatar_url'
    'pessoa',  -- Define 'pessoa' como padrão para usuários OAuth
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  )
  ON CONFLICT (id) DO NOTHING; -- Não faz nada se o perfil já existir (ex: criado por credentials)
  -- Alternativamente, poderia fazer um UPDATE se já existir, mas ON CONFLICT DO NOTHING é mais simples
  -- para o caso onde o usuário se cadastra por credenciais primeiro e depois usa OAuth.
  RETURN NEW;
END;
$$;
ALTER FUNCTION public.handle_new_user_from_next_auth() OWNER TO supabase_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user_from_next_auth() TO service_role;


DROP TRIGGER IF EXISTS on_next_auth_user_created ON next_auth.users;
CREATE TRIGGER on_next_auth_user_created
  AFTER INSERT ON next_auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_from_next_auth();


-- Tabela de Categorias
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('income', 'expense')),
    icon text,
    is_default boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT categories_pkey PRIMARY KEY (id)
);
ALTER TABLE public.categories OWNER TO postgres;
GRANT ALL ON TABLE public.categories TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.categories TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.categories TO authenticated;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to manage their own categories" ON public.categories;
CREATE POLICY "Allow authenticated users to manage their own categories"
    ON public.categories FOR ALL
    TO authenticated
    USING ((next_auth.uid() = user_id))
    WITH CHECK ((next_auth.uid() = user_id));

DROP POLICY IF EXISTS "Allow public read access to default categories" ON public.categories;
CREATE POLICY "Allow public read access to default categories"
    ON public.categories FOR SELECT
    TO anon, authenticated
    USING (is_default = true);

-- Tabela de Transações
CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    description text NOT NULL,
    amount numeric(10, 2) NOT NULL,
    date date NOT NULL,
    type text NOT NULL CHECK (type IN ('income', 'expense')),
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT transactions_pkey PRIMARY KEY (id)
);
ALTER TABLE public.transactions OWNER TO postgres;
GRANT ALL ON TABLE public.transactions TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.transactions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.transactions TO authenticated;

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to manage their own transactions" ON public.transactions;
CREATE POLICY "Allow authenticated users to manage their own transactions"
    ON public.transactions FOR ALL
    TO authenticated
    USING ((next_auth.uid() = user_id))
    WITH CHECK ((next_auth.uid() = user_id));


-- Tabela de Orçamentos
CREATE TABLE IF NOT EXISTS public.budgets (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    limit_amount numeric(10, 2) NOT NULL,
    spent_amount numeric(10, 2) NOT NULL DEFAULT 0.00,
    period_start_date date NOT NULL,
    period_end_date date NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT budgets_pkey PRIMARY KEY (id),
    CONSTRAINT budgets_user_category_period_unique UNIQUE (user_id, category_id, period_start_date)
);
ALTER TABLE public.budgets OWNER TO postgres;
GRANT ALL ON TABLE public.budgets TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.budgets TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.budgets TO authenticated;

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to manage their own budgets" ON public.budgets;
CREATE POLICY "Allow authenticated users to manage their own budgets"
    ON public.budgets FOR ALL
    TO authenticated
    USING ((next_auth.uid() = user_id))
    WITH CHECK ((next_auth.uid() = user_id));

-- Tabela de Metas Financeiras
CREATE TABLE IF NOT EXISTS public.financial_goals (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    target_amount numeric(10, 2) NOT NULL,
    current_amount numeric(10, 2) NOT NULL DEFAULT 0.00,
    deadline_date date,
    icon text,
    notes text,
    status text NOT NULL DEFAULT 'in_progress'::text CHECK (status IN ('in_progress', 'achieved', 'cancelled')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT financial_goals_pkey PRIMARY KEY (id)
);
ALTER TABLE public.financial_goals OWNER TO postgres;
GRANT ALL ON TABLE public.financial_goals TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.financial_goals TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.financial_goals TO authenticated;

ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to manage their own financial goals" ON public.financial_goals;
CREATE POLICY "Allow authenticated users to manage their own financial goals"
    ON public.financial_goals FOR ALL
    TO authenticated
    USING ((next_auth.uid() = user_id))
    WITH CHECK ((next_auth.uid() = user_id));

-- Dados Iniciais (Categorias Padrão)
INSERT INTO public.categories (name, type, icon, is_default, created_at, updated_at) VALUES
('Salário', 'income', 'Landmark', true, NOW(), NOW()),
('Outras Receitas', 'income', 'Coins', true, NOW(), NOW()),
('Moradia', 'expense', 'Home', true, NOW(), NOW()),
('Alimentação', 'expense', 'Utensils', true, NOW(), NOW()),
('Transporte', 'expense', 'Car', true, NOW(), NOW()),
('Saúde', 'expense', 'HeartPulse', true, NOW(), NOW()),
('Educação', 'expense', 'BookOpen', true, NOW(), NOW()),
('Lazer', 'expense', 'Ticket', true, NOW(), NOW()),
('Vestuário', 'expense', 'Shirt', true, NOW(), NOW()),
('Contas', 'expense', 'Receipt', true, NOW(), NOW()),
('Impostos', 'expense', 'Landmark', true, NOW(), NOW()),
('Investimentos', 'expense', 'TrendingUp', true, NOW(), NOW()),
('Doações', 'expense', 'Gift', true, NOW(), NOW()),
('Compras', 'expense', 'ShoppingCart', true, NOW(), NOW()),
('Viagens', 'expense', 'Plane', true, NOW(), NOW()),
('Cuidados Pessoais', 'expense', 'Smile', true, NOW(), NOW()),
('Assinaturas', 'expense', 'Youtube', true, NOW(), NOW()), -- Exemplo: Youtube, poderia ser 'Clapperboard' ou 'Tv'
('Presentes', 'expense', 'Gift', true, NOW(), NOW()),
('Animais de Estimação', 'expense', 'Dog', true, NOW(), NOW()),
('Reparos e Manutenção', 'expense', 'Wrench', true, NOW(), NOW()),
('Taxas Bancárias', 'expense', 'CreditCard', true, NOW(), NOW()),
('Outras Despesas', 'expense', 'MoreHorizontal', true, NOW(), NOW())
ON CONFLICT (name) WHERE is_default = true DO NOTHING; -- Evita duplicatas de categorias padrão

--------------------------------------------------------------------------------
-- Schema para Assinaturas (Subscriptions) - Adaptado para NextAuth
--------------------------------------------------------------------------------

-- Tipo ENUM para status da assinatura
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
        CREATE TYPE public.subscription_status AS ENUM (
            'trialing',
            'active',
            'canceled',
            'incomplete',
            'incomplete_expired',
            'past_due',
            'unpaid',
            'paused'
        );
    END IF;
END$$;

-- Tabela de Preços (Prices) - Mínima para referência
CREATE TABLE IF NOT EXISTS public.prices (
    id text PRIMARY KEY, -- Price ID from Stripe, e.g. price_123
    product_id text, -- Product ID from Stripe, e.g. prod_123 (pode referenciar uma tabela products)
    active boolean,
    currency text,
    description text,
    type text, -- e.g., 'one_time' or 'recurring'
    unit_amount bigint, -- Amount in cents
    interval text, -- e.g., 'month', 'year'
    interval_count integer,
    trial_period_days integer,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.prices OWNER TO postgres;
GRANT ALL ON TABLE public.prices TO postgres;
GRANT SELECT ON TABLE public.prices TO anon, authenticated, service_role; -- Geralmente preços são públicos

ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;
-- Política RLS para prices (exemplo, pode ser mais restritivo ou aberto)
DROP POLICY IF EXISTS "Allow public read access to prices" ON public.prices;
CREATE POLICY "Allow public read access to prices"
    ON public.prices FOR SELECT
    TO anon, authenticated
    USING (active = true);


-- Tabela de Assinaturas (Subscriptions)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id text PRIMARY KEY, -- Subscription ID from Stripe, e.g. sub_123
    user_id uuid NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE, -- Referencia next_auth.users
    status public.subscription_status,
    metadata jsonb,
    price_id text REFERENCES public.prices(id),
    quantity integer,
    cancel_at_period_end boolean,
    created timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    current_period_start timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    current_period_end timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    ended_at timestamp with time zone,
    cancel_at timestamp with time zone,
    canceled_at timestamp with time zone,
    trial_start timestamp with time zone,
    trial_end timestamp with time zone
);
ALTER TABLE public.subscriptions OWNER TO postgres;
GRANT ALL ON TABLE public.subscriptions TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.subscriptions TO service_role; -- service_role para webhooks
GRANT SELECT, UPDATE (cancel_at_period_end, metadata, quantity) ON TABLE public.subscriptions TO authenticated; -- Usuário pode ver e talvez cancelar

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Can only view own subs data." ON public.subscriptions;
CREATE POLICY "Can only view own subs data."
    ON public.subscriptions FOR SELECT
    TO authenticated
    USING (next_auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow user to update their own subscription cancellation." ON public.subscriptions;
CREATE POLICY "Allow user to update their own subscription cancellation."
    ON public.subscriptions FOR UPDATE
    TO authenticated
    USING (next_auth.uid() = user_id)
    WITH CHECK (next_auth.uid() = user_id);

--------------------------------------------------------------------------------
-- Publicações para Supabase Realtime (Opcional)
--------------------------------------------------------------------------------
-- Remover publicação existente para evitar erro se ela já existir
DROP PUBLICATION IF EXISTS supabase_realtime;

-- Criar publicação para tabelas que podem precisar de atualizações em tempo real
-- Adicione outras tabelas públicas conforme necessário (ex: products)
CREATE PUBLICATION supabase_realtime FOR TABLE public.prices, public.subscriptions;


--------------------------------------------------------------------------------
-- Queries de Verificação (para ajudar na depuração no SQL Editor)
--------------------------------------------------------------------------------
SELECT 'Schema next_auth existe?' AS check_description,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'next_auth')
            THEN 'SIM'
            ELSE 'NÃO (PROBLEMA!)'
       END AS result;

SELECT 'Tabela next_auth.users existe?' AS check_description,
       CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'next_auth' AND tablename = 'users')
            THEN 'SIM'
            ELSE 'NÃO (PROBLEMA!)'
       END AS result;

SELECT 'Coluna email existe em public.profiles?' AS check_description,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email')
            THEN 'SIM'
            ELSE 'NÃO (PROBLEMA!)'
       END AS result;

SELECT 'Tabela public.subscriptions existe?' AS check_description,
       CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscriptions')
            THEN 'SIM'
            ELSE 'NÃO (Se esperado, é um PROBLEMA!)'
       END AS result;
```
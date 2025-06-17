
-- Habilitar a extensão pgcrypto se ainda não estiver habilitada (necessária para uuid_generate_v4() em algumas configurações)
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

--
-- Name: next_auth; Type: SCHEMA;
--
CREATE SCHEMA IF NOT EXISTS next_auth;

GRANT USAGE ON SCHEMA next_auth TO service_role;
GRANT ALL ON SCHEMA next_auth TO postgres;

--
-- Create users table for NextAuth.js Supabase Adapter
--
CREATE TABLE IF NOT EXISTS next_auth.users
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name text,
    email text,
    "emailVerified" timestamp with time zone,
    image text,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT email_unique UNIQUE (email)
);

GRANT ALL ON TABLE next_auth.users TO postgres;
GRANT ALL ON TABLE next_auth.users TO service_role;


-- uid() function to be used in RLS policies
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


--
-- Create sessions table for NextAuth.js Supabase Adapter
--
CREATE TABLE IF NOT EXISTS next_auth.sessions
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    expires timestamp with time zone NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" uuid,
    CONSTRAINT sessions_pkey PRIMARY KEY (id),
    CONSTRAINT "sessionToken_unique" UNIQUE ("sessionToken"),
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES next_auth.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);

GRANT ALL ON TABLE next_auth.sessions TO postgres;
GRANT ALL ON TABLE next_auth.sessions TO service_role;


--
-- Create accounts table for NextAuth.js Supabase Adapter
--
CREATE TABLE IF NOT EXISTS next_auth.accounts
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
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
    CONSTRAINT provider_account_unique UNIQUE (provider, "providerAccountId"),
    CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES next_auth.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);

GRANT ALL ON TABLE next_auth.accounts TO postgres;
GRANT ALL ON TABLE next_auth.accounts TO service_role;

--
-- Create verification_tokens table for NextAuth.js Supabase Adapter
--
CREATE TABLE IF NOT EXISTS next_auth.verification_tokens
(
    identifier text,
    token text,
    expires timestamp with time zone NOT NULL,
    CONSTRAINT verification_tokens_pkey PRIMARY KEY (token, identifier)
);

GRANT ALL ON TABLE next_auth.verification_tokens TO postgres;
GRANT ALL ON TABLE next_auth.verification_tokens TO service_role;


-- Grant usage on schema and all tables within to anon and authenticated roles
-- This is broad for development; in production, you'd be more granular.
GRANT USAGE ON SCHEMA next_auth TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA next_auth TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA next_auth TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA next_auth TO anon, authenticated;


--
-- Tabela public.profiles para armazenar dados customizados dos usuários
--
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL PRIMARY KEY, -- Este ID será o mesmo que next_auth.users.id
    full_name text,
    display_name text,
    email text NOT NULL UNIQUE, -- Email deve ser NOT NULL e UNIQUE
    hashed_password text, -- Para login com credenciais
    phone text,
    cpf_cnpj text UNIQUE,
    rg text,
    avatar_url text,
    account_type text CHECK (account_type IN ('pessoa', 'empresa')),
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT fk_user_id FOREIGN KEY (id) REFERENCES next_auth.users(id) ON DELETE CASCADE
);

-- Policies para public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Anon pode inserir (para o cadastro com CredentialsProvider)
CREATE POLICY "Allow anon to insert profiles"
ON public.profiles
FOR INSERT
TO anon
WITH CHECK (true);

-- Usuários autenticados podem ler seu próprio perfil
CREATE POLICY "Allow authenticated users to read their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (next_auth.uid() = id);

-- Usuários autenticados podem atualizar seu próprio perfil
CREATE POLICY "Allow authenticated users to update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (next_auth.uid() = id)
WITH CHECK (next_auth.uid() = id);

-- SERVICE_ROLE pode fazer tudo (o Adapter e triggers usarão isso implicitamente ou explicitamente)
CREATE POLICY "Allow service_role full access"
ON public.profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);


-- Trigger para popular public.profiles quando um usuário é criado em next_auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user_from_next_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- importante para permitir a inserção mesmo que o usuário não tenha permissão direta
SET search_path = public -- Garante que estamos referenciando public.profiles
AS $$
BEGIN
  -- Insere na public.profiles, usando o ID, email, nome e imagem do novo usuário em next_auth.users
  -- COALESCE é usado para fornecer valores padrão caso name ou image sejam nulos
  INSERT INTO public.profiles (id, email, display_name, full_name, avatar_url, account_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.name, NEW.email), -- display_name usa o nome, ou email como fallback
    NEW.name,                     -- full_name usa o nome
    NEW.image,                    -- avatar_url usa a imagem
    'pessoa'                      -- account_type padrão; ajuste se necessário (ex: pode ser null e definido depois)
  )
  -- Se já existir um perfil com o mesmo ID (improvável se o trigger só roda em INSERT)
  -- ou com o mesmo email, não faz nada para evitar erro de duplicação.
  -- O constraint UNIQUE no email em public.profiles já protege contra duplicatas de email.
  -- O constraint fk_user_id protege contra IDs que não existem em next_auth.users.
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Remove o trigger antigo se existir para evitar duplicidade
DROP TRIGGER IF EXISTS on_auth_user_created ON next_auth.users;
DROP TRIGGER IF EXISTS on_next_auth_user_created ON next_auth.users;

-- Cria o novo trigger
CREATE TRIGGER on_next_auth_user_created
  AFTER INSERT ON next_auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_from_next_auth();


--
-- Tabela public.categories
--
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE, -- Nulo para categorias padrão
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('income', 'expense')),
    icon text,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to default categories" ON public.categories FOR SELECT TO anon, authenticated USING (is_default = true);
CREATE POLICY "Allow users to manage their own categories" ON public.categories FOR ALL TO authenticated USING (user_id = next_auth.uid()) WITH CHECK (user_id = next_auth.uid());
CREATE POLICY "Allow service_role full access to categories" ON public.categories FOR ALL TO service_role USING (true) WITH CHECK (true);

--
-- Tabela public.transactions
--
CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    description text NOT NULL,
    amount numeric(10, 2) NOT NULL,
    date date NOT NULL,
    type text NOT NULL CHECK (type IN ('income', 'expense')),
    notes text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage their own transactions" ON public.transactions FOR ALL TO authenticated USING (user_id = next_auth.uid()) WITH CHECK (user_id = next_auth.uid());
CREATE POLICY "Allow service_role full access to transactions" ON public.transactions FOR ALL TO service_role USING (true) WITH CHECK (true);

--
-- Tabela public.budgets
--
CREATE TABLE IF NOT EXISTS public.budgets (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    limit_amount numeric(10, 2) NOT NULL,
    spent_amount numeric(10, 2) DEFAULT 0.00 NOT NULL,
    period_start_date date NOT NULL,
    period_end_date date NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT unique_budget_period_category UNIQUE (user_id, category_id, period_start_date, period_end_date)
);
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage their own budgets" ON public.budgets FOR ALL TO authenticated USING (user_id = next_auth.uid()) WITH CHECK (user_id = next_auth.uid());
CREATE POLICY "Allow service_role full access to budgets" ON public.budgets FOR ALL TO service_role USING (true) WITH CHECK (true);

--
-- Tabela public.financial_goals
--
CREATE TABLE IF NOT EXISTS public.financial_goals (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    target_amount numeric(10, 2) NOT NULL,
    current_amount numeric(10, 2) DEFAULT 0.00 NOT NULL,
    deadline_date date,
    icon text,
    notes text,
    status text DEFAULT 'in_progress'::text NOT NULL CHECK (status IN ('in_progress', 'achieved', 'cancelled')),
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage their own financial goals" ON public.financial_goals FOR ALL TO authenticated USING (user_id = next_auth.uid()) WITH CHECK (user_id = next_auth.uid());
CREATE POLICY "Allow service_role full access to financial_goals" ON public.financial_goals FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Grant permissions on public schema to service_role for it to manage these tables
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Grant permissions to anon and authenticated as well for RLS to work through them
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated; -- RLS will restrict actual access
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Populating default categories if they don't exist
INSERT INTO public.categories (name, type, icon, is_default)
SELECT 'Salário', 'income', 'Briefcase', true WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Salário' AND is_default = true);
INSERT INTO public.categories (name, type, icon, is_default)
SELECT 'Freelance', 'income', 'Laptop', true WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Freelance' AND is_default = true);
INSERT INTO public.categories (name, type, icon, is_default)
SELECT 'Investimentos', 'income', 'TrendingUp', true WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Investimentos' AND is_default = true);
INSERT INTO public.categories (name, type, icon, is_default)
SELECT 'Alimentação', 'expense', 'Utensils', true WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Alimentação' AND is_default = true);
INSERT INTO public.categories (name, type, icon, is_default)
SELECT 'Transporte', 'expense', 'Car', true WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Transporte' AND is_default = true);
INSERT INTO public.categories (name, type, icon, is_default)
SELECT 'Moradia', 'expense', 'Home', true WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Moradia' AND is_default = true);
INSERT INTO public.categories (name, type, icon, is_default)
SELECT 'Saúde', 'expense', 'HeartPulse', true WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Saúde' AND is_default = true);
INSERT INTO public.categories (name, type, icon, is_default)
SELECT 'Educação', 'expense', 'BookOpen', true WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Educação' AND is_default = true);
INSERT INTO public.categories (name, type, icon, is_default)
SELECT 'Lazer', 'expense', 'Smile', true WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Lazer' AND is_default = true);
INSERT INTO public.categories (name, type, icon, is_default)
SELECT 'Contas Fixas', 'expense', 'FileText', true WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Contas Fixas' AND is_default = true);
INSERT INTO public.categories (name, type, icon, is_default)
SELECT 'Compras', 'expense', 'ShoppingCart', true WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Compras' AND is_default = true);
INSERT INTO public.categories (name, type, icon, is_default)
SELECT 'Outras Receitas', 'income', 'DollarSign', true WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Outras Receitas' AND is_default = true);
INSERT INTO public.categories (name, type, icon, is_default)
SELECT 'Outras Despesas', 'expense', 'Archive', true WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Outras Despesas' AND is_default = true);


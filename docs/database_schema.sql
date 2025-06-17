
-- Certifique-se de que a extensão uuid-ossp está habilitada no schema 'extensions'
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

--
-- Schema: next_auth (para SupabaseAdapter do NextAuth.js)
--
CREATE SCHEMA IF NOT EXISTS next_auth;

GRANT USAGE ON SCHEMA next_auth TO service_role;
GRANT ALL ON SCHEMA next_auth TO postgres;

--
-- Tabela: next_auth.users
--
CREATE TABLE IF NOT EXISTS next_auth.users
(
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(), -- Corrigido para usar extensions.
    name text,
    email text,
    "emailVerified" timestamp with time zone,
    image text,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT email_unique UNIQUE (email)
);
GRANT ALL ON TABLE next_auth.users TO postgres;
GRANT ALL ON TABLE next_auth.users TO service_role;

--
-- Tabela: next_auth.sessions
--
CREATE TABLE IF NOT EXISTS next_auth.sessions
(
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(), -- Corrigido
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

--
-- Tabela: next_auth.accounts
--
CREATE TABLE IF NOT EXISTS next_auth.accounts
(
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(), -- Corrigido
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
-- Tabela: next_auth.verification_tokens
--
CREATE TABLE IF NOT EXISTS next_auth.verification_tokens
(
    identifier text,
    token text,
    expires timestamp with time zone NOT NULL,
    CONSTRAINT verification_tokens_pkey PRIMARY KEY (token, identifier) -- PK composta é mais comum aqui
    -- CONSTRAINT token_unique UNIQUE (token), -- Redundante se token faz parte da PK
    -- CONSTRAINT token_identifier_unique UNIQUE (token, identifier) -- Já coberto pela PK
);
GRANT ALL ON TABLE next_auth.verification_tokens TO postgres;
GRANT ALL ON TABLE next_auth.verification_tokens TO service_role;


--
-- Função: next_auth.uid() - para uso em RLS policies
--
CREATE OR REPLACE FUNCTION next_auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select
    coalesce(
        nullif(current_setting('request.jwt.claim.sub', true), ''),
        (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
    )::uuid
$$;


--
-- Schema: public (tabelas da aplicação)
--

--
-- Tabela: public.profiles (para dados customizados do usuário, vinculada a next_auth.users)
--
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(), -- Chave primária, será o mesmo ID de next_auth.users.id
    full_name text,
    display_name text,
    email text NOT NULL, -- Mantido para referência e consistência, mas o email canônico estará em next_auth.users
    hashed_password text, -- Essencial para o CredentialsProvider
    phone text,
    cpf_cnpj text,
    rg text,
    avatar_url text,
    account_type text CHECK (account_type IN ('pessoa', 'empresa')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_email_key UNIQUE (email), -- Email também deve ser único aqui
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES next_auth.users(id) ON DELETE CASCADE -- Vincula ao next_auth.users
);
COMMENT ON TABLE public.profiles IS 'Stores custom user profile information, linked to next_auth.users.';
GRANT ALL ON TABLE public.profiles TO postgres;
GRANT ALL ON TABLE public.profiles TO service_role;
-- RLS Policies para public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política: Usuários anônimos (anon role) podem criar seus próprios perfis (durante o cadastro)
CREATE POLICY "Allow anon to insert their own profile"
    ON public.profiles FOR INSERT
    TO anon
    WITH CHECK (true);

-- Política: Usuários autenticados podem ler seus próprios perfis
CREATE POLICY "Allow authenticated users to read their own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (next_auth.uid() = id); -- next_auth.uid() obtém o ID do usuário do token JWT

-- Política: Usuários autenticados podem atualizar seus próprios perfis
CREATE POLICY "Allow authenticated users to update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (next_auth.uid() = id)
    WITH CHECK (next_auth.uid() = id);

-- Política (Opcional): Usuários autenticados podem ler o email para verificação de existência (usado no signup)
-- Considere cuidadosamente as implicações de segurança. Uma alternativa é tratar o erro de constraint UNIQUE.
-- Se a função de signup já tenta inserir e trata o erro de email duplicado, esta policy pode não ser estritamente necessária
-- e pode ser removida para maior privacidade.
CREATE POLICY "Allow anon to select email for signup check"
    ON public.profiles FOR SELECT
    TO anon
    USING (true); -- Permite SELECT em todos os emails por anon; RESTRinja se possível.
    -- Se esta policy for muito permissiva, a lógica de signup pode tentar inserir e capturar o erro de violação de constraint UNIQUE no email.


--
-- Tabela: public.categories
--
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE, -- Pode ser nulo para categorias padrão
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('income', 'expense')),
    icon text,
    is_default boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT categories_pkey PRIMARY KEY (id),
    CONSTRAINT categories_user_name_type_unique UNIQUE (user_id, name, type) -- Evita categorias duplicadas para o mesmo usuário
);
COMMENT ON TABLE public.categories IS 'Stores user-defined and default financial categories.';
GRANT ALL ON TABLE public.categories TO postgres;
GRANT ALL ON TABLE public.categories TO service_role;
-- RLS Policies para public.categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to manage their own categories"
    ON public.categories FOR ALL
    TO authenticated
    USING (user_id = next_auth.uid())
    WITH CHECK (user_id = next_auth.uid());
CREATE POLICY "Allow all users to read default categories"
    ON public.categories FOR SELECT
    USING (is_default = true);


--
-- Tabela: public.transactions
--
CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    description text NOT NULL,
    amount numeric(12, 2) NOT NULL,
    date date NOT NULL,
    type text NOT NULL CHECK (type IN ('income', 'expense')),
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT transactions_pkey PRIMARY KEY (id)
);
COMMENT ON TABLE public.transactions IS 'Stores individual financial transactions.';
GRANT ALL ON TABLE public.transactions TO postgres;
GRANT ALL ON TABLE public.transactions TO service_role;
-- RLS Policies para public.transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to manage their own transactions"
    ON public.transactions FOR ALL
    TO authenticated
    USING (user_id = next_auth.uid())
    WITH CHECK (user_id = next_auth.uid());


--
-- Tabela: public.budgets
--
CREATE TABLE IF NOT EXISTS public.budgets (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    limit_amount numeric(12, 2) NOT NULL,
    spent_amount numeric(12, 2) NOT NULL DEFAULT 0.00,
    period_start_date date NOT NULL,
    period_end_date date NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT budgets_pkey PRIMARY KEY (id),
    CONSTRAINT budgets_user_category_period_unique UNIQUE (user_id, category_id, period_start_date)
);
COMMENT ON TABLE public.budgets IS 'Stores user-defined budgets for categories over periods.';
GRANT ALL ON TABLE public.budgets TO postgres;
GRANT ALL ON TABLE public.budgets TO service_role;
-- RLS Policies para public.budgets
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to manage their own budgets"
    ON public.budgets FOR ALL
    TO authenticated
    USING (user_id = next_auth.uid())
    WITH CHECK (user_id = next_auth.uid());


--
-- Tabela: public.financial_goals
--
CREATE TABLE IF NOT EXISTS public.financial_goals (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    target_amount numeric(12, 2) NOT NULL,
    current_amount numeric(12, 2) NOT NULL DEFAULT 0.00,
    deadline_date date,
    icon text,
    notes text,
    status text NOT NULL DEFAULT 'in_progress'::text CHECK (status IN ('in_progress', 'achieved', 'cancelled')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT financial_goals_pkey PRIMARY KEY (id)
);
COMMENT ON TABLE public.financial_goals IS 'Stores user financial goals and tracks their progress.';
GRANT ALL ON TABLE public.financial_goals TO postgres;
GRANT ALL ON TABLE public.financial_goals TO service_role;
-- RLS Policies para public.financial_goals
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to manage their own financial goals"
    ON public.financial_goals FOR ALL
    TO authenticated
    USING (user_id = next_auth.uid())
    WITH CHECK (user_id = next_auth.uid());

--
-- Trigger: handle_new_user_from_next_auth (para popular public.profiles quando um usuário do NextAuth é criado)
--
CREATE OR REPLACE FUNCTION public.handle_new_user_from_next_auth()
RETURNS TRIGGER AS $$
BEGIN
    -- Insere um novo perfil em public.profiles com o id e email do novo usuário em next_auth.users
    -- Outros campos como nome e avatar podem vir do perfil do provedor OAuth, se disponíveis.
    -- hashed_password será nulo aqui, pois o CredentialsProvider lida com isso separadamente.
    INSERT INTO public.profiles (id, email, display_name, full_name, avatar_url, account_type)
    VALUES (
        NEW.id, 
        NEW.email,
        NEW.name, -- Pode ser o nome do Google, ou nulo
        NEW.name, -- Repete, ou pode ser ajustado
        NEW.image, -- Pode ser a imagem do Google, ou nulo
        'pessoa' -- Define 'pessoa' como padrão para logins OAuth, pode ser ajustado depois pelo usuário
    )
    ON CONFLICT (id) DO NOTHING; -- Se já existir um perfil com esse ID (improvável, mas seguro)
    -- ON CONFLICT (email) DO NOTHING; -- Se o email já existir em public.profiles, não faz nada (o usuário pode ter se cadastrado por credenciais antes)
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar o trigger na tabela next_auth.users
DROP TRIGGER IF EXISTS on_next_auth_user_created ON next_auth.users; -- Remove o trigger antigo se existir
CREATE TRIGGER on_next_auth_user_created
    AFTER INSERT ON next_auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_from_next_auth();

COMMENT ON TRIGGER on_next_auth_user_created ON next_auth.users IS 'When a user is created in next_auth.users (e.g. via OAuth), this trigger creates a corresponding entry in public.profiles.';


-- QUERIES DE VERIFICAÇÃO (para ver o resultado no Supabase SQL Editor após executar o script)
SELECT 'Schema next_auth e tabelas públicas configuradas.' as status_geral;

SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'next_auth';

SELECT COUNT(*) as next_auth_tables_count 
FROM pg_tables 
WHERE schemaname = 'next_auth';
-- Deve retornar 4 (users, sessions, accounts, verification_tokens)

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email';
-- Deve retornar 'email' e 'text'

SELECT tgname as trigger_name
FROM pg_trigger
WHERE tgrelid = 'next_auth.users'::regclass AND tgname = 'on_next_auth_user_created';
-- Deve retornar 'on_next_auth_user_created' se o trigger foi criado corretamente
    
    
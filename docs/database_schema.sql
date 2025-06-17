
-- Habilitar a extensão uuid-ossp se ainda não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

--
-- Name: next_auth; Type: SCHEMA;
--
CREATE SCHEMA IF NOT EXISTS next_auth;

GRANT USAGE ON SCHEMA next_auth TO service_role;
GRANT ALL ON SCHEMA next_auth TO postgres;

--
-- Create users table (next_auth.users)
--
CREATE TABLE IF NOT EXISTS next_auth.users
(
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE, -- Email deve ser único aqui
    "emailVerified" TIMESTAMPTZ,
    image TEXT
);

GRANT ALL ON TABLE next_auth.users TO postgres;
GRANT ALL ON TABLE next_auth.users TO service_role;


--- uid() function to be used in RLS policies for next_auth schema
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
-- Create sessions table (next_auth.sessions)
--
CREATE TABLE IF NOT EXISTS next_auth.sessions
(
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    expires TIMESTAMPTZ NOT NULL,
    "sessionToken" TEXT NOT NULL UNIQUE,
    "userId" uuid,
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES next_auth.users (id) ON DELETE CASCADE
);

GRANT ALL ON TABLE next_auth.sessions TO postgres;
GRANT ALL ON TABLE next_auth.sessions TO service_role;

--
-- Create accounts table (next_auth.accounts)
--
CREATE TABLE IF NOT EXISTS next_auth.accounts
(
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
    oauth_token_secret TEXT,
    oauth_token TEXT,
    "userId" uuid,
    CONSTRAINT贫 "accounts_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES next_auth.users (id) ON DELETE CASCADE,
    CONSTRAINT provider_account_unique UNIQUE (provider, "providerAccountId")
);

GRANT ALL ON TABLE next_auth.accounts TO postgres;
GRANT ALL ON TABLE next_auth.accounts TO service_role;

--
-- Create verification_tokens table (next_auth.verification_tokens)
--
CREATE TABLE IF NOT EXISTS next_auth.verification_tokens
(
    identifier TEXT,
    token TEXT NOT NULL PRIMARY KEY, -- Token é a chave primária e único
    expires TIMESTAMPTZ NOT NULL,
    CONSTRAINT token_identifier_unique UNIQUE (token, identifier)
);

GRANT ALL ON TABLE next_auth.verification_tokens TO postgres;
GRANT ALL ON TABLE next_auth.verification_tokens TO service_role;


-- ENUM Type for account_type in public.profiles
CREATE TYPE public.account_type_enum AS ENUM ('pessoa', 'empresa');

--
-- Create profiles table (public.profiles)
-- Esta tabela armazena informações adicionais do perfil do usuário, incluindo a senha hasheada para login com credenciais.
-- O 'id' desta tabela é uma chave estrangeira para next_auth.users.id.
--
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL PRIMARY KEY, -- Chave primária, e FK para next_auth.users.id
    full_name TEXT,
    display_name TEXT,
    email TEXT NOT NULL UNIQUE, -- Email também deve ser único aqui e corresponder ao de next_auth.users
    hashed_password TEXT, -- Para login com credenciais. Pode ser NULL se o usuário só usa OAuth.
    phone TEXT,
    cpf_cnpj TEXT UNIQUE,
    rg TEXT,
    avatar_url TEXT,
    account_type public.account_type_enum NOT NULL DEFAULT 'pessoa',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES next_auth.users(id) ON DELETE CASCADE
);

-- Policies para public.profiles (Exemplo inicial, ajuste conforme necessário)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Permite que usuários anônimos (necessário para a action de signup) insiram novos perfis.
CREATE POLICY "Allow anon to insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- Permite que usuários autenticados leiam seus próprios perfis.
CREATE POLICY "Allow authenticated users to read their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id); -- auth.uid() é o padrão do Supabase. Para NextAuth, usamos next_auth.uid() se o token for o JWT do Supabase.
                                     -- Se o token for o JWT do NextAuth, a verificação do ID deve ser feita na lógica da aplicação ou com o token do NextAuth.
                                     -- O SupabaseAdapter usa service_role_key, então RLS é bypassada por ele.
                                     -- Para acesso direto do cliente com token do Supabase gerado pelo NextAuth, next_auth.uid() é mais apropriado.
                                     -- Por ora, vamos manter auth.uid() e ajustar se necessário, ou confiar que o acesso será via Server Actions/API Routes que usam o Service Role ou um cliente com token.

-- Permite que usuários autenticados atualizem seus próprios perfis.
CREATE POLICY "Allow authenticated users to update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Permite que o serviço (ex: server actions com service_role_key ou o SupabaseAdapter) leia qualquer perfil (necessário para login).
-- Esta policy é mais para o caso de acesso com chaves de API menos privilegiadas.
-- O adapter, usando service_role_key, já bypassa RLS.
-- Para a checagem de email no signup (que usa anon key), precisamos de uma policy específica.
CREATE POLICY "Allow service to read profiles for login/check" ON public.profiles
  FOR SELECT TO service_role USING (true);

CREATE POLICY "Allow anon to select email for signup check" ON public.profiles
  FOR SELECT TO anon -- Role anônima
  USING (true); -- Permite ler todas as linhas, mas a query só selecionará o campo 'email'

--
-- Trigger function to create a public.profiles entry when a new user signs up via NextAuth
--
CREATE OR REPLACE FUNCTION public.handle_new_user_from_next_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- Define o search_path explicitamente para garantir que os schemas corretos sejam visíveis
  SET search_path = next_auth, public, extensions;

  INSERT INTO public.profiles (id, email, display_name, full_name, avatar_url, account_type)
  VALUES (
    NEW.id,    -- ID do next_auth.users
    NEW.email, -- Email do next_auth.users
    NEW.name,  -- Mapeia next_auth.users.name para display_name e full_name
    NEW.name,
    NEW.image, -- Mapeia next_auth.users.image para avatar_url
    'pessoa'   -- Define account_type como 'pessoa' por padrão para logins sociais/OAuth
  )
  ON CONFLICT (id) DO UPDATE SET -- Se o perfil já existir (ex: por cadastro com credenciais antes do OAuth)
    -- Atualiza com dados do provedor OAuth se o campo no perfil estiver vazio ou se preferirmos sobrescrever
    email = COALESCE(public.profiles.email, EXCLUDED.email), -- Mantém email existente se já houver, senão usa o do OAuth
    display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
    -- account_type = COALESCE(public.profiles.account_type, 'pessoa'), -- Mantém account_type existente
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop o trigger antigo se existir para evitar duplicatas ou conflitos
DROP TRIGGER IF EXISTS on_next_auth_user_created ON next_auth.users;

-- Create o trigger
CREATE TRIGGER on_next_auth_user_created
  AFTER INSERT ON next_auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_from_next_auth();


-- Create categories table (public.categories)
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE, -- Nulo para categorias padrão
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    icon TEXT,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, name) -- Um usuário não pode ter duas categorias com o mesmo nome
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to default categories" ON public.categories FOR SELECT TO anon, authenticated USING (is_default = true);
CREATE POLICY "Allow users to manage their own categories" ON public.categories FOR ALL USING (auth.uid() = user_id);


-- Create transactions table (public.transactions)
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
CREATE POLICY "Allow users to manage their own transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id);


-- Create budgets table (public.budgets)
CREATE TABLE IF NOT EXISTS public.budgets (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE, -- Orçamento deve ter categoria
    limit_amount NUMERIC(10, 2) NOT NULL,
    spent_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_budget_period_category UNIQUE (user_id, category_id, period_start_date, period_end_date),
    CONSTRAINT check_dates CHECK (period_end_date >= period_start_date)
);
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage their own budgets" ON public.budgets FOR ALL USING (auth.uid() = user_id);


-- ENUM type for financial goal status
CREATE TYPE public.financial_goal_status_enum AS ENUM ('in_progress', 'achieved', 'cancelled');

-- Create financial_goals table (public.financial_goals)
CREATE TABLE IF NOT EXISTS public.financial_goals (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount NUMERIC(10, 2) NOT NULL,
    current_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    deadline_date DATE,
    icon TEXT,
    notes TEXT,
    status public.financial_goal_status_enum NOT NULL DEFAULT 'in_progress',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage their own financial goals" ON public.financial_goals FOR ALL USING (auth.uid() = user_id);


-- Seed default categories (apenas se a tabela estiver vazia e não houver categorias padrão)
INSERT INTO public.categories (name, type, icon, is_default, user_id)
SELECT 'Salário', 'income', 'Briefcase', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Salário' AND is_default = true);

INSERT INTO public.categories (name, type, icon, is_default, user_id)
SELECT 'Alimentação', 'expense', 'Utensils', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Alimentação' AND is_default = true);

INSERT INTO public.categories (name, type, icon, is_default, user_id)
SELECT 'Transporte', 'expense', 'Car', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Transporte' AND is_default = true);

INSERT INTO public.categories (name, type, icon, is_default, user_id)
SELECT 'Moradia', 'expense', 'Home', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Moradia' AND is_default = true);

INSERT INTO public.categories (name, type, icon, is_default, user_id)
SELECT 'Lazer', 'expense', 'Gamepad2', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Lazer' AND is_default = true);

INSERT INTO public.categories (name, type, icon, is_default, user_id)
SELECT 'Saúde', 'expense', 'HeartPulse', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Saúde' AND is_default = true);

INSERT INTO public.categories (name, type, icon, is_default, user_id)
SELECT 'Educação', 'expense', 'BookOpen', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Educação' AND is_default = true);

INSERT INTO public.categories (name, type, icon, is_default, user_id)
SELECT 'Outras Receitas', 'income', 'DollarSign', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Outras Receitas' AND is_default = true);

INSERT INTO public.categories (name, type, icon, is_default, user_id)
SELECT 'Outras Despesas', 'expense', 'Receipt', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Outras Despesas' AND is_default = true);


-- Verification queries (optional, can be run manually after script execution)
-- SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'next_auth';
-- SELECT COUNT(*) as next_auth_users_table_exists FROM pg_tables WHERE schemaname = 'next_auth' AND tablename = 'users';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email';

SELECT 'Schema script executado. Verifique se houve erros e confira as "Exposed schemas" no painel Supabase.' as status;


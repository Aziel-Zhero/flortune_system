
-- Remove o schema 'next_auth' se ele existir, junto com todos os seus objetos.
-- CUIDADO: Isso apagará todas as tabelas e dados dentro do schema next_auth.
DROP SCHEMA IF EXISTS next_auth CASCADE;

-- Remove o schema 'public' se ele existir, junto com todos os seus objetos.
-- CUIDADO: Isso apagará TODAS AS TABELAS E DADOS do schema public (profiles, transactions, etc.).
-- Normalmente, você não faria isso em um banco de dados de produção,
-- mas para desenvolvimento e garantir um estado limpo, pode ser útil.
-- Se quiser preservar dados, comente esta linha e use DROP TABLE IF EXISTS individualmente.
-- DROP SCHEMA IF EXISTS public CASCADE;
-- CREATE SCHEMA public; -- Recria o schema public se você o dropou.

-- Garante que a extensão uuid-ossp esteja disponível.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- Cria o schema 'next_auth' se ele não existir.
CREATE SCHEMA IF NOT EXISTS next_auth;

--
-- Tipos Enum (Enum Types)
--
DROP TYPE IF EXISTS public.account_type_enum CASCADE;
CREATE TYPE public.account_type_enum AS ENUM ('pessoa', 'empresa');

DROP TYPE IF EXISTS public.transaction_type_enum CASCADE;
CREATE TYPE public.transaction_type_enum AS ENUM ('income', 'expense');

DROP TYPE IF EXISTS public.goal_status_enum CASCADE;
CREATE TYPE public.goal_status_enum AS ENUM ('in_progress', 'achieved', 'cancelled');

-- Tipos para Stripe (se for usar)
DROP TYPE IF EXISTS public.subscription_status_enum CASCADE;
CREATE TYPE public.subscription_status_enum AS ENUM (
    'trialing',
    'active',
    'canceled',
    'incomplete',
    'incomplete_expired',
    'past_due',
    'unpaid',
    'paused'
);

DROP TYPE IF EXISTS public.price_type_enum CASCADE;
CREATE TYPE public.price_type_enum AS ENUM ('one_time', 'recurring');

DROP TYPE IF EXISTS public.price_interval_enum CASCADE;
CREATE TYPE public.price_interval_enum AS ENUM ('day', 'week', 'month', 'year');


--
-- Tabelas do NextAuth.js (Auth.js) no schema 'next_auth'
-- Estas são as tabelas padrão usadas pelo SupabaseAdapter.
--
DROP TABLE IF EXISTS next_auth.users CASCADE;
CREATE TABLE next_auth.users (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    name text NULL,
    email text NULL,
    "emailVerified" timestamptz NULL,
    image text NULL,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT email_unique UNIQUE (email)
);

DROP TABLE IF EXISTS next_auth.accounts CASCADE;
CREATE TABLE next_auth.accounts (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
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
    "userId" uuid NULL,
    CONSTRAINT accounts_pkey PRIMARY KEY (id),
    CONSTRAINT provider_unique UNIQUE (provider, "providerAccountId"),
    CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES next_auth.users(id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS next_auth.sessions CASCADE;
CREATE TABLE next_auth.sessions (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    expires timestamptz NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" uuid NULL,
    CONSTRAINT sessions_pkey PRIMARY KEY (id),
    CONSTRAINT sessiontoken_unique UNIQUE ("sessionToken"),
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES next_auth.users(id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS next_auth.verification_tokens CASCADE;
CREATE TABLE next_auth.verification_tokens (
    identifier text NULL,
    token text NOT NULL,
    expires timestamptz NOT NULL,
    CONSTRAINT verification_tokens_pkey PRIMARY KEY (token),
    CONSTRAINT token_identifier_unique UNIQUE (token, identifier)
);


--
-- Tabela de Perfis de Usuário (public.profiles)
-- Armazena informações adicionais do usuário, incluindo senha hasheada para login por credenciais.
--
DROP TABLE IF EXISTS public.profiles CASCADE;
CREATE TABLE public.profiles (
    id uuid NOT NULL, -- Chave primária, DEVE ser o mesmo ID de next_auth.users.id
    full_name text,
    display_name text,
    email text NOT NULL UNIQUE, -- Garante que o email seja único aqui também
    hashed_password text, -- Para login com credenciais
    phone text,
    cpf_cnpj text UNIQUE, -- Pode ser CPF ou CNPJ, dependendo do account_type
    rg text,
    avatar_url text,
    account_type public.account_type_enum,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES next_auth.users(id) ON DELETE CASCADE -- FK para next_auth.users
);
COMMENT ON TABLE public.profiles IS 'Stores user profile information, extending NextAuth users.';
COMMENT ON COLUMN public.profiles.id IS 'Must match the id from next_auth.users table.';

--
-- Tabela de Categorias (public.categories)
--
DROP TABLE IF EXISTS public.categories CASCADE;
CREATE TABLE public.categories (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid, -- Nulo para categorias padrão
    name text NOT NULL,
    type public.transaction_type_enum NOT NULL,
    icon text,
    is_default boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT categories_pkey PRIMARY KEY (id),
    CONSTRAINT categories_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL,
    CONSTRAINT categories_user_name_type_unique UNIQUE (user_id, name, type) -- Usuário não pode ter duas categorias com mesmo nome e tipo
);
COMMENT ON TABLE public.categories IS 'Stores transaction categories, including default and user-defined ones.';

--
-- Tabela de Transações (public.transactions)
--
DROP TABLE IF EXISTS public.transactions CASCADE;
CREATE TABLE public.transactions (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL,
    category_id uuid,
    description text NOT NULL,
    amount numeric(12, 2) NOT NULL,
    date date NOT NULL,
    type public.transaction_type_enum NOT NULL,
    notes text,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT transactions_pkey PRIMARY KEY (id),
    CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT transactions_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.transactions IS 'Stores all financial transactions for users.';

--
-- Tabela de Orçamentos (public.budgets)
--
DROP TABLE IF EXISTS public.budgets CASCADE;
CREATE TABLE public.budgets (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL,
    category_id uuid NOT NULL,
    limit_amount numeric(12, 2) NOT NULL,
    spent_amount numeric(12, 2) NOT NULL DEFAULT 0.00,
    period_start_date date NOT NULL,
    period_end_date date NOT NULL,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT budgets_pkey PRIMARY KEY (id),
    CONSTRAINT budgets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT budgets_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE,
    CONSTRAINT budgets_check_dates CHECK (period_end_date >= period_start_date),
    CONSTRAINT budgets_user_category_period_unique UNIQUE (user_id, category_id, period_start_date, period_end_date)
);
COMMENT ON TABLE public.budgets IS 'Stores user-defined budgets for specific categories and periods.';

--
-- Tabela de Metas Financeiras (public.financial_goals)
--
DROP TABLE IF EXISTS public.financial_goals CASCADE;
CREATE TABLE public.financial_goals (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL,
    name text NOT NULL,
    target_amount numeric(12, 2) NOT NULL,
    current_amount numeric(12, 2) NOT NULL DEFAULT 0.00,
    deadline_date date,
    icon text,
    notes text,
    status public.goal_status_enum NOT NULL DEFAULT 'in_progress',
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT financial_goals_pkey PRIMARY KEY (id),
    CONSTRAINT financial_goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT financial_goals_check_amounts CHECK (current_amount >= 0 AND target_amount > 0 AND current_amount <= target_amount)
);
COMMENT ON TABLE public.financial_goals IS 'Stores user financial goals and tracks their progress.';

--
-- Tabela de Lista de Tarefas (public.todos)
--
DROP TABLE IF EXISTS public.todos CASCADE;
CREATE TABLE public.todos (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL,
    description text NOT NULL,
    is_completed boolean NOT NULL DEFAULT false,
    due_date date,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT todos_pkey PRIMARY KEY (id),
    CONSTRAINT todos_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.todos IS 'Stores user tasks or to-do items.';

--
-- Tabelas para Assinaturas (Stripe)
--
DROP TABLE IF EXISTS public.prices CASCADE;
CREATE TABLE public.prices (
    id text NOT NULL, -- Price ID from Stripe, e.g. price_123
    product_id text, -- Product ID from Stripe, e.g. prod_123
    active boolean,
    currency text,
    description text,
    type public.price_type_enum,
    unit_amount bigint, -- Amount in cents
    "interval" public.price_interval_enum,
    interval_count integer,
    trial_period_days integer,
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT prices_pkey PRIMARY KEY (id)
    -- Se product_id for FK para uma tabela 'products', adicione aqui.
);
COMMENT ON TABLE public.prices IS 'Stores pricing information, potentially synced from Stripe.';

DROP TABLE IF EXISTS public.subscriptions CASCADE;
CREATE TABLE public.subscriptions (
    id text NOT NULL, -- Subscription ID from Stripe, e.g. sub_123
    user_id uuid NOT NULL, -- FK to next_auth.users.id
    status public.subscription_status_enum,
    metadata jsonb,
    price_id text, -- FK to prices.id
    quantity integer,
    cancel_at_period_end boolean,
    created timestamptz NOT NULL, -- Stripe 'created' timestamp
    current_period_start timestamptz NOT NULL,
    current_period_end timestamptz NOT NULL,
    ended_at timestamptz,
    cancel_at timestamptz,
    canceled_at timestamptz,
    trial_start timestamptz,
    trial_end timestamptz,
    CONSTRAINT subscriptions_pkey PRIMARY KEY (id),
    CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES next_auth.users(id) ON DELETE CASCADE,
    CONSTRAINT subscriptions_price_id_fkey FOREIGN KEY (price_id) REFERENCES public.prices(id) ON DELETE NO ACTION
);
COMMENT ON TABLE public.subscriptions IS 'Stores user subscription data, potentially synced from Stripe.';

--
-- Função de Trigger para sincronizar novos usuários do NextAuth para public.profiles
--
DROP FUNCTION IF EXISTS public.handle_new_user_from_next_auth();
CREATE OR REPLACE FUNCTION public.handle_new_user_from_next_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER -- Importante para permitir que a função modifique public.profiles
AS $$
BEGIN
  -- Tenta inserir um novo perfil. Se o ID já existir (por exemplo, criado pela action signupUser),
  -- atualiza os campos que podem vir do provedor OAuth ou do NextAuth.
  -- Não sobrescreve campos que a action signupUser preencheu com mais detalhes (como account_type, cpf_cnpj, rg, hashed_password).
  INSERT INTO public.profiles (id, email, display_name, avatar_url, full_name, account_type)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.name, -- display_name em profiles pode ser preenchido por NEW.name do NextAuth (que é user.name)
    NEW.image, -- avatar_url em profiles pode ser preenchido por NEW.image do NextAuth
    NEW.name,   -- full_name em profiles pode ser preenchido por NEW.name do NextAuth (como um fallback)
    null        -- account_type é preenchido pela action signupUser, não pelo NextAuth default. Aqui seria null para OAuth.
  )
  ON CONFLICT ON CONSTRAINT profiles_pkey -- Usa o nome da constraint da chave primária
  DO UPDATE SET
    email = COALESCE(EXCLUDED.email, public.profiles.email), -- Prioriza novo email se fornecido, senão mantém o existente
    -- Atualiza display_name e avatar_url APENAS SE o perfil existente não tiver um display_name (para OAuth)
    -- ou se o valor existente for o placeholder padrão.
    -- Evita sobrescrever um display_name/avatar_url já personalizado pelo usuário.
    display_name = CASE
                      WHEN public.profiles.display_name IS NULL OR public.profiles.display_name = '' OR public.profiles.display_name LIKE 'https://placehold.co/%' THEN EXCLUDED.display_name
                      ELSE public.profiles.display_name
                   END,
    avatar_url = CASE
                    WHEN public.profiles.avatar_url IS NULL OR public.profiles.avatar_url = '' OR public.profiles.avatar_url LIKE 'https://placehold.co/%' THEN EXCLUDED.avatar_url
                    ELSE public.profiles.avatar_url
                 END,
    -- full_name também pode ser atualizado com a mesma lógica, se desejado.
    full_name = CASE
                    WHEN public.profiles.full_name IS NULL OR public.profiles.full_name = '' THEN EXCLUDED.full_name
                    ELSE public.profiles.full_name
                 END,
    updated_at = timezone('utc'::text, now())
  WHERE public.profiles.id = EXCLUDED.id; -- Garante que a atualização ocorra apenas para o ID correspondente
  RETURN NEW;
END;
$$;

-- Trigger que chama a função acima quando um novo usuário é criado em next_auth.users
DROP TRIGGER IF EXISTS on_next_auth_user_created ON next_auth.users;
CREATE TRIGGER on_next_auth_user_created
  AFTER INSERT ON next_auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_from_next_auth();

--
-- Políticas de Row Level Security (RLS)
--

-- Habilitar RLS para todas as tabelas no schema 'public' e 'next_auth'
ALTER TABLE next_auth.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE next_auth.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE next_auth.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE next_auth.verification_tokens ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas para next_auth.users (Padrão do SupabaseAdapter + RLS explícito)
DROP POLICY IF EXISTS "Allow all access for service_role" ON next_auth.users;
CREATE POLICY "Allow all access for service_role" ON next_auth.users FOR ALL TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "Allow individual user access" ON next_auth.users;
CREATE POLICY "Allow individual user access" ON next_auth.users FOR ALL
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow anon to read users for OAuth linking" ON next_auth.users;
CREATE POLICY "Allow anon to read users for OAuth linking" ON next_auth.users FOR SELECT
    TO anon
    USING (true); -- Permite que o anon leia (ex: para verificar se um email OAuth já existe)


-- Políticas para next_auth.accounts (Padrão do SupabaseAdapter + RLS explícito)
DROP POLICY IF EXISTS "Allow all access for service_role" ON next_auth.accounts;
CREATE POLICY "Allow all access for service_role" ON next_auth.accounts FOR ALL TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "Allow individual user access" ON next_auth.accounts;
CREATE POLICY "Allow individual user access" ON next_auth.accounts FOR ALL
    USING (auth.uid() = "userId")
    WITH CHECK (auth.uid() = "userId");

-- Políticas para next_auth.sessions (Padrão do SupabaseAdapter + RLS explícito)
DROP POLICY IF EXISTS "Allow all access for service_role" ON next_auth.sessions;
CREATE POLICY "Allow all access for service_role" ON next_auth.sessions FOR ALL TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "Allow individual user access" ON next_auth.sessions;
CREATE POLICY "Allow individual user access" ON next_auth.sessions FOR ALL
    USING (auth.uid() = "userId")
    WITH CHECK (auth.uid() = "userId");

-- Políticas para next_auth.verification_tokens (Geralmente gerenciadas pelo Adapter)
DROP POLICY IF EXISTS "Allow all access for service_role" ON next_auth.verification_tokens;
CREATE POLICY "Allow all access for service_role" ON next_auth.verification_tokens FOR ALL TO service_role WITH CHECK (true);


-- Políticas para public.profiles
DROP POLICY IF EXISTS "Allow individual user to read/update their own profile" ON public.profiles;
CREATE POLICY "Allow individual user to read/update their own profile"
  ON public.profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow anon to insert their own profile on signup" ON public.profiles;
CREATE POLICY "Allow anon to insert their own profile on signup"
  ON public.profiles FOR INSERT
  TO anon -- A action `signupUser` usa a anon key
  WITH CHECK (true); -- A validação (email único, etc.) é feita na action e por constraints da tabela

DROP POLICY IF EXISTS "Allow anon to select email from profiles for signup check" ON public.profiles;
CREATE POLICY "Allow anon to select email from profiles for signup check"
  ON public.profiles FOR SELECT
  TO anon
  USING (true); -- Permite que a action verifique se um email já existe

DROP POLICY IF EXISTS "Allow service_role full access to profiles" ON public.profiles;
CREATE POLICY "Allow service_role full access to profiles"
  ON public.profiles FOR ALL
  TO service_role
  WITH CHECK (true);

-- Políticas para public.categories
DROP POLICY IF EXISTS "Allow user to manage their own categories" ON public.categories;
CREATE POLICY "Allow user to manage their own categories"
  ON public.categories FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow authenticated users to read default categories" ON public.categories;
CREATE POLICY "Allow authenticated users to read default categories"
  ON public.categories FOR SELECT
  TO authenticated
  USING (is_default = true);

DROP POLICY IF EXISTS "Allow anon to read default categories" ON public.categories;
CREATE POLICY "Allow anon to read default categories"
  ON public.categories FOR SELECT
  TO anon
  USING (is_default = true);

-- Políticas para public.transactions
DROP POLICY IF EXISTS "Allow user to manage their own transactions" ON public.transactions;
CREATE POLICY "Allow user to manage their own transactions"
  ON public.transactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas para public.budgets
DROP POLICY IF EXISTS "Allow user to manage their own budgets" ON public.budgets;
CREATE POLICY "Allow user to manage their own budgets"
  ON public.budgets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas para public.financial_goals
DROP POLICY IF EXISTS "Allow user to manage their own financial goals" ON public.financial_goals;
CREATE POLICY "Allow user to manage their own financial goals"
  ON public.financial_goals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas para public.todos
DROP POLICY IF EXISTS "Allow user to manage their own todos" ON public.todos;
CREATE POLICY "Allow user to manage their own todos"
  ON public.todos FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas para public.prices (geralmente apenas leitura para usuários)
DROP POLICY IF EXISTS "Allow public read access to prices" ON public.prices;
CREATE POLICY "Allow public read access to prices"
  ON public.prices FOR SELECT
  TO authenticated, anon
  USING (true);

-- Políticas para public.subscriptions (usuários gerenciam suas próprias assinaturas)
DROP POLICY IF EXISTS "Allow user to manage their own subscriptions" ON public.subscriptions;
CREATE POLICY "Allow user to manage their own subscriptions"
  ON public.subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


--
-- Inserção de Dados Iniciais (Default Categories)
--
INSERT INTO public.categories (user_id, name, type, icon, is_default) VALUES
  (NULL, 'Salário', 'income', 'DollarSign', TRUE),
  (NULL, 'Freelance', 'income', 'Briefcase', TRUE),
  (NULL, 'Investimentos', 'income', 'TrendingUp', TRUE),
  (NULL, 'Outras Receitas', 'income', 'Pocket', TRUE),
  (NULL, 'Alimentação', 'expense', 'Utensils', TRUE),
  (NULL, 'Moradia', 'expense', 'Home', TRUE),
  (NULL, 'Transporte', 'expense', 'Car', TRUE),
  (NULL, 'Saúde', 'expense', 'HeartPulse', TRUE),
  (NULL, 'Educação', 'expense', 'BookOpen', TRUE),
  (NULL, 'Lazer', 'expense', 'Gamepad2', TRUE),
  (NULL, 'Vestuário', 'expense', 'Shirt', TRUE),
  (NULL, 'Contas (Água, Luz, Internet)', 'expense', 'Receipt', TRUE),
  (NULL, 'Impostos', 'expense', 'Landmark', TRUE),
  (NULL, 'Outras Despesas', 'expense', 'Archive', TRUE)
ON CONFLICT (user_id, name, type) WHERE user_id IS NULL DO NOTHING; -- Evita duplicar categorias padrão se o script for rodado múltiplas vezes


-- Grant USAGE on schemas
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA next_auth TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Grant permissions for anon role
GRANT SELECT ON TABLE public.categories TO anon; -- Se quiser que anônimos vejam categorias padrão
GRANT SELECT ON TABLE public.prices TO anon;
GRANT INSERT ON TABLE public.profiles TO anon; -- Necessário para a action de signup

-- Grant permissions for authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.budgets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.financial_goals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.todos TO authenticated;
GRANT SELECT ON TABLE public.prices TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.subscriptions TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA next_auth TO authenticated; -- Permite que o adapter gerencie as tabelas next_auth

-- Grant all permissions for postgres and service_role (supabase_admin)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA next_auth TO postgres, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA next_auth TO postgres, service_role;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA next_auth TO postgres, service_role;

-- Alter default privileges (important for future tables created by migrations)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA next_auth GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA next_auth GRANT ALL ON SEQUENCES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA next_auth GRANT ALL ON FUNCTIONS TO postgres, service_role;

-- Certifique-se que o usuário `authenticator` (usado internamente pelo Supabase para RLS) possa executar funções.
-- Se o seu `auth.uid()` não estiver funcionando nas policies, esta pode ser uma causa.
-- GRANT USAGE ON SCHEMA public TO authenticator;
-- GRANT USAGE ON SCHEMA next_auth TO authenticator;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticator;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA next_auth TO authenticator;

-- Nota: Os GRANTS para 'authenticated' e 'anon' são geralmente gerenciados pelas políticas RLS,
-- mas é bom ter os grants de USAGE no schema e SELECT/INSERT/UPDATE/DELETE básicos nas tabelas
-- que as policies depois restringirão. O `service_role` (supabase_admin) bypassa RLS.

-- Expor o schema `next_auth` para a API do Supabase (necessário para o Adapter)
-- ISSO DEVE SER FEITO NO PAINEL DO SUPABASE: Project Settings -> API -> Exposed schemas.
-- Certifique-se de que 'public' e 'next_auth' (e 'extensions' se usar) estejam na lista.

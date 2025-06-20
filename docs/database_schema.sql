
-- Esquema `next_auth` para o SupabaseAdapter (Auth.js)
CREATE SCHEMA IF NOT EXISTS next_auth;

-- Garante que a extensão uuid-ossp está disponível no schema extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- Tabela de Usuários (gerenciada pelo SupabaseAdapter)
-- Esta tabela é automaticamente criada e gerenciada pelo SupabaseAdapter.
-- Não precisamos definir explicitamente aqui, mas é bom saber sua estrutura esperada.
-- CREATE TABLE IF NOT EXISTS next_auth.users (
--     id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
--     name text,
--     email text UNIQUE,
--     "emailVerified" timestamptz,
--     image text
-- );

-- Tabela de Contas (gerenciada pelo SupabaseAdapter)
-- CREATE TABLE IF NOT EXISTS next_auth.accounts (
--     id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
--     "userId" uuid REFERENCES next_auth.users(id) ON DELETE CASCADE,
--     type text NOT NULL,
--     provider text NOT NULL,
--     "providerAccountId" text NOT NULL,
--     refresh_token text,
--     access_token text,
--     expires_at bigint,
--     token_type text,
--     scope text,
--     id_token text,
--     session_state text,
--     UNIQUE (provider, "providerAccountId")
-- );

-- Tabela de Sessões (gerenciada pelo SupabaseAdapter)
-- CREATE TABLE IF NOT EXISTS next_auth.sessions (
--     id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
--     expires timestamptz NOT NULL,
--     "sessionToken" text NOT NULL UNIQUE,
--     "userId" uuid REFERENCES next_auth.users(id) ON DELETE CASCADE
-- );

-- Tabela de Tokens de Verificação (gerenciada pelo SupabaseAdapter)
-- CREATE TABLE IF NOT EXISTS next_auth.verification_tokens (
--     identifier text,
--     token text NOT NULL UNIQUE,
--     expires timestamptz NOT NULL,
--     PRIMARY KEY (identifier, token)
-- );


-- Tabela de Perfis de Usuário (Flortune)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL PRIMARY KEY, -- Referencia next_auth.users.id
    full_name TEXT,
    display_name TEXT,
    email TEXT NOT NULL UNIQUE,
    hashed_password TEXT, -- Para login com credenciais
    phone TEXT,
    cpf_cnpj TEXT UNIQUE,
    rg TEXT,
    avatar_url TEXT,
    account_type TEXT CHECK (account_type IN ('pessoa', 'empresa')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Comentários para public.profiles
COMMENT ON TABLE public.profiles IS 'Stores user profile information, extending NextAuth users.';
COMMENT ON COLUMN public.profiles.id IS 'User ID, references next_auth.users.id.';
COMMENT ON COLUMN public.profiles.account_type IS 'Type of account: ''pessoa'' (individual) or ''empresa'' (company).';

-- Tabela de Categorias
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE, -- Nulo para categorias padrão
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    icon TEXT,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_category_name UNIQUE (user_id, name, type),
    CONSTRAINT default_category_name_unique UNIQUE (name, type, is_default) WHERE (is_default = TRUE)
);
COMMENT ON TABLE public.categories IS 'Stores transaction categories, including default and user-defined ones.';

-- Tabela de Transações
CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    date DATE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    notes TEXT,
    is_recurring BOOLEAN DEFAULT FALSE, -- Nova coluna para transações recorrentes
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.transactions IS 'Records all financial transactions for users.';
COMMENT ON COLUMN public.transactions.is_recurring IS 'Indicates if the transaction is recurring (e.g., monthly subscription).';

-- Tabela de Orçamentos
CREATE TABLE IF NOT EXISTS public.budgets (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    limit_amount NUMERIC(12, 2) NOT NULL,
    spent_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_budget_for_category_period UNIQUE (user_id, category_id, period_start_date, period_end_date),
    CHECK (period_end_date >= period_start_date)
);
COMMENT ON TABLE public.budgets IS 'Stores user-defined budgets for specific categories and periods.';

-- Tabela de Metas Financeiras
CREATE TABLE IF NOT EXISTS public.financial_goals (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount NUMERIC(12, 2) NOT NULL,
    current_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    deadline_date DATE,
    icon TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'achieved', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.financial_goals IS 'Tracks user''s financial goals and their progress.';

-- Tabela de Lista de Tarefas (To-Dos)
CREATE TABLE IF NOT EXISTS public.todos (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE NOT NULL,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);
COMMENT ON TABLE public.todos IS 'Stores user''s to-do items.';


-- Tabela de Preços (para Assinaturas, gerenciado manualmente ou por Stripe webhooks)
CREATE TABLE IF NOT EXISTS public.prices (
    id text NOT NULL PRIMARY KEY, -- Price ID from Stripe, e.g. price_123
    product_id text REFERENCES public.products(id) ON DELETE SET NULL, -- Product ID from Stripe, e.g. prod_123
    active boolean,
    currency text,
    description text,
    type text CHECK (type IN ('one_time', 'recurring')),
    unit_amount bigint, -- Amount in cents
    interval text CHECK (interval IN ('day', 'week', 'month', 'year')),
    interval_count integer,
    trial_period_days integer,
    metadata jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.prices IS 'Stores pricing information for products, potentially synced with Stripe.';

-- Tabela de Produtos (para Assinaturas, gerenciado manualmente ou por Stripe webhooks)
CREATE TABLE IF NOT EXISTS public.products (
    id text NOT NULL PRIMARY KEY, -- Product ID from Stripe, e.g. prod_123
    active boolean,
    name text,
    description text,
    image text,
    metadata jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.products IS 'Stores product information, potentially synced with Stripe.';


-- Tabela de Assinaturas (gerenciado por Stripe webhooks ou manualmente)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id text NOT NULL PRIMARY KEY, -- Subscription ID from Stripe, e.g. sub_123
    user_id uuid NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
    status text CHECK (status IN ('trialing', 'active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid', 'paused')),
    metadata jsonb,
    price_id text REFERENCES public.prices(id) ON DELETE SET NULL,
    quantity integer,
    cancel_at_period_end boolean,
    created timestamptz NOT NULL,
    current_period_start timestamptz NOT NULL,
    current_period_end timestamptz NOT NULL,
    ended_at timestamptz,
    cancel_at timestamptz,
    canceled_at timestamptz,
    trial_start timestamptz,
    trial_end timestamptz
);
COMMENT ON TABLE public.subscriptions IS 'Stores user subscription information, potentially synced with Stripe.';


-- Trigger para atualizar `updated_at` automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar o trigger a todas as tabelas relevantes do schema public
DO $$
DECLARE
    t_name TEXT;
BEGIN
    FOR t_name IN
        SELECT table_name FROM information_schema.columns
        WHERE table_schema = 'public' AND column_name = 'updated_at'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS préférences_updated_at ON public.%I;', t_name);
        EXECUTE format('CREATE TRIGGER préférences_updated_at
                        BEFORE UPDATE ON public.%I
                        FOR EACH ROW
                        EXECUTE FUNCTION public.handle_updated_at();', t_name);
    END LOOP;
END;
$$;


-- Trigger para sincronizar dados de next_auth.users para public.profiles
-- Este trigger é CRUCIAL para o funcionamento do SupabaseAdapter com a tabela public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user_from_next_auth()
RETURNS TRIGGER AS $$
DECLARE
    profile_exists BOOLEAN;
BEGIN
    -- Definir search_path para garantir que `extensions.uuid_generate_v4()` seja encontrado se necessário
    SET LOCAL search_path = public, extensions;

    -- Verificar se já existe um perfil com o ID do novo usuário do next_auth
    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) INTO profile_exists;

    IF profile_exists THEN
        -- Se o perfil já existe (ex: criado pela action de signup manual),
        -- apenas atualiza o email e avatar_url se vierem do NextAuth e não estiverem já definidos.
        -- Não sobrescrever `hashed_password` ou outros campos importantes aqui.
        UPDATE public.profiles
        SET
            email = COALESCE(NEW.email, public.profiles.email), -- Prioriza o email do NextAuth se novo
            avatar_url = COALESCE(public.profiles.avatar_url, NEW.image) -- Prioriza avatar existente, senão usa do NextAuth
        WHERE id = NEW.id;
    ELSE
        -- Se o perfil não existe (ex: usuário se cadastrou via OAuth), cria um novo.
        INSERT INTO public.profiles (id, email, display_name, full_name, avatar_url, account_type)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.name, SPLIT_PART(NEW.email, '@', 1)), -- Usa o nome do NextAuth ou parte do email
            NEW.name, -- full_name pode ser o mesmo que name do OAuth
            NEW.image,
            'pessoa' -- Assume 'pessoa' para cadastros via OAuth, pode ser ajustado se necessário
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- SECURITY DEFINER é importante aqui

-- Aplicar o trigger à tabela next_auth.users
DROP TRIGGER IF EXISTS on_next_auth_user_created ON next_auth.users;
CREATE TRIGGER on_next_auth_user_created
    AFTER INSERT ON next_auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_from_next_auth();


-- Políticas de RLS (Row Level Security)

-- Habilitar RLS para todas as tabelas no schema public
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;


-- Policies para public.profiles
DROP POLICY IF EXISTS "Allow authenticated users to read their own profile" ON public.profiles;
CREATE POLICY "Allow authenticated users to read their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow authenticated users to update their own profile" ON public.profiles;
CREATE POLICY "Allow authenticated users to update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Política para permitir que a server action de signup (que usa anon key) insira um novo perfil.
-- O UUID do perfil é gerado na action e deve corresponder ao futuro user.id do next_auth.
-- A verificação de email duplicado já é feita na server action antes do insert.
DROP POLICY IF EXISTS "Allow anon to insert their own profile on signup" ON public.profiles;
CREATE POLICY "Allow anon to insert their own profile on signup"
  ON public.profiles FOR INSERT
  TO anon
  WITH CHECK (true); -- A action de signup deve validar os dados.

-- Política para permitir que a função handle_new_user_from_next_auth (SECURITY DEFINER) insira/atualize perfis
-- Esta política é necessária porque o trigger é SECURITY DEFINER e opera com os privilégios do definidor.
-- No entanto, como o trigger já tem esses privilégios, uma política explícita para a role do definidor
-- não é estritamente necessária, mas garante clareza se a role do definidor for, por exemplo, 'postgres'.
-- Se o definidor for 'postgres', ele já bypassa RLS.
-- Se o trigger fosse SECURITY INVOKER, precisaria que a role 'supabase_auth_admin' tivesse permissão.
-- Para simplificar e garantir, permitimos que a role `service_role` (que o Supabase internamente pode usar para funções definer)
-- possa inserir, o que é geralmente seguro para triggers controlados.
DROP POLICY IF EXISTS "Allow service_role to insert/update profiles via trigger" ON public.profiles;
CREATE POLICY "Allow service_role to insert/update profiles via trigger"
  ON public.profiles FOR ALL
  TO service_role -- A role que efetivamente executa o trigger SECURITY DEFINER
  USING (true)
  WITH CHECK (true);

-- Política para permitir que `anon` leia emails para verificar duplicação no signup.
DROP POLICY IF EXISTS "Allow anon to select email from profiles for signup check" ON public.profiles;
CREATE POLICY "Allow anon to select email from profiles for signup check"
  ON public.profiles FOR SELECT
  TO anon
  USING (true); -- Permite ler todos os emails; a query na action deve ser .eq('email', input_email)


-- Policies para public.categories
DROP POLICY IF EXISTS "Allow authenticated users to CRUD their own categories" ON public.categories;
CREATE POLICY "Allow authenticated users to CRUD their own categories"
  ON public.categories FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to read default categories" ON public.categories;
CREATE POLICY "Allow users to read default categories"
  ON public.categories FOR SELECT
  TO authenticated, anon -- Permite que anônimos também leiam, se necessário para UI antes do login
  USING (is_default = TRUE);


-- Policies para public.transactions
DROP POLICY IF EXISTS "Allow authenticated users to CRUD their own transactions" ON public.transactions;
CREATE POLICY "Allow authenticated users to CRUD their own transactions"
  ON public.transactions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- Policies para public.budgets
DROP POLICY IF EXISTS "Allow authenticated users to CRUD their own budgets" ON public.budgets;
CREATE POLICY "Allow authenticated users to CRUD their own budgets"
  ON public.budgets FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- Policies para public.financial_goals
DROP POLICY IF EXISTS "Allow authenticated users to CRUD their own financial_goals" ON public.financial_goals;
CREATE POLICY "Allow authenticated users to CRUD their own financial_goals"
  ON public.financial_goals FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies para public.todos
DROP POLICY IF EXISTS "Allow authenticated users to CRUD their own todos" ON public.todos;
CREATE POLICY "Allow authenticated users to CRUD their own todos"
    ON public.todos FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policies para public.products (geralmente apenas leitura para usuários)
DROP POLICY IF EXISTS "Allow public read access to products" ON public.products;
CREATE POLICY "Allow public read access to products"
  ON public.products FOR SELECT
  TO authenticated, anon
  USING (active = TRUE);

-- Policies para public.prices (geralmente apenas leitura para usuários)
DROP POLICY IF EXISTS "Allow public read access to prices" ON public.prices;
CREATE POLICY "Allow public read access to prices"
  ON public.prices FOR SELECT
  TO authenticated, anon
  USING (active = TRUE);

-- Policies para public.subscriptions
DROP POLICY IF EXISTS "Allow authenticated users to read their own subscriptions" ON public.subscriptions;
CREATE POLICY "Allow authenticated users to read their own subscriptions"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- (Opcional) Permitir que o serviço (ou webhooks) gerencie assinaturas.
-- Isso geralmente é feito com a service_role_key, que bypassa RLS,
-- ou através de funções SECURITY DEFINER.
DROP POLICY IF EXISTS "Allow service_role to manage subscriptions" ON public.subscriptions;
CREATE POLICY "Allow service_role to manage subscriptions"
  ON public.subscriptions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- Popular com categorias padrão (se a tabela estiver vazia)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.categories WHERE is_default = TRUE) THEN
        INSERT INTO public.categories (name, type, icon, is_default) VALUES
        ('Salário', 'income', 'Briefcase', TRUE),
        ('Freelance', 'income', 'Laptop', TRUE),
        ('Investimentos', 'income', 'DollarSign', TRUE),
        ('Presentes Recebidos', 'income', 'Gift', TRUE),
        ('Outras Receitas', 'income', 'TrendingUp', TRUE),
        ('Moradia', 'expense', 'Home', TRUE),
        ('Alimentação', 'expense', 'Pizza', TRUE),
        ('Transporte', 'expense', 'Car', TRUE),
        ('Saúde', 'expense', 'HeartPulse', TRUE),
        ('Educação', 'expense', 'BookOpen', TRUE),
        ('Lazer', 'expense', 'Gamepad2', TRUE),
        ('Vestuário', 'expense', 'Shirt', TRUE),
        ('Cuidados Pessoais', 'expense', 'SparklesIcon', TRUE), -- Usar SparklesIcon como placeholder
        ('Contas e Assinaturas', 'expense', 'Receipt', TRUE),
        ('Impostos', 'expense', 'Landmark', TRUE),
        ('Doações', 'expense', 'Handshake', TRUE),
        ('Compras Diversas', 'expense', 'ShoppingBag', TRUE),
        ('Animais de Estimação', 'expense', 'Dog', TRUE),
        ('Viagens', 'expense', 'Plane', TRUE),
        ('Outras Despesas', 'expense', 'TrendingDown', TRUE);
    END IF;
END $$;
    
-- Assegurar que o schema next_auth está visível para a API do Supabase
-- (Normalmente feito no painel do Supabase -> API -> Exposed schemas)
-- Se precisar via SQL (menos comum para config de API):
-- ALTER DEFAULT PRIVILEGES IN SCHEMA next_auth GRANT USAGE ON SCHEMAS TO supabase_auth_admin;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA next_auth GRANT ALL ON TABLES TO supabase_auth_admin;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA next_auth GRANT ALL ON SEQUENCES TO supabase_auth_admin;
-- GRANT USAGE ON SCHEMA next_auth TO supabase_auth_admin;
-- GRANT ALL ON ALL TABLES IN SCHEMA next_auth TO supabase_auth_admin;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA next_auth TO supabase_auth_admin;
-- GRANT USAGE ON SCHEMA next_auth TO authenticated; -- Permite que usuários autenticados usem o schema
-- GRANT SELECT ON ALL TABLES IN SCHEMA next_auth TO authenticated; -- Permite SELECT nas tabelas
-- Para o adapter, a role `service_role` (usada pela service_role_key) já tem privilégios.
-- A role `authenticator` (usada para JWTs de usuário) também precisa de permissões no schema `next_auth`.
-- O Supabase geralmente configura isso automaticamente, mas é bom ter em mente.

-- Verificar se as roles `anon` e `authenticated` têm USAGE no schema `next_auth`
-- e SELECT/INSERT/UPDATE/DELETE nas tabelas do schema `next_auth` conforme necessário pelo adapter.
-- O SupabaseAdapter internamente usa a chave de serviço (`SUPABASE_SERVICE_ROLE_KEY`) que tem privilégios amplos.
-- As permissões do usuário (anon, authenticated) para o schema `next_auth` são menos críticas
-- quando o adapter é usado do lado do servidor com a chave de serviço.
-- No entanto, para que o trigger `handle_new_user_from_next_auth` (SECURITY DEFINER) funcione corretamente
-- ao ser disparado por uma operação do adapter (que usa service_role), a role `postgres` (ou a role definidora)
-- deve ter as permissões necessárias em `public.profiles`.


-- Garantir que o usuário `authenticator` (que o Supabase usa para sessões JWT de usuário)
-- possa acessar o schema `next_auth` e suas tabelas.
-- Isto é geralmente configurado por padrão pelo Supabase, mas para garantir:
GRANT USAGE ON SCHEMA next_auth TO authenticator;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA next_auth TO authenticator;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA next_auth TO authenticator;

-- A role `supabase_auth_admin` (usada pelo Supabase internamente para Auth) também precisa de acesso.
GRANT USAGE ON SCHEMA next_auth TO supabase_auth_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA next_auth TO supabase_auth_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA next_auth TO supabase_auth_admin;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA next_auth TO supabase_auth_admin;

-- A role `service_role` (usada pela chave de serviço) normalmente já tem todos os privilégios.

```
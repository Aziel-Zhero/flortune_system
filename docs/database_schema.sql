
-- Script de Criação do Esquema do Banco de Dados Flortune
-- Compatível com PostgreSQL (Supabase)
-- Versão: 3.0

-- 0. Limpeza (Opcional - CUIDADO: Apaga dados existentes)
-- Descomente e execute se precisar recriar tudo do zero.
/*
DROP TRIGGER IF EXISTS on_public_profiles_update ON public.profiles;
DROP FUNCTION IF EXISTS public.moddatetime();

DROP TRIGGER IF EXISTS trg_set_public_profiles_updated_at ON public.profiles;
DROP FUNCTION IF EXISTS public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_handle_new_user_from_next_auth ON next_auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_from_next_auth();

DROP TABLE IF EXISTS public.todos CASCADE;
DROP TABLE IF EXISTS public.financial_goals CASCADE;
DROP TABLE IF EXISTS public.budgets CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE; -- ATENÇÃO: Isso também dropará a dependência de next_auth.users.id se a FK estiver lá.

-- Tabelas do NextAuth.js (Supabase Adapter)
DROP TABLE IF EXISTS next_auth.accounts CASCADE;
DROP TABLE IF EXISTS next_auth.sessions CASCADE;
DROP TABLE IF EXISTS next_auth.users CASCADE;
DROP TABLE IF EXISTS next_auth.verification_tokens CASCADE;
DROP SCHEMA IF EXISTS next_auth CASCADE;

-- Tabelas de Assinaturas (Stripe)
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.prices CASCADE;
DROP TYPE IF EXISTS public.subscription_status_enum CASCADE;


DROP TYPE IF EXISTS public.account_type_enum CASCADE;
DROP TYPE IF EXISTS public.transaction_type_enum CASCADE;
DROP TYPE IF EXISTS public.category_type_enum CASCADE;
DROP TYPE IF EXISTS public.goal_status_enum CASCADE;


DROP EXTENSION IF EXISTS "uuid-ossp";
*/

-- 1. Habilitar Extensões (se ainda não habilitadas)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- 2. Criar Schemas (se necessário, 'public' já existe)
-- O schema 'next_auth' será criado pelo Supabase Adapter, mas podemos criá-lo aqui.
CREATE SCHEMA IF NOT EXISTS next_auth;

-- 3. Tipos ENUM reutilizáveis
CREATE TYPE public.account_type_enum AS ENUM ('pessoa', 'empresa');
CREATE TYPE public.transaction_type_enum AS ENUM ('income', 'expense');
CREATE TYPE public.category_type_enum AS ENUM ('income', 'expense');
CREATE TYPE public.goal_status_enum AS ENUM ('in_progress', 'achieved', 'cancelled');

-- 4. Tabela `public.profiles` (Detalhes dos Usuários do Aplicativo)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY, -- Referencia next_auth.users.id. Não adicione FK direta aqui para permitir criação antecipada.
    full_name TEXT,
    display_name TEXT,
    email TEXT NOT NULL UNIQUE,
    hashed_password TEXT, -- Para login com credenciais. Nulo se usuário só usa OAuth.
    phone TEXT,
    cpf_cnpj TEXT UNIQUE, -- Armazena CPF ou CNPJ, dependendo do tipo de conta. Adicionada constraint UNIQUE.
    rg TEXT,
    avatar_url TEXT,
    account_type public.account_type_enum,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.profiles IS 'Stores user profile information specific to the Flortune application, complementing NextAuth users.';
COMMENT ON COLUMN public.profiles.id IS 'User ID, same as next_auth.users.id.';
COMMENT ON COLUMN public.profiles.cpf_cnpj IS 'CPF for individual accounts, CNPJ for business accounts. Must be unique.';

-- 5. Tabelas do NextAuth.js (gerenciadas pelo SupabaseAdapter)
-- Estas são as definições padrão esperadas pelo @auth/supabase-adapter
-- User table (next_auth.users)
CREATE TABLE next_auth.users (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    name text NULL,
    email text NULL,
    "emailVerified" timestamptz NULL,
    image text NULL,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT email_unique UNIQUE (email) -- Garante que email é único
);
COMMENT ON TABLE next_auth.users IS 'Stores user authentication data managed by NextAuth.js.';

-- Session table (next_auth.sessions)
CREATE TABLE next_auth.sessions (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    expires timestamptz NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" uuid NULL,
    CONSTRAINT sessions_pkey PRIMARY KEY (id),
    CONSTRAINT "sessionToken_unique" UNIQUE ("sessionToken"),
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES next_auth.users(id) ON DELETE CASCADE
);
COMMENT ON TABLE next_auth.sessions IS 'Stores active user sessions for NextAuth.js.';

-- Account table (next_auth.accounts)
CREATE TABLE next_auth.accounts (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    type text NOT NULL,
    provider text NOT NULL,
    "providerAccountId" text NOT NULL,
    refresh_token text NULL,
    access_token text NULL,
    expires_at bigint NULL,
    token_type text NULL,
    scope text NULL,
    id_token text NULL,
    session_state text NULL,
    oauth_token_secret text NULL,
    oauth_token text NULL,
    "userId" uuid NULL,
    CONSTRAINT accounts_pkey PRIMARY KEY (id),
    CONSTRAINT "provider_unique" UNIQUE (provider, "providerAccountId"),
    CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES next_auth.users(id) ON DELETE CASCADE
);
COMMENT ON TABLE next_auth.accounts IS 'Stores OAuth account linkage information for NextAuth.js.';

-- Verification token table (next_auth.verification_tokens)
CREATE TABLE next_auth.verification_tokens (
    identifier text NULL,
    token text NOT NULL,
    expires timestamptz NOT NULL,
    CONSTRAINT verification_tokens_pkey PRIMARY KEY (token),
    CONSTRAINT "token_identifier_unique" UNIQUE (token, identifier) -- Garante combinação única
);
COMMENT ON TABLE next_auth.verification_tokens IS 'Stores tokens for email verification in NextAuth.js (e.g., magic links).';


-- 6. Função e Trigger para sincronizar `public.profiles` com `next_auth.users`
-- Esta função é crucial. Roda como SECURITY DEFINER para ter permissões de escrita na tabela public.profiles.
-- O search_path é setado localmente para a função.
CREATE OR REPLACE FUNCTION public.handle_new_user_from_next_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- IMPORTANTE: Executa com as permissões do criador da função (geralmente superusuário)
AS $$
BEGIN
    -- Define o search_path localmente para a execução desta função
    SET LOCAL search_path = public, extensions;

    -- Insere um novo perfil em public.profiles se um usuário for adicionado em next_auth.users
    -- Se o perfil já existir (conflito no ID), atualiza campos selecionados.
    -- Isso cobre tanto o cadastro via OAuth (onde o perfil pode não existir)
    -- quanto o login via Credentials (onde o perfil já foi criado pela action signupUser).
    INSERT INTO public.profiles (id, email, display_name, avatar_url, account_type, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.name, -- Vem de next_auth.users.name
        NEW.image, -- Vem de next_auth.users.image
        'pessoa', -- Assume 'pessoa' por padrão; se já existir com 'empresa', NÃO será sobrescrito abaixo
        NOW(),
        NOW()
    )
    ON CONFLICT ON CONSTRAINT profiles_pkey -- Alvo é a restrição da chave primária 'profiles_pkey'
    DO UPDATE SET
        -- Apenas atualiza campos se o valor do provedor OAuth for mais recente ou se o campo no perfil estiver vazio.
        -- Preserva dados importantes como full_name, hashed_password, cpf_cnpj, account_type que podem ter sido definidos pela action de signup.
        email = EXCLUDED.email, -- Email do next_auth.users (EXCLUDED refere-se aos valores da linha que seria inserida)
        display_name = CASE
                          WHEN public.profiles.display_name IS NULL OR public.profiles.display_name = public.profiles.email THEN EXCLUDED.display_name -- Se display_name atual for nulo ou igual ao email, usa o do provider
                          ELSE public.profiles.display_name -- Caso contrário, mantém o display_name customizado já existente
                       END,
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url), -- Prefere novo avatar_url se existir, senão mantém o antigo
        -- NÃO ATUALIZAR: full_name, hashed_password, phone, cpf_cnpj, rg, account_type
        -- Esses campos são gerenciados pela action de signup ou pelo usuário em suas configurações de perfil.
        updated_at = NOW()
    ;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_handle_new_user_from_next_auth
AFTER INSERT ON next_auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_from_next_auth();

COMMENT ON FUNCTION public.handle_new_user_from_next_auth() IS 'Synchronizes new user entries from next_auth.users to public.profiles.';
COMMENT ON TRIGGER trg_handle_new_user_from_next_auth ON next_auth.users IS 'After a user is inserted into next_auth.users, this trigger ensures a corresponding profile exists in public.profiles.';

-- 7. Função para atualizar `updated_at` automaticamente
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar o trigger de updated_at em todas as tabelas relevantes
CREATE TRIGGER trg_set_public_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- 8. Tabela `public.categories`
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- Nulo para categorias padrão
    name TEXT NOT NULL,
    type public.category_type_enum NOT NULL,
    icon TEXT,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_set_public_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
COMMENT ON TABLE public.categories IS 'Stores transaction categories, including default and user-defined ones.';

-- 9. Tabela `public.transactions`
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    date DATE NOT NULL,
    type public.transaction_type_enum NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_set_public_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
COMMENT ON TABLE public.transactions IS 'Stores all financial transactions for users.';

-- 10. Tabela `public.budgets`
CREATE TABLE public.budgets (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    limit_amount NUMERIC(12, 2) NOT NULL,
    spent_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_budget_period_category UNIQUE (user_id, category_id, period_start_date, period_end_date)
);
CREATE TRIGGER trg_set_public_budgets_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
COMMENT ON TABLE public.budgets IS 'Stores user-defined budgets for specific categories and periods.';

-- 11. Tabela `public.financial_goals`
CREATE TABLE public.financial_goals (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount NUMERIC(12, 2) NOT NULL,
    current_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    deadline_date DATE,
    icon TEXT,
    notes TEXT,
    status public.goal_status_enum NOT NULL DEFAULT 'in_progress',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_set_public_financial_goals_updated_at BEFORE UPDATE ON public.financial_goals FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
COMMENT ON TABLE public.financial_goals IS 'Stores user financial goals and tracks their progress.';

-- 12. Tabela `public.todos` (Nova tabela para lista de tarefas)
CREATE TABLE public.todos (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    due_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_set_public_todos_updated_at BEFORE UPDATE ON public.todos FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
COMMENT ON TABLE public.todos IS 'Stores user to-do list items.';


-- 13. Tabelas para Assinaturas (Stripe - Estrutura básica para futura integração)
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

CREATE TABLE public.prices (
    id TEXT PRIMARY KEY, -- Price ID from Stripe, e.g. price_123...
    product_id TEXT,     -- Product ID from Stripe, e.g. prod_123...
    active BOOLEAN,
    currency TEXT,
    description TEXT,
    type public.category_type_enum, -- 'one_time' or 'recurring' (usando category_type_enum por simplicidade, idealmente seria um enum price_type)
    unit_amount BIGINT, -- Amount in cents
    interval TEXT, -- 'day', 'week', 'month', 'year'
    interval_count INTEGER,
    trial_period_days INTEGER,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_set_public_prices_updated_at BEFORE UPDATE ON public.prices FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
COMMENT ON TABLE public.prices IS 'Stores pricing information for subscription plans, mirroring Stripe Price objects.';

CREATE TABLE public.subscriptions (
    id TEXT PRIMARY KEY, -- Subscription ID from Stripe, e.g. sub_123...
    user_id UUID NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE, -- FK para next_auth.users.id
    status public.subscription_status_enum,
    metadata JSONB,
    price_id TEXT REFERENCES public.prices(id),
    quantity INTEGER,
    cancel_at_period_end BOOLEAN,
    created TIMESTAMPTZ NOT NULL, -- Stripe's `created` timestamp
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    cancel_at TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW() -- Coluna local para `updated_at`
);
CREATE TRIGGER trg_set_public_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
COMMENT ON TABLE public.subscriptions IS 'Stores user subscription status, mirroring Stripe Subscription objects.';


-- 14. Políticas de Row Level Security (RLS)

-- Habilitar RLS para todas as tabelas relevantes
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas para public.profiles
DROP POLICY IF EXISTS "Allow authenticated users to read their own profile" ON public.profiles;
CREATE POLICY "Allow authenticated users to read their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Allow authenticated users to update their own profile" ON public.profiles;
CREATE POLICY "Allow authenticated users to update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Allow anon to insert their own profile on signup" ON public.profiles;
CREATE POLICY "Allow anon to insert their own profile on signup"
  ON public.profiles FOR INSERT
  TO anon -- A server action de signup (usando anon key) fará a inserção inicial.
  WITH CHECK (true); -- A validação de email duplicado e outros campos é feita na server action.

DROP POLICY IF EXISTS "Allow service_role to manage all profiles" ON public.profiles;
CREATE POLICY "Allow service_role to manage all profiles"
  ON public.profiles FOR ALL
  TO service_role -- Necessário para o SupabaseAdapter e triggers SECURITY DEFINER.
  USING (true)
  WITH CHECK (true);

-- Políticas para public.categories
DROP POLICY IF EXISTS "Allow authenticated users to manage their categories" ON public.categories;
CREATE POLICY "Allow authenticated users to manage their categories"
  ON public.categories FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Allow all users to read default categories" ON public.categories;
CREATE POLICY "Allow all users to read default categories"
  ON public.categories FOR SELECT
  TO public -- anon e authenticated
  USING (is_default = TRUE);

-- Políticas para public.transactions
DROP POLICY IF EXISTS "Allow authenticated users to manage their transactions" ON public.transactions;
CREATE POLICY "Allow authenticated users to manage their transactions"
  ON public.transactions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Políticas para public.budgets
DROP POLICY IF EXISTS "Allow authenticated users to manage their budgets" ON public.budgets;
CREATE POLICY "Allow authenticated users to manage their budgets"
  ON public.budgets FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Políticas para public.financial_goals
DROP POLICY IF EXISTS "Allow authenticated users to manage their financial_goals" ON public.financial_goals;
CREATE POLICY "Allow authenticated users to manage their financial_goals"
  ON public.financial_goals FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Políticas para public.todos (Nova tabela)
DROP POLICY IF EXISTS "Allow authenticated users to manage their todos" ON public.todos;
CREATE POLICY "Allow authenticated users to manage their todos"
  ON public.todos FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Políticas para public.prices (Geralmente apenas leitura para usuários)
DROP POLICY IF EXISTS "Allow all users to read prices" ON public.prices;
CREATE POLICY "Allow all users to read prices"
  ON public.prices FOR SELECT
  TO public -- anon e authenticated
  USING (active = TRUE);

DROP POLICY IF EXISTS "Allow service_role to manage prices" ON public.prices;
CREATE POLICY "Allow service_role to manage prices"
  ON public.prices FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Políticas para public.subscriptions
DROP POLICY IF EXISTS "Allow authenticated users to read their own subscriptions" ON public.subscriptions;
CREATE POLICY "Allow authenticated users to read their own subscriptions"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Allow service_role to manage subscriptions" ON public.subscriptions;
CREATE POLICY "Allow service_role to manage subscriptions"
  ON public.subscriptions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 15. Dados Iniciais (Opcional - Categorias Padrão)
INSERT INTO public.categories (name, type, icon, is_default) VALUES
('Salário', 'income', 'DollarSign', TRUE),
('Freelance', 'income', 'Briefcase', TRUE),
('Investimentos', 'income', 'TrendingUp', TRUE),
('Outras Receitas', 'income', 'PlusCircle', TRUE),
('Moradia', 'expense', 'Home', TRUE),
('Alimentação', 'expense', 'Utensils', TRUE),
('Transporte', 'expense', 'Car', TRUE),
('Saúde', 'expense', 'HeartPulse', TRUE),
('Educação', 'expense', 'BookOpen', TRUE),
('Lazer', 'expense', 'Gamepad2', TRUE),
('Vestuário', 'expense', 'Shirt', TRUE),
('Contas e Serviços', 'expense', 'Receipt', TRUE),
('Impostos', 'expense', 'Landmark', TRUE),
('Doações', 'expense', 'Gift', TRUE),
('Compras Diversas', 'expense', 'ShoppingBag', TRUE),
('Cuidados Pessoais', 'expense', 'Sparkles', TRUE),
('Viagens', 'expense', 'Plane', TRUE),
('Assinaturas', 'expense', 'CreditCard', TRUE),
('Animais de Estimação', 'expense', 'Dog', TRUE),
('Filhos/Dependentes', 'expense', 'Baby', TRUE),
('Dívidas/Empréstimos', 'expense', 'BadgePercent', TRUE),
('Outras Despesas', 'expense', 'MinusCircle', TRUE)
ON CONFLICT (name, type) DO NOTHING; -- Evita duplicatas se o script for rodado múltiplas vezes

-- 16. Configurar o schema `next_auth` para ser exposto pela API do Supabase
-- Esta etapa é feita no painel do Supabase: Project Settings > API > Config > Exposed schemas
-- Certifique-se de que `public` e `next_auth` estão selecionados.

-- Fim do script
SELECT 'Flortune Database Schema V3.0 Setup Complete.';

-- ### FLORTUNE DATABASE SCHEMA ###
-- Este script configura o banco de dados PostgreSQL para a aplicação Flortune no Supabase.

-- === Configuração Inicial e Extensões ===
-- Garante que o schema 'extensions' exista.
CREATE SCHEMA IF NOT EXISTS extensions;

-- Habilita a extensão 'uuid-ossp' para gerar UUIDs, se ainda não estiver habilitada.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- Habilita a extensão 'moddatetime' para atualizar timestamps automaticamente.
-- Esta extensão é crucial para os triggers de 'updated_at'.
CREATE EXTENSION IF NOT EXISTS "moddatetime" WITH SCHEMA extensions;


-- === Schema para NextAuth.js (Auth.js) ===
-- O SupabaseAdapter do NextAuth.js requer este schema e as tabelas dentro dele.
CREATE TABLE IF NOT EXISTS next_auth.users (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    name text,
    email text,
    "emailVerified" timestamp with time zone,
    image text,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_email_key UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS next_auth.accounts (
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
    "userId" uuid,
    CONSTRAINT accounts_pkey PRIMARY KEY (id),
    CONSTRAINT "accounts_provider_providerAccountId_key" UNIQUE (provider, "providerAccountId"),
    CONSTRAINT accounts_userId_fkey FOREIGN KEY ("userId") REFERENCES next_auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS next_auth.sessions (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    expires timestamp with time zone NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" uuid,
    CONSTRAINT sessions_pkey PRIMARY KEY (id),
    CONSTRAINT "sessions_sessionToken_key" UNIQUE ("sessionToken"),
    CONSTRAINT sessions_userId_fkey FOREIGN KEY ("userId") REFERENCES next_auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS next_auth.verification_tokens (
    identifier text,
    token text,
    expires timestamp with time zone NOT NULL,
    CONSTRAINT "verification_tokens_token_key" UNIQUE (token),
    CONSTRAINT verification_tokens_pkey PRIMARY KEY (identifier, token)
);


-- === Schema Público da Aplicação ===

-- Tabela de Perfis de Usuário
-- Esta tabela armazena informações detalhadas dos usuários, estendendo 'next_auth.users'.
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL,
    full_name text,
    display_name text,
    email text NOT NULL,
    hashed_password text,
    phone text,
    cpf_cnpj text,
    rg text,
    avatar_url text,
    account_type text, -- 'pessoa' ou 'empresa'
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_email_key UNIQUE (email),
    CONSTRAINT profiles_cpf_cnpj_key UNIQUE (cpf_cnpj),
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES next_auth.users(id) ON DELETE CASCADE
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Tabela de Categorias (para transações, orçamentos, etc.)
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid,
    name text NOT NULL,
    type text NOT NULL, -- 'income' ou 'expense'
    icon text,
    is_default boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT categories_pkey PRIMARY KEY (id),
    CONSTRAINT categories_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Tabela de Transações Financeiras
CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL,
    category_id uuid,
    description text NOT NULL,
    amount numeric(12, 2) NOT NULL,
    date date NOT NULL,
    type text NOT NULL, -- 'income' ou 'expense'
    notes text,
    is_recurring boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT transactions_pkey PRIMARY KEY (id),
    CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT transactions_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Tabela de Orçamentos
CREATE TABLE IF NOT EXISTS public.budgets (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL,
    category_id uuid NOT NULL,
    limit_amount numeric(12, 2) NOT NULL,
    spent_amount numeric(12, 2) NOT NULL DEFAULT 0.00,
    period_start_date date NOT NULL,
    period_end_date date NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT budgets_pkey PRIMARY KEY (id),
    CONSTRAINT budgets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT budgets_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE
);
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Tabela de Metas Financeiras
CREATE TABLE IF NOT EXISTS public.financial_goals (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL,
    name text NOT NULL,
    target_amount numeric(12, 2) NOT NULL,
    current_amount numeric(12, 2) NOT NULL DEFAULT 0.00,
    deadline_date date,
    icon text,
    notes text,
    status text NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'achieved', 'cancelled'
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT financial_goals_pkey PRIMARY KEY (id),
    CONSTRAINT financial_goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;

-- Tabela de Tarefas (To-Do List)
CREATE TABLE IF NOT EXISTS public.todos (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL,
    description text NOT NULL,
    is_completed boolean NOT NULL DEFAULT false,
    due_date date,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT todos_pkey PRIMARY KEY (id),
    CONSTRAINT todos_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Tabela de Preços (para Planos/Assinaturas)
CREATE TABLE IF NOT EXISTS public.prices (
    id text NOT NULL, -- Price ID from Stripe
    product_id text, -- Product ID from Stripe
    active boolean,
    currency text,
    description text,
    type text,
    unit_amount bigint,
    interval text,
    interval_count integer,
    trial_period_days integer,
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT prices_pkey PRIMARY KEY (id)
);
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;

-- Tabela de Assinaturas dos Usuários
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id text NOT NULL, -- Subscription ID from Stripe
    user_id uuid NOT NULL,
    status text,
    metadata jsonb,
    price_id text,
    quantity integer,
    cancel_at_period_end boolean,
    created timestamptz NOT NULL,
    current_period_start timestamptz NOT NULL,
    current_period_end timestamptz NOT NULL,
    ended_at timestamptz,
    cancel_at timestamptz,
    canceled_at timestamptz,
    trial_start timestamptz,
    trial_end timestamptz,
    CONSTRAINT subscriptions_pkey PRIMARY KEY (id),
    CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES next_auth.users(id) ON DELETE CASCADE,
    CONSTRAINT subscriptions_price_id_fkey FOREIGN KEY (price_id) REFERENCES public.prices(id)
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;


-- === Políticas de Segurança RLS (Row Level Security) ===

-- Perfis: Usuários podem ver e editar seu próprio perfil.
DROP POLICY IF EXISTS "Allow individual read access" ON public.profiles;
CREATE POLICY "Allow individual read access" ON public.profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Allow individual update access" ON public.profiles;
CREATE POLICY "Allow individual update access" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Categorias: Usuários podem gerenciar suas próprias categorias e ver as padrão.
DROP POLICY IF EXISTS "Allow individual access to categories" ON public.categories;
CREATE POLICY "Allow individual access to categories" ON public.categories FOR ALL USING (auth.uid() = user_id OR is_default = true);

-- Transações: Usuários podem gerenciar suas próprias transações.
DROP POLICY IF EXISTS "Allow individual access to transactions" ON public.transactions;
CREATE POLICY "Allow individual access to transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id);

-- Orçamentos: Usuários podem gerenciar seus próprios orçamentos.
DROP POLICY IF EXISTS "Allow individual access to budgets" ON public.budgets;
CREATE POLICY "Allow individual access to budgets" ON public.budgets FOR ALL USING (auth.uid() = user_id);

-- Metas: Usuários podem gerenciar suas próprias metas.
DROP POLICY IF EXISTS "Allow individual access to financial_goals" ON public.financial_goals;
CREATE POLICY "Allow individual access to financial_goals" ON public.financial_goals FOR ALL USING (auth.uid() = user_id);

-- Tarefas: Usuários podem gerenciar suas próprias tarefas.
DROP POLICY IF EXISTS "Allow individual access to todos" ON public.todos;
CREATE POLICY "Allow individual access to todos" ON public.todos FOR ALL USING (auth.uid() = user_id);

-- Assinaturas: Usuários podem ver suas próprias assinaturas.
DROP POLICY IF EXISTS "Allow individual read access on subscriptions" ON public.subscriptions;
CREATE POLICY "Allow individual read access on subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);


-- === Triggers para Manter 'updated_at' Atualizado ===
-- A função moddatetime() é fornecida pela extensão 'moddatetime'.

DROP TRIGGER IF EXISTS on_public_profiles_updated_at ON public.profiles;
CREATE TRIGGER on_public_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');

DROP TRIGGER IF EXISTS on_public_categories_updated_at ON public.categories;
CREATE TRIGGER on_public_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');

DROP TRIGGER IF EXISTS on_public_transactions_updated_at ON public.transactions;
CREATE TRIGGER on_public_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');

DROP TRIGGER IF EXISTS on_public_budgets_updated_at ON public.budgets;
CREATE TRIGGER on_public_budgets_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');

DROP TRIGGER IF EXISTS on_public_financial_goals_updated_at ON public.financial_goals;
CREATE TRIGGER on_public_financial_goals_updated_at BEFORE UPDATE ON public.financial_goals FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');

DROP TRIGGER IF EXISTS on_public_todos_updated_at ON public.todos;
CREATE TRIGGER on_public_todos_updated_at BEFORE UPDATE ON public.todos FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');

DROP TRIGGER IF EXISTS on_public_prices_updated_at ON public.prices;
CREATE TRIGGER on_public_prices_updated_at BEFORE UPDATE ON public.prices FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');


-- === Dados Iniciais (Seed Data) ===

-- Inserir categorias padrão se não existirem
-- Usamos ON CONFLICT DO NOTHING para evitar duplicatas em execuções repetidas.
INSERT INTO public.categories (name, type, icon, is_default) VALUES
    ('Salário', 'income', 'DollarSign', true),
    ('Renda Extra', 'income', 'TrendingUp', true),
    ('Moradia', 'expense', 'Home', true),
    ('Alimentação', 'expense', 'Utensils', true),
    ('Transporte', 'expense', 'Car', true),
    ('Lazer', 'expense', 'Gamepad2', true),
    ('Saúde', 'expense', 'HeartPulse', true),
    ('Educação', 'expense', 'BookOpen', true),
    ('Contas', 'expense', 'Receipt', true),
    ('Investimentos', 'expense', 'PiggyBank', true),
    ('Outros', 'expense', 'Tag', true)
ON CONFLICT (name) WHERE is_default = true DO NOTHING;

-- Fim do Script

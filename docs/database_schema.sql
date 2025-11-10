-- =============================================================================
-- ||| FLORTUNE DATABASE SCHEMA
-- ||| Version: 1.2
-- ||| Description: Complete schema for the Flortune application, including
-- |||              user profiles, core financial tables, dev tools, and
-- |||              admin management tables.
-- =============================================================================

-- Habilita a extensão para gerar UUIDs, caso não esteja habilitada.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- =============================================================================
-- ||| SCHEMA: public - Core Application Tables
-- =============================================================================

-- Tabela de Perfis de Usuário
-- Armazena informações detalhadas dos usuários, complementando a tabela `auth.users` do Supabase.
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    display_name TEXT,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    account_type TEXT NOT NULL CHECK (account_type IN ('pessoa', 'empresa', 'admin')) DEFAULT 'pessoa',
    plan_id TEXT NOT NULL DEFAULT 'tier-cultivador', -- ID do plano de assinatura (ex: 'tier-mestre')
    cpf_cnpj TEXT UNIQUE,
    rg TEXT,
    has_seen_welcome_message BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.profiles IS 'Stores user profile information, extending the base auth.users table.';

-- Tabela de Assinaturas (Subscriptions)
-- Gerencia os planos pagos dos usuários, integrada com o Stripe.
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL, -- ex: 'tier-mestre', 'tier-dev'
    stripe_subscription_id TEXT UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete')),
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.subscriptions IS 'Manages user subscriptions and billing plans.';

-- Tabela de Faturas (Invoices)
-- Armazena o histórico de faturamento para emissão de notas fiscais e controle.
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('paid', 'pending', 'failed')),
    due_date DATE,
    paid_at TIMESTAMPTZ,
    nf_data JSONB, -- Armazena dados da Nota Fiscal eletrônica (XML, URL, etc.)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.invoices IS 'Stores billing history and invoice data for users.';

-- Tabela de Categorias de Transação
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- Nulo para categorias padrão
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    icon TEXT,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, name)
);
COMMENT ON TABLE public.categories IS 'Stores transaction categories, both default and user-defined.';

-- Tabela de Transações
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    date DATE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    notes TEXT,
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.transactions IS 'Core table for all user financial transactions.';

-- Tabela de Orçamentos
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    limit_amount NUMERIC(10, 2) NOT NULL,
    spent_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, category_id, period_start_date)
);
COMMENT ON TABLE public.budgets IS 'Stores user-defined spending limits for categories.';

-- Tabela de Metas Financeiras
CREATE TABLE IF NOT EXISTS public.financial_goals (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount NUMERIC(10, 2) NOT NULL,
    current_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    deadline_date DATE,
    icon TEXT,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'achieved', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.financial_goals IS 'Stores user financial goals and tracks their progress.';

-- Tabela de Lista de Tarefas (Todos)
CREATE TABLE IF NOT EXISTS public.todos (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    due_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.todos IS 'Simple to-do list for users.';

-- Tabela de Anotações (Notepad)
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    color TEXT,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.notes IS 'Stores user notes for the notepad feature.';

-- =============================================================================
-- ||| SCHEMA: dev - Developer Tools Tables
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS dev;

-- Tabela de Clientes e Projetos (para DEV)
CREATE TABLE IF NOT EXISTS dev.clients (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    service_type TEXT,
    status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'delivered', 'on_hold', 'delayed')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    start_date DATE,
    deadline DATE,
    total_price NUMERIC(10, 2),
    notes TEXT,
    tasks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE dev.clients IS 'Stores client and project data for the developer tools section.';

-- Tabela de Serviços Web (para DEV)
CREATE TABLE IF NOT EXISTS dev.web_services (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Dominio', 'VPS', 'Host', 'SaaS', 'Outro')),
    provider TEXT,
    monthly_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
    renewal_date DATE,
    is_client_service BOOLEAN NOT NULL DEFAULT FALSE,
    client_id UUID REFERENCES dev.clients(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE dev.web_services IS 'Stores web service subscriptions like domains and hosting for the dev tools.';

-- =============================================================================
-- ||| SCHEMA: admin - Admin Panel Tables
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS admin;

-- Tabela de Perguntas para Formulários
CREATE TABLE IF NOT EXISTS admin.form_questions (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    text TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('text', 'textarea', 'rating', 'boolean')),
    category TEXT NOT NULL,
    "order" INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE admin.form_questions IS 'Stores questions for user feedback forms, managed by admins.';

-- Tabela de Respostas dos Formulários
CREATE TABLE IF NOT EXISTS admin.form_responses (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES admin.form_questions(id) ON DELETE CASCADE,
    response_value TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE admin.form_responses IS 'Stores user responses to feedback forms.';

-- Tabela de Campanhas Promocionais
CREATE TABLE IF NOT EXISTS admin.campaigns (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    theme_name TEXT UNIQUE NOT NULL,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    discounts JSONB, -- Ex: {"tier-mestre": 20, "tier-dev": 15} (20% e 15% off)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE admin.campaigns IS 'Stores promotional campaign settings managed by admins.';

-- Tabela de Integrações (ex: Telegram)
CREATE TABLE IF NOT EXISTS public.integrations (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE, -- Ligado ao admin que configurou
    telegram_bot_token TEXT,
    telegram_chat_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.integrations IS 'Stores credentials for third-party integrations like Telegram.';


-- =============================================================================
-- ||| TRIGGERS & FUNCTIONS
-- =============================================================================

-- Função para criar um perfil público quando um novo usuário se cadastra no Supabase Auth.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, display_name, avatar_url, account_type, cpf_cnpj, rg, plan_id)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'display_name',
    NEW.raw_user_meta_data ->> 'avatar_url',
    COALESCE(NEW.raw_user_meta_data ->> 'account_type', 'pessoa')::text,
    NEW.raw_user_meta_data ->> 'cpf_cnpj',
    NEW.raw_user_meta_data ->> 'rg',
    'tier-cultivador' -- Plano padrão inicial
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger que chama a função handle_new_user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  
-- Função para atualizar o timestamp 'updated_at' automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar o trigger de updated_at para todas as tabelas relevantes
DO $$
DECLARE
    t_name TEXT;
BEGIN
    FOR t_name IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema IN ('public', 'dev') 
          AND table_name IN ('profiles', 'categories', 'transactions', 'budgets', 'financial_goals', 'todos', 'notes', 'subscriptions', 'integrations', 'clients', 'web_services')
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS set_timestamp ON %I.%I;', table_schema, t_name);
        EXECUTE format('CREATE TRIGGER set_timestamp BEFORE UPDATE ON %I.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();', table_schema, t_name);
    END LOOP;
END;
$$;


-- =============================================================================
-- ||| ROW LEVEL SECURITY (RLS) - Políticas de Acesso
-- =============================================================================

-- Habilitar RLS em todas as tabelas de usuário
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev.web_services ENABLE ROW LEVEL SECURITY;

-- Limpar políticas existentes para garantir um estado limpo
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can view and manage their own subscriptions." ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view their own invoices." ON public.invoices;
DROP POLICY IF EXISTS "Users can manage their own categories." ON public.categories;
DROP POLICY IF EXISTS "Users can view public categories." ON public.categories;
DROP POLICY IF EXISTS "Users can manage their own transactions." ON public.transactions;
DROP POLICY IF EXISTS "Users can manage their own budgets." ON public.budgets;
DROP POLICY IF EXISTS "Users can manage their own financial goals." ON public.financial_goals;
DROP POLICY IF EXISTS "Users can manage their own todos." ON public.todos;
DROP POLICY IF EXISTS "Users can manage their own notes." ON public.notes;
DROP POLICY IF EXISTS "Users can manage their own integrations." ON public.integrations;
DROP POLICY IF EXISTS "Users can manage their own dev clients." ON dev.clients;
DROP POLICY IF EXISTS "Users can manage their own web services." ON dev.web_services;


-- Políticas para a tabela `profiles`
CREATE POLICY "Users can view their own profile." ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Políticas para `subscriptions` e `invoices`
CREATE POLICY "Users can view and manage their own subscriptions." ON public.subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own invoices." ON public.invoices FOR ALL USING (auth.uid() = user_id);

-- Políticas para `categories`
CREATE POLICY "Users can manage their own categories." ON public.categories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view public categories." ON public.categories FOR SELECT USING (is_default = TRUE);

-- Políticas para tabelas financeiras principais
CREATE POLICY "Users can manage their own transactions." ON public.transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own budgets." ON public.budgets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own financial goals." ON public.financial_goals FOR ALL USING (auth.uid() = user_id);

-- Políticas para tabelas de utilidades
CREATE POLICY "Users can manage their own todos." ON public.todos FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own notes." ON public.notes FOR ALL USING (auth.uid() = user_id);

-- Políticas para `integrations`
CREATE POLICY "Users can manage their own integrations." ON public.integrations FOR ALL USING (auth.uid() = user_id);

-- Políticas para o schema `dev`
CREATE POLICY "Users can manage their own dev clients." ON dev.clients FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own web services." ON dev.web_services FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- ||| ADMIN MANAGEMENT
-- ||| Como promover um usuário a administrador
-- =============================================================================
-- Para transformar um usuário comum em administrador, execute o seguinte comando
-- no SQL Editor do seu painel Supabase, substituindo pelo email do usuário.
--
-- 1. Certifique-se de que o usuário já criou uma conta no aplicativo.
-- 2. Execute o comando abaixo.
--
-- UPDATE public.profiles
-- SET account_type = 'admin'
-- WHERE email = 'seu-email-de-admin@exemplo.com';
-- =============================================================================

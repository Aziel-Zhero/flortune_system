-- =================================================================
--  SCRIPT DE CRIAÇÃO DO BANCO DE DADOS - FLORTUNE
-- =================================================================
--  Este script cria o schema, tabelas, funções e políticas de
--  segurança (RLS) necessárias para a aplicação Flortune no Supabase.
--
--  IMPORTANTE: Execute este script completo no SQL Editor do seu
--  projeto Supabase antes de rodar a aplicação.
-- =================================================================


-- =============================================
--  EXTENSÕES
-- =============================================
-- Habilita a função uuid_generate_v4() para gerar UUIDs.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


-- =============================================
--  SCHEMA `public` - Tabelas da Aplicação
-- =============================================

-- ---------------------------------------------
--  Tabela `profiles`
--  Armazena os perfis detalhados dos usuários.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY NOT NULL,
    full_name TEXT,
    display_name TEXT,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    account_type TEXT CHECK (account_type IN ('pessoa', 'empresa')),
    cpf_cnpj TEXT UNIQUE,
    rg TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.profiles IS 'Stores detailed user profile information complementing Supabase Auth.';
COMMENT ON COLUMN public.profiles.id IS 'Primary key, linked to auth.users.id.';
COMMENT ON COLUMN public.profiles.account_type IS 'Distinguishes between individual and business accounts for fiscal purposes.';

-- ---------------------------------------------
--  Tabela `subscriptions`
--  Gerencia as assinaturas dos usuários nos planos pagos.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL, -- Ex: 'tier-mestre', 'tier-dev'
    stripe_subscription_id TEXT UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'past_due', 'incomplete')),
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.subscriptions IS 'Manages user subscriptions to paid plans.';
COMMENT ON COLUMN public.subscriptions.plan_id IS 'Identifier for the subscribed plan, e.g., ''tier-mestre''.';

-- ---------------------------------------------
--  Tabela `invoices`
--  Armazena o histórico de faturas para notas fiscais.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('paid', 'pending', 'failed')),
    due_date DATE,
    paid_at TIMESTAMPTZ,
    nf_data JSONB, -- Para armazenar dados da nota fiscal eletrônica (NFe)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.invoices IS 'Stores billing history for invoicing purposes.';
COMMENT ON COLUMN public.invoices.nf_data IS 'Stores electronic invoice data (e.g., XML, access key).';


-- ---------------------------------------------
--  Tabela `categories`
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    icon TEXT,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.categories IS 'Stores default and user-defined transaction categories.';

-- ---------------------------------------------
--  Tabela `transactions`
-- ---------------------------------------------
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
COMMENT ON TABLE public.transactions IS 'Main table for all user financial transactions.';

-- ---------------------------------------------
--  Tabela `budgets`
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    limit_amount NUMERIC(10, 2) NOT NULL,
    spent_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.budgets IS 'Allows users to set spending limits for categories.';


-- ---------------------------------------------
--  Tabela `financial_goals`
-- ---------------------------------------------
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


-- ---------------------------------------------
--  Tabela `todos`
-- ---------------------------------------------
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

-- ---------------------------------------------
--  Tabela `notes`
-- ---------------------------------------------
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


-- =============================================
--  SCHEMA `dev` - Tabelas para Ferramentas DEV
-- =============================================
CREATE SCHEMA IF NOT EXISTS dev;

-- ---------------------------------------------
--  Tabela `dev.clients`
-- ---------------------------------------------
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
COMMENT ON TABLE dev.clients IS 'Stores data for the "Clients & Projects" developer tool.';

-- ---------------------------------------------
--  Tabela `dev.web_services`
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS dev.web_services (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('Dominio', 'VPS', 'Host', 'SaaS', 'Outro')),
    provider TEXT,
    monthly_cost NUMERIC(10, 2) DEFAULT 0,
    renewal_date DATE,
    is_client_service BOOLEAN DEFAULT FALSE,
    client_id UUID REFERENCES dev.clients(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE dev.web_services IS 'Stores data for the "Web Management" developer tool.';


-- =============================================
--  FUNÇÕES E TRIGGERS
-- =============================================

-- Função para atualizar o `updated_at` automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para `updated_at` em todas as tabelas
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER on_categories_updated
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER on_transactions_updated
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER on_budgets_updated
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER on_financial_goals_updated
  BEFORE UPDATE ON public.financial_goals
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER on_todos_updated
  BEFORE UPDATE ON public.todos
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
  
CREATE TRIGGER on_notes_updated
  BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER on_dev_clients_updated
  BEFORE UPDATE ON dev.clients
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER on_dev_web_services_updated
  BEFORE UPDATE ON dev.web_services
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER on_subscriptions_updated
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- ---------------------------------------------
--  Função e Trigger para `handle_new_user`
--  Cria um perfil em `public.profiles` quando um novo usuário se cadastra no `auth.users`.
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, display_name, avatar_url, account_type, cpf_cnpj, rg, phone)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'display_name',
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'account_type',
        NEW.raw_user_meta_data->>'cpf_cnpj',
        NEW.raw_user_meta_data->>'rg',
        NEW.raw_user_meta_data->>'phone'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- =============================================
--  POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY - RLS)
-- =============================================

-- Habilita RLS para todas as tabelas de dados do usuário
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev.web_services ENABLE ROW LEVEL SECURITY;

-- Remove políticas existentes para garantir um estado limpo
DROP POLICY IF EXISTS "Usuários podem ver e editar seus próprios perfis." ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem gerenciar suas próprias categorias." ON public.categories;
DROP POLICY IF EXISTS "Usuários podem ver categorias padrão." ON public.categories;
DROP POLICY IF EXISTS "Usuários podem gerenciar suas próprias transações." ON public.transactions;
DROP POLICY IF EXISTS "Usuários podem gerenciar seus próprios orçamentos." ON public.budgets;
DROP POLICY IF EXISTS "Usuários podem gerenciar suas próprias metas." ON public.financial_goals;
DROP POLICY IF EXISTS "Usuários podem gerenciar suas próprias tarefas." ON public.todos;
DROP POLICY IF EXISTS "Usuários podem gerenciar suas próprias anotações." ON public.notes;
DROP POLICY IF EXISTS "Usuários podem gerenciar suas próprias assinaturas." ON public.subscriptions;
DROP POLICY IF EXISTS "Usuários podem ver suas próprias faturas." ON public.invoices;
DROP POLICY IF EXISTS "Usuários podem gerenciar seus próprios clientes (DEV)." ON dev.clients;
DROP POLICY IF EXISTS "Usuários podem gerenciar seus próprios serviços web (DEV)." ON dev.web_services;


-- Políticas para `profiles`
CREATE POLICY "Usuários podem ver e editar seus próprios perfis."
  ON public.profiles FOR ALL
  USING (auth.uid() = id);

-- Políticas para `categories`
CREATE POLICY "Usuários podem gerenciar suas próprias categorias."
  ON public.categories FOR ALL
  USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem ver categorias padrão."
  ON public.categories FOR SELECT
  USING (is_default = TRUE);
  
-- Políticas para `transactions`
CREATE POLICY "Usuários podem gerenciar suas próprias transações."
  ON public.transactions FOR ALL
  USING (auth.uid() = user_id);

-- Políticas para `budgets`
CREATE POLICY "Usuários podem gerenciar seus próprios orçamentos."
  ON public.budgets FOR ALL
  USING (auth.uid() = user_id);

-- Políticas para `financial_goals`
CREATE POLICY "Usuários podem gerenciar suas próprias metas."
  ON public.financial_goals FOR ALL
  USING (auth.uid() = user_id);

-- Políticas para `todos`
CREATE POLICY "Usuários podem gerenciar suas próprias tarefas."
  ON public.todos FOR ALL
  USING (auth.uid() = user_id);

-- Políticas para `notes`
CREATE POLICY "Usuários podem gerenciar suas próprias anotações."
  ON public.notes FOR ALL
  USING (auth.uid() = user_id);

-- Políticas para `subscriptions`
CREATE POLICY "Usuários podem gerenciar suas próprias assinaturas."
  ON public.subscriptions FOR ALL
  USING (auth.uid() = user_id);

-- Políticas para `invoices`
CREATE POLICY "Usuários podem ver suas próprias faturas."
  ON public.invoices FOR ALL
  USING (auth.uid() = user_id);

-- Políticas para `dev.clients`
CREATE POLICY "Usuários podem gerenciar seus próprios clientes (DEV)."
  ON dev.clients FOR ALL
  USING (auth.uid() = user_id);

-- Políticas para `dev.web_services`
CREATE POLICY "Usuários podem gerenciar seus próprios serviços web (DEV)."
  ON dev.web_services FOR ALL
  USING (auth.uid() = user_id);


-- =================================================================
-- FIM DO SCRIPT
-- =================================================================

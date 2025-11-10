-- =================================================================
-- Flortune Database Schema
-- Version: 1.0
-- Description: Complete schema for the Flortune application, including
-- tables for user data, application features, developer tools,
-- and administrative management. This script also sets up
-- Row Level Security (RLS) to ensure data privacy.
-- =================================================================

-- Habilitar a extensão para gerar UUIDs se ainda não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- =================================================================
-- 1. PUBLIC SCHEMA - Core Application Tables
-- =================================================================
-- Tabela para armazenar os perfis detalhados dos usuários.
-- Esta tabela complementa a tabela `auth.users` do Supabase.
-- O `id` aqui é uma chave estrangeira para `auth.users.id`.
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Tabela para categorias de transações (receitas e despesas).
-- Inclui categorias padrão (user_id IS NULL) e personalizadas.
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    icon TEXT,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, name, type)
);

-- Tabela principal para todas as transações financeiras.
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    date DATE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    notes TEXT,
    is_recurring BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela para orçamentos mensais por categoria.
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    limit_amount NUMERIC(12, 2) NOT NULL,
    spent_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, category_id, period_start_date)
);

-- Tabela para metas financeiras.
CREATE TABLE IF NOT EXISTS public.financial_goals (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount NUMERIC(12, 2) NOT NULL,
    current_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    deadline_date DATE,
    icon TEXT,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'achieved', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela para a lista de tarefas (To-Do).
CREATE TABLE IF NOT EXISTS public.todos (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    due_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela para o bloco de notas.
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    color TEXT,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =================================================================
-- 2. DEV SCHEMA - Developer Tools Tables
-- =================================================================
CREATE SCHEMA IF NOT EXISTS dev;

-- Tabela para gerenciar clientes e projetos do desenvolvedor.
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

-- Tabela para gerenciar custos de domínios, hospedagens, etc.
CREATE TABLE IF NOT EXISTS dev.web_services (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Dominio', 'VPS', 'Host', 'SaaS', 'Outro')),
    provider TEXT NOT NULL,
    monthly_cost NUMERIC(10, 2) NOT NULL,
    renewal_date DATE NOT NULL,
    is_client_service BOOLEAN DEFAULT false,
    client_id UUID REFERENCES dev.clients(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =================================================================
-- 3. ADMIN SCHEMA - Administrative Tables
-- =================================================================
CREATE SCHEMA IF NOT EXISTS admin;

-- Tabela para armazenar as perguntas dos formulários criados no painel admin.
CREATE TABLE IF NOT EXISTS admin.form_questions (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    text TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('text', 'textarea', 'rating', 'boolean')),
    category TEXT NOT NULL CHECK (category IN ('Geral', 'Usabilidade', 'Design', 'Funcionalidades', 'Recursos')),
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela para armazenar as respostas dos usuários aos formulários.
CREATE TABLE IF NOT EXISTS admin.form_responses (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES admin.form_questions(id) ON DELETE CASCADE,
    response_value TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, question_id)
);

-- Tabela para configurar campanhas promocionais.
CREATE TABLE IF NOT EXISTS admin.campaigns (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    theme_name TEXT UNIQUE,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    discounts JSONB, -- Ex: {"tier-mestre": 20, "tier-dev": 15} (20% e 15% de desconto)
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =================================================================

-- Habilitar RLS em todas as tabelas relevantes
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev.web_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin.form_responses ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para obter o ID do usuário autenticado a partir do JWT.
CREATE OR REPLACE FUNCTION auth.get_user_id() RETURNS UUID AS $$
BEGIN
  RETURN (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::UUID;
EXCEPTION
  WHEN others THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- --- POLÍTICAS PARA `public.profiles` ---
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil." ON public.profiles;
CREATE POLICY "Usuários podem ver seu próprio perfil."
    ON public.profiles FOR SELECT
    USING (auth.get_user_id() = id);

DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil." ON public.profiles;
CREATE POLICY "Usuários podem atualizar seu próprio perfil."
    ON public.profiles FOR UPDATE
    USING (auth.get_user_id() = id)
    WITH CHECK (auth.get_user_id() = id);

-- --- POLÍTICAS PARA `public.categories` ---
DROP POLICY IF EXISTS "Usuários podem gerenciar suas próprias categorias." ON public.categories;
CREATE POLICY "Usuários podem gerenciar suas próprias categorias."
    ON public.categories FOR ALL
    USING (auth.get_user_id() = user_id);

DROP POLICY IF EXISTS "Usuários podem ver categorias padrão." ON public.categories;
CREATE POLICY "Usuários podem ver categorias padrão."
    ON public.categories FOR SELECT
    USING (is_default = true);

-- --- POLÍTICAS PARA `public.transactions` ---
DROP POLICY IF EXISTS "Usuários podem gerenciar suas próprias transações." ON public.transactions;
CREATE POLICY "Usuários podem gerenciar suas próprias transações."
    ON public.transactions FOR ALL
    USING (auth.get_user_id() = user_id);

-- --- POLÍTICAS PARA `public.budgets` ---
DROP POLICY IF EXISTS "Usuários podem gerenciar seus próprios orçamentos." ON public.budgets;
CREATE POLICY "Usuários podem gerenciar seus próprios orçamentos."
    ON public.budgets FOR ALL
    USING (auth.get_user_id() = user_id);

-- --- POLÍTICAS PARA `public.financial_goals` ---
DROP POLICY IF EXISTS "Usuários podem gerenciar suas próprias metas." ON public.financial_goals;
CREATE POLICY "Usuários podem gerenciar suas próprias metas."
    ON public.financial_goals FOR ALL
    USING (auth.get_user_id() = user_id);

-- --- POLÍTICAS PARA `public.todos` ---
DROP POLICY IF EXISTS "Usuários podem gerenciar suas próprias tarefas." ON public.todos;
CREATE POLICY "Usuários podem gerenciar suas próprias tarefas."
    ON public.todos FOR ALL
    USING (auth.get_user_id() = user_id);

-- --- POLÍTICAS PARA `public.notes` ---
DROP POLICY IF EXISTS "Usuários podem gerenciar suas próprias anotações." ON public.notes;
CREATE POLICY "Usuários podem gerenciar suas próprias anotações."
    ON public.notes FOR ALL
    USING (auth.get_user_id() = user_id);

-- --- POLÍTICAS PARA `dev.clients` ---
DROP POLICY IF EXISTS "Usuários DEV podem gerenciar seus próprios clientes." ON dev.clients;
CREATE POLICY "Usuários DEV podem gerenciar seus próprios clientes."
    ON dev.clients FOR ALL
    USING (auth.get_user_id() = user_id);

-- --- POLÍTICAS PARA `dev.web_services` ---
DROP POLICY IF EXISTS "Usuários DEV podem gerenciar seus próprios serviços web." ON dev.web_services;
CREATE POLICY "Usuários DEV podem gerenciar seus próprios serviços web."
    ON dev.web_services FOR ALL
    USING (auth.get_user_id() = user_id);
    
-- --- POLÍTICAS PARA `admin.form_responses` ---
DROP POLICY IF EXISTS "Usuários podem criar suas próprias respostas de formulário." ON admin.form_responses;
CREATE POLICY "Usuários podem criar suas próprias respostas de formulário."
    ON admin.form_responses FOR INSERT
    WITH CHECK (auth.get_user_id() = user_id);

DROP POLICY IF EXISTS "Usuários podem ver suas próprias respostas." ON admin.form_responses;
CREATE POLICY "Usuários podem ver suas próprias respostas."
    ON admin.form_responses FOR SELECT
    USING (auth.get_user_id() = user_id);

-- Os administradores precisarão de uma política bypass RLS ou uma role especial para ver todas as respostas.

-- =================================================================
-- 5. TRIGGERS e FUNÇÕES
-- =================================================================

-- Função para criar um perfil público quando um novo usuário se registra no Supabase Auth.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, display_name, avatar_url, account_type, cpf_cnpj, rg, phone)
  VALUES (
    new.id, 
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'account_type',
    new.raw_user_meta_data->>'cpf_cnpj',
    new.raw_user_meta_data->>'rg',
    new.raw_user_meta_data->>'phone'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que chama a função handle_new_user após a criação de um usuário em auth.users.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função para manter o campo `updated_at` atualizado automaticamente.
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar o trigger de `updated_at` a todas as tabelas que o possuem.
CREATE TRIGGER handle_profiles_update BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER handle_categories_update BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER handle_transactions_update BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER handle_budgets_update BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER handle_financial_goals_update BEFORE UPDATE ON public.financial_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER handle_todos_update BEFORE UPDATE ON public.todos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER handle_notes_update BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER handle_dev_clients_update BEFORE UPDATE ON dev.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER handle_dev_web_services_update BEFORE UPDATE ON dev.web_services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =================================================================
-- Fim do Script
-- =================================================================

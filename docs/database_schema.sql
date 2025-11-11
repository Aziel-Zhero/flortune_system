-- ------------------------------------------------------------------------------------------------
-- FLORTUNE - DATABASE SCHEMA
-- Este script cria todas as tabelas, schemas, triggers e políticas de segurança (RLS)
-- necessárias para a aplicação no Supabase.
--
-- Para usar: Copie e cole todo o conteúdo deste arquivo no SQL Editor do seu painel Supabase
-- e clique em "RUN".
--
-- ATENÇÃO: Executar este script irá apagar e recriar as tabelas existentes,
-- o que resultará na perda de todos os dados. Faça backup se necessário.
-- ------------------------------------------------------------------------------------------------

-- ================================================================================================
-- 1. EXTENSIONS
-- Habilita as extensões necessárias, como uuid-ossp para gerar UUIDs.
-- ================================================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- ================================================================================================
-- 2. SCHEMAS
-- Cria os schemas necessários para a aplicação.
-- `next_auth` é usado pelo NextAuth.js Supabase Adapter.
-- ================================================================================================

CREATE SCHEMA IF NOT EXISTS next_auth;

-- ================================================================================================
-- 3. TABELAS
-- Definição de todas as tabelas da aplicação.
-- O comando `CASCADE` é usado para remover dependências (chaves estrangeiras) ao recriar.
-- ================================================================================================

-- Tabela de Perfis de Usuário (Pública)
-- Armazena informações adicionais do usuário. Ligada ao `auth.users` por ID.
DROP TABLE IF EXISTS public.profiles CASCADE;
CREATE TABLE public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    display_name text,
    email text NOT NULL UNIQUE,
    phone text,
    avatar_url text,
    account_type text, -- 'pessoa' ou 'empresa'
    cpf_cnpj text UNIQUE,
    rg text,
    plan_id text DEFAULT 'tier-cultivador', -- ID do plano de assinatura
    has_seen_welcome_message boolean DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
comment on table public.profiles is 'Stores public-facing profile information for each user.';

-- Tabela de Categorias (Receitas/Despesas)
DROP TABLE IF EXISTS public.categories CASCADE;
CREATE TABLE public.categories (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    type text NOT NULL, -- 'income' or 'expense'
    icon text,
    is_default boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_id, name)
);
comment on table public.categories is 'Stores user-defined and default categories for transactions.';

-- Tabela de Transações
DROP TABLE IF EXISTS public.transactions CASCADE;
CREATE TABLE public.transactions (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    description text NOT NULL,
    amount numeric NOT NULL,
    date date NOT NULL,
    type text NOT NULL, -- 'income' or 'expense'
    notes text,
    is_recurring boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
comment on table public.transactions is 'Stores all financial transactions for each user.';

-- Tabela de Orçamentos
DROP TABLE IF EXISTS public.budgets CASCADE;
CREATE TABLE public.budgets (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    limit_amount numeric NOT NULL,
    spent_amount numeric NOT NULL DEFAULT 0,
    period_start_date date NOT NULL,
    period_end_date date NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_id, category_id, period_start_date)
);
comment on table public.budgets is 'Stores user-defined budgets for specific categories and periods.';

-- Tabela de Metas Financeiras
DROP TABLE IF EXISTS public.financial_goals CASCADE;
CREATE TABLE public.financial_goals (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    target_amount numeric NOT NULL,
    current_amount numeric NOT NULL DEFAULT 0,
    deadline_date date,
    icon text,
    status text NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'achieved', 'cancelled'
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
comment on table public.financial_goals is 'Stores user financial goals and tracks their progress.';

-- Tabela de Tarefas (To-Do List)
DROP TABLE IF EXISTS public.todos CASCADE;
CREATE TABLE public.todos (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    description text NOT NULL,
    is_completed boolean NOT NULL DEFAULT false,
    due_date date,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
comment on table public.todos is 'A simple to-do list for each user.';


-- ================================================================================================
-- 4. TRIGGERS & FUNCTIONS
-- Funções e gatilhos para automatizar tarefas no banco de dados.
-- ================================================================================================

-- Função para criar um perfil público quando um novo usuário se registra no Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name, full_name, avatar_url, account_type, plan_id, has_seen_welcome_message)
    VALUES (
        new.id,
        new.email,
        new.raw_user_meta_data->>'display_name',
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'avatar_url',
        new.raw_user_meta_data->>'account_type',
        new.raw_user_meta_data->>'plan_id',
        COALESCE((new.raw_user_meta_data->>'has_seen_welcome_message')::boolean, false)
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que aciona a função `handle_new_user` após a criação de um usuário no `auth.users`
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função para atualizar o `updated_at` automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para `updated_at` em cada tabela
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_budgets_updated_at ON public.budgets;
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_financial_goals_updated_at ON public.financial_goals;
CREATE TRIGGER update_financial_goals_updated_at BEFORE UPDATE ON public.financial_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_todos_updated_at ON public.todos;
CREATE TRIGGER update_todos_updated_at BEFORE UPDATE ON public.todos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ================================================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- Políticas de segurança que garantem que os usuários só possam acessar seus próprios dados.
-- ================================================================================================

-- Ativa o RLS para todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Políticas para a tabela `profiles`
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Políticas para `categories`
DROP POLICY IF EXISTS "Users can view their own categories and default ones." ON public.categories;
CREATE POLICY "Users can view their own categories and default ones." ON public.categories FOR SELECT USING (auth.uid() = user_id OR is_default = true);

DROP POLICY IF EXISTS "Users can insert their own categories." ON public.categories;
CREATE POLICY "Users can insert their own categories." ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own categories." ON public.categories;
CREATE POLICY "Users can update their own categories." ON public.categories FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own non-default categories." ON public.categories;
CREATE POLICY "Users can delete their own non-default categories." ON public.categories FOR DELETE USING (auth.uid() = user_id AND is_default = false);

-- Políticas para `transactions`
DROP POLICY IF EXISTS "Users can manage their own transactions." ON public.transactions;
CREATE POLICY "Users can manage their own transactions." ON public.transactions FOR ALL USING (auth.uid() = user_id);

-- Políticas para `budgets`
DROP POLICY IF EXISTS "Users can manage their own budgets." ON public.budgets;
CREATE POLICY "Users can manage their own budgets." ON public.budgets FOR ALL USING (auth.uid() = user_id);

-- Políticas para `financial_goals`
DROP POLICY IF EXISTS "Users can manage their own financial goals." ON public.financial_goals;
CREATE POLICY "Users can manage their own financial goals." ON public.financial_goals FOR ALL USING (auth.uid() = user_id);

-- Políticas para `todos`
DROP POLICY IF EXISTS "Users can manage their own todos." ON public.todos;
CREATE POLICY "Users can manage their own todos." ON public.todos FOR ALL USING (auth.uid() = user_id);


-- ================================================================================================
-- 6. DADOS INICIAIS (CATEGORIAS PADRÃO)
-- Insere as categorias padrão que estarão disponíveis para todos os usuários.
-- ================================================================================================

-- Limpa categorias padrão antigas antes de inserir para evitar duplicatas
DELETE FROM public.categories WHERE is_default = true;

INSERT INTO public.categories (name, type, icon, is_default) VALUES
    ('Salário', 'income', 'DollarSign', true),
    ('Investimentos', 'income', 'TrendingUp', true),
    ('Renda Extra', 'income', 'PiggyBank', true),
    ('Presentes (Recebidos)', 'income', 'Gift', true),
    ('Moradia', 'expense', 'Home', true),
    ('Alimentação', 'expense', 'UtensilsCrossed', true),
    ('Transporte', 'expense', 'Car', true),
    ('Saúde', 'expense', 'HeartPulse', true),
    ('Lazer', 'expense', 'GlassWater', true),
    ('Educação', 'expense', 'BookOpen', true),
    ('Compras', 'expense', 'ShoppingBag', true),
    ('Viagens', 'expense', 'Plane', true),
    ('Impostos', 'expense', 'Landmark', true),
    ('Serviços', 'expense', 'Cog', true), -- (luz, água, internet)
    ('Outros', 'expense', 'Grip', true);

-- ================================================================================================
-- FIM DO SCRIPT
-- ================================================================================================

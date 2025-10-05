
-- ========== ATENÇÃO! SCRIPT DE DESTRUIÇÃO E RECRIAÇÃO ==========
-- Este script irá APAGAR todas as tabelas, tipos e funções do schema 'public'
-- e recriá-los do zero. FAÇA BACKUP se tiver dados importantes.
--------------------------------------------------------------------

-- Inicia uma transação para garantir que tudo seja executado ou nada
BEGIN;

-- 1. ========== LIMPEZA DO SCHEMA ANTIGO ==========

-- Remove políticas de segurança de todas as tabelas (em ordem reversa de dependência)
DROP POLICY IF EXISTS "Allow anon to insert their own profile on signup" ON public.profiles;
DROP POLICY IF EXISTS "Allow service_role to insert new profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Enable all actions for users based on user_id" ON public.dev_clients;
DROP POLICY IF EXISTS "Enable all actions for users based on user_id" ON public.notes;
DROP POLICY IF EXISTS "Enable all actions for users based on user_id" ON public.todos;
DROP POLICY IF EXISTS "Enable all actions for users based on user_id" ON public.financial_goals;
DROP POLICY IF EXISTS "Enable all actions for users based on user_id" ON public.budgets;
DROP POLICY IF EXISTS "Users can delete their own transactions." ON public.transactions;
DROP POLICY IF EXISTS "Users can update their own transactions." ON public.transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions." ON public.transactions;
DROP POLICY IF EXISTS "Users can view their own transactions." ON public.transactions;
DROP POLICY IF EXISTS "Users can manage their own categories." ON public.categories;
DROP POLICY IF EXISTS "Allow authenticated users to read default categories" ON public.categories;


-- Apaga as tabelas em ordem de dependência (tabelas que são referenciadas por outras são apagadas primeiro)
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.budgets CASCADE;
DROP TABLE IF EXISTS public.financial_goals CASCADE;
DROP TABLE IF EXISTS public.todos CASCADE;
DROP TABLE IF EXISTS public.notes CASCADE;
DROP TABLE IF EXISTS public.dev_clients CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Apaga as tabelas de API
DROP TABLE IF EXISTS public.weather_logs CASCADE;
DROP TABLE IF EXISTS public.api_cities CASCADE;
DROP TABLE IF EXISTS public.quote_logs CASCADE;
DROP TABLE IF EXISTS public.financial_assets CASCADE;

-- Apaga os ENUMs customizados
DROP TYPE IF EXISTS public.account_type;
DROP TYPE IF EXISTS public.transaction_type;
DROP TYPE IF EXISTS public.goal_status;
DROP TYPE IF EXISTS public.dev_client_status;
DROP TYPE IF EXISTS public.dev_client_priority;
DROP TYPE IF EXISTS public.asset_type;

-- 2. ========== CRIAÇÃO DOS TIPOS (ENUMS) ==========

CREATE TYPE public.account_type AS ENUM ('pessoa', 'empresa');
CREATE TYPE public.transaction_type AS ENUM ('income', 'expense');
CREATE TYPE public.goal_status AS ENUM ('in_progress', 'achieved', 'cancelled');
CREATE TYPE public.dev_client_status AS ENUM ('planning', 'in_progress', 'delivered', 'on_hold', 'delayed');
CREATE TYPE public.dev_client_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.asset_type AS ENUM ('currency', 'stock_index', 'commodity');


-- 3. ========== CRIAÇÃO DAS TABELAS ==========

-- Tabela de Perfis de Usuário
CREATE TABLE public.profiles (
    id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    display_name TEXT,
    email TEXT NOT NULL UNIQUE,
    hashed_password TEXT,
    phone TEXT,
    avatar_url TEXT,
    account_type public.account_type,
    cpf_cnpj TEXT UNIQUE,
    rg TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.profiles IS 'Stores public profile information for each user.';

-- Tabela de Categorias
CREATE TABLE public.categories (
    id UUID NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type public.transaction_type NOT NULL,
    icon TEXT,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.categories IS 'Stores transaction categories, both default and user-created.';

-- Tabela de Transações
CREATE TABLE public.transactions (
    id UUID NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    amount NUMERIC(18, 2) NOT NULL,
    date DATE NOT NULL,
    type public.transaction_type NOT NULL,
    notes TEXT,
    is_recurring BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.transactions IS 'Stores all income and expense transactions for each user.';

-- Tabela de Orçamentos
CREATE TABLE public.budgets (
    id UUID NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    limit_amount NUMERIC(18, 2) NOT NULL,
    spent_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.budgets IS 'Stores user-defined spending limits for categories over a period.';

-- Tabela de Metas Financeiras
CREATE TABLE public.financial_goals (
    id UUID NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount NUMERIC(18, 2) NOT NULL,
    current_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
    deadline_date DATE,
    icon TEXT,
    status public.goal_status NOT NULL DEFAULT 'in_progress',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.financial_goals IS 'Stores user financial goals and their progress.';

-- Tabela de Tarefas
CREATE TABLE public.todos (
    id UUID NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    due_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.todos IS 'A simple to-do list for users.';

-- Tabela de Anotações
CREATE TABLE public.notes (
    id UUID NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    color TEXT,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.notes IS 'Stores user notes, synced across devices.';

-- Tabela de Clientes (para Módulo DEV)
CREATE TABLE public.dev_clients (
    id UUID NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    service_type TEXT,
    status public.dev_client_status DEFAULT 'planning',
    priority public.dev_client_priority DEFAULT 'medium',
    start_date DATE,
    deadline DATE,
    total_price NUMERIC(18, 2),
    notes TEXT,
    tasks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.dev_clients IS 'Stores clients and projects for the developer module.';


-- 4. ========== TABELAS PARA APIs EXTERNAS ==========

-- Tabela de Cidades para a API de Clima
CREATE TABLE public.api_cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    country VARCHAR(10),
    latitude DECIMAL(9, 6),
    longitude DECIMAL(9, 6),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(name, country)
);
COMMENT ON TABLE public.api_cities IS 'Stores unique cities for weather lookups.';

-- Tabela de Logs de Clima
CREATE TABLE public.weather_logs (
    id BIGSERIAL PRIMARY KEY,
    city_id INTEGER NOT NULL REFERENCES public.api_cities(id) ON DELETE CASCADE,
    temperature DECIMAL(5, 2),
    description VARCHAR(255),
    icon_code VARCHAR(10),
    humidity INTEGER,
    wind_speed DECIMAL(5, 2),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.weather_logs IS 'Logs historical weather data for cities.';

-- Tabela de Ativos Financeiros para a API de Cotações
CREATE TABLE public.financial_assets (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100),
    asset_type public.asset_type NOT NULL
);
COMMENT ON TABLE public.financial_assets IS 'Stores unique financial assets for quote lookups.';

-- Tabela de Logs de Cotações
CREATE TABLE public.quote_logs (
    id BIGSERIAL PRIMARY KEY,
    asset_id INTEGER NOT NULL REFERENCES public.financial_assets(id) ON DELETE CASCADE,
    bid_price DECIMAL(18, 6),
    ask_price DECIMAL(18, 6),
    pct_change DECIMAL(10, 4),
    high_price DECIMAL(18, 6),
    low_price DECIMAL(18, 6),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.quote_logs IS 'Logs historical price data for financial assets.';


-- 5. ========== POLÍTICAS DE SEGURANÇA (RLS) ==========

-- Ativa RLS para todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_clients ENABLE ROW LEVEL SECURITY;
-- As tabelas de log/api não precisam de RLS se forem acessadas apenas pela service_role

-- --- Políticas para 'profiles' ---
-- CORREÇÃO AQUI: Permite que a server action (usando a role 'anon') insira um novo perfil durante o signup.
DROP POLICY IF EXISTS "Allow anon to insert their own profile on signup" ON public.profiles;
CREATE POLICY "Allow anon to insert their own profile on signup"
  ON public.profiles FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
CREATE POLICY "Users can view their own profile." ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- --- Políticas para 'categories' ---
DROP POLICY IF EXISTS "Allow authenticated users to read default categories" ON public.categories;
CREATE POLICY "Allow authenticated users to read default categories" ON public.categories
  FOR SELECT TO authenticated USING (is_default = true);

DROP POLICY IF EXISTS "Users can manage their own categories." ON public.categories;
CREATE POLICY "Users can manage their own categories." ON public.categories
  FOR ALL USING (auth.uid() = user_id);

-- --- Políticas para 'transactions' ---
DROP POLICY IF EXISTS "Users can manage their own transactions." ON public.transactions;
CREATE POLICY "Users can manage their own transactions." ON public.transactions
  FOR ALL USING (auth.uid() = user_id);

-- --- Políticas para o restante das tabelas ---
DROP POLICY IF EXISTS "Enable all actions for users based on user_id" ON public.budgets;
CREATE POLICY "Enable all actions for users based on user_id" ON public.budgets
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable all actions for users based on user_id" ON public.financial_goals;
CREATE POLICY "Enable all actions for users based on user_id" ON public.financial_goals
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable all actions for users based on user_id" ON public.todos;
CREATE POLICY "Enable all actions for users based on user_id" ON public.todos
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable all actions for users based on user_id" ON public.notes;
CREATE POLICY "Enable all actions for users based on user_id" ON public.notes
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable all actions for users based on user_id" ON public.dev_clients;
CREATE POLICY "Enable all actions for users based on user_id" ON public.dev_clients
  FOR ALL USING (auth.uid() = user_id);


-- 6. ========== DADOS INICIAIS (SEED) ==========

INSERT INTO public.categories (name, type, icon, is_default) VALUES
  ('Salário', 'income', 'DollarSign', true),
  ('Freelance/Bicos', 'income', 'Briefcase', true),
  ('Investimentos', 'income', 'TrendingUp', true),
  ('Presentes', 'income', 'Gift', true),
  ('Outras Receitas', 'income', 'PlusCircle', true),
  ('Moradia', 'expense', 'Home', true),
  ('Alimentação', 'expense', 'Utensils', true),
  ('Transporte', 'expense', 'Car', true),
  ('Saúde', 'expense', 'HeartPulse', true),
  ('Lazer', 'expense', 'GlassWater', true),
  ('Educação', 'expense', 'GraduationCap', true),
  ('Vestuário', 'expense', 'Shirt', true),
  ('Contas e Serviços', 'expense', 'Receipt', true),
  ('Impostos', 'expense', 'Landmark', true),
  ('Outras Despesas', 'expense', 'MinusCircle', true)
ON CONFLICT (name) DO NOTHING;

-- Finaliza a transação
COMMIT;

    
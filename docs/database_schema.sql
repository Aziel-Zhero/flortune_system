-- ------------------------------------------------------------------------------------------------
-- FLORTUNE - DATABASE SCHEMA V2
-- Descrição: Script completo para limpar e recriar o banco de dados do Flortune
-- com um schema normalizado (3NF) e tabelas dedicadas para APIs externas.
--
-- ### ATENÇÃO ###
-- Executar este script irá APAGAR TODOS OS DADOS existentes nas tabelas gerenciadas.
-- Use com cuidado.
-- ------------------------------------------------------------------------------------------------

-- ### ETAPA 1: LIMPEZA DO SCHEMA ANTIGO ###
-- Remove todas as tabelas, tipos e funções para garantir um ambiente limpo.

-- Remove as políticas de segurança das tabelas (com sintaxe corrigida)
DROP POLICY IF EXISTS "Allow anon to insert their own profile on signup" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage their own categories." ON public.categories;
DROP POLICY IF EXISTS "Allow users to read default and their own categories." ON public.categories;
DROP POLICY IF EXISTS "Users can manage their own transactions." ON public.transactions;
DROP POLICY IF EXISTS "Users can manage their own budgets." ON public.budgets;
DROP POLICY IF EXISTS "Users can manage their own financial goals." ON public.financial_goals;
DROP POLICY IF EXISTS "Users can manage their own todos." ON public.todos;
DROP POLICY IF EXISTS "Users can manage their own notes." ON public.notes;
DROP POLICY IF EXISTS "Developers can manage their own clients." ON public.dev_clients;

-- Remove tabelas na ordem de dependência (das que dependem para as que são dependidas)
DROP TABLE IF EXISTS public.weather_logs CASCADE;
DROP TABLE IF EXISTS public.quote_logs CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.budgets CASCADE;
DROP TABLE IF EXISTS public.financial_goals CASCADE;
DROP TABLE IF EXISTS public.todos CASCADE;
DROP TABLE IF EXISTS public.notes CASCADE;
DROP TABLE IF EXISTS public.dev_clients CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.api_cities CASCADE;
DROP TABLE IF EXISTS public.financial_assets CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Remove tipos ENUM personalizados
DROP TYPE IF EXISTS public.account_type;
DROP TYPE IF EXISTS public.transaction_type;
DROP TYPE IF EXISTS public.goal_status;
DROP TYPE IF EXISTS public.dev_client_status;
DROP TYPE IF EXISTS public.dev_client_priority;
DROP TYPE IF EXISTS public.asset_type;

-- Habilita extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "moddatetime" WITH SCHEMA extensions;

-- ### ETAPA 2: CRIAÇÃO DOS TIPOS (ENUMS) ###

CREATE TYPE public.account_type AS ENUM ('pessoa', 'empresa');
CREATE TYPE public.transaction_type AS ENUM ('income', 'expense');
CREATE TYPE public.goal_status AS ENUM ('in_progress', 'achieved', 'cancelled');
CREATE TYPE public.dev_client_status AS ENUM ('planning', 'in_progress', 'delivered', 'on_hold', 'delayed');
CREATE TYPE public.dev_client_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.asset_type AS ENUM ('currency', 'stock_index', 'commodity');


-- ### ETAPA 3: CRIAÇÃO DAS TABELAS ###

-- Tabela de Perfis de Usuário
CREATE TABLE public.profiles (
    id UUID NOT NULL PRIMARY KEY DEFAULT auth.uid(),
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
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT email_not_empty CHECK (email <> ''),
    CONSTRAINT display_name_not_empty CHECK (display_name <> '')
);
COMMENT ON TABLE public.profiles IS 'Stores all user profile information.';

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
COMMENT ON TABLE public.categories IS 'Stores transaction categories, including default and user-created ones.';

-- Tabela de Transações
CREATE TABLE public.transactions (
    id UUID NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    date DATE NOT NULL,
    type public.transaction_type NOT NULL,
    is_recurring BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.transactions IS 'Records all financial income and expense transactions.';

-- Tabela de Orçamentos
CREATE TABLE public.budgets (
    id UUID NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    limit_amount DECIMAL(12, 2) NOT NULL,
    spent_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT limit_amount_positive CHECK (limit_amount > 0)
);
COMMENT ON TABLE public.budgets IS 'Defines spending limits for categories over a period.';

-- Tabela de Metas Financeiras
CREATE TABLE public.financial_goals (
    id UUID NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount DECIMAL(12, 2) NOT NULL,
    current_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    deadline_date DATE,
    icon TEXT,
    status public.goal_status NOT NULL DEFAULT 'in_progress',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.financial_goals IS 'Stores user-defined financial goals.';

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

-- Tabela de Anotações (Sincronizadas)
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
COMMENT ON TABLE public.notes IS 'Stores user notes for synchronization across devices.';

-- Tabela de Clientes/Projetos (Módulo DEV)
CREATE TABLE public.dev_clients (
    id UUID NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    service_type TEXT,
    status public.dev_client_status NOT NULL DEFAULT 'planning',
    priority public.dev_client_priority NOT NULL DEFAULT 'medium',
    start_date DATE,
    deadline DATE,
    total_price DECIMAL(12, 2),
    tasks TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.dev_clients IS 'Stores developer clients and projects information.';

-- Tabela de Cidades (API de Clima)
CREATE TABLE public.api_cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    country VARCHAR(5) NOT NULL,
    latitude DECIMAL(9, 6),
    longitude DECIMAL(9, 6),
    UNIQUE (name, country)
);
COMMENT ON TABLE public.api_cities IS 'Stores unique cities for weather data to avoid redundancy.';

-- Tabela de Logs de Clima
CREATE TABLE public.weather_logs (
    id SERIAL PRIMARY KEY,
    city_id INT NOT NULL REFERENCES public.api_cities(id) ON DELETE CASCADE,
    temperature DECIMAL(5, 2) NOT NULL,
    description VARCHAR(255),
    icon_code VARCHAR(10),
    humidity INT,
    wind_speed DECIMAL(5, 2),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.weather_logs IS 'Historical log of weather data for cities.';

-- Tabela de Ativos Financeiros (API de Cotações)
CREATE TABLE public.financial_assets (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    asset_type public.asset_type NOT NULL
);
COMMENT ON TABLE public.financial_assets IS 'Stores unique financial assets for quotes.';

-- Tabela de Logs de Cotações
CREATE TABLE public.quote_logs (
    id SERIAL PRIMARY KEY,
    asset_id INT NOT NULL REFERENCES public.financial_assets(id) ON DELETE CASCADE,
    bid_price DECIMAL(18, 6) NOT NULL,
    ask_price DECIMAL(18, 6),
    pct_change DECIMAL(10, 4),
    high_price DECIMAL(18, 6),
    low_price DECIMAL(18, 6),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.quote_logs IS 'Historical log of financial asset quotes.';

-- ### ETAPA 4: TRIGGERS para `updated_at` ###
-- Cria triggers para atualizar automaticamente o campo `updated_at` em cada tabela.
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.financial_goals FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.todos FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.dev_clients FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);


-- ### ETAPA 5: POLÍTICAS DE SEGURANÇA (RLS - Row Level Security) ###
-- Garante que os usuários só possam acessar e modificar seus próprios dados.

-- Habilita RLS em todas as tabelas relevantes
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_clients ENABLE ROW LEVEL SECURITY;

-- Políticas para a tabela `profiles`
CREATE POLICY "Users can manage their own profile" ON public.profiles FOR ALL USING (auth.uid() = id);

-- Políticas para a tabela `categories`
CREATE POLICY "Users can manage their own categories." ON public.categories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Allow users to read default categories." ON public.categories FOR SELECT USING (is_default = true);

-- Políticas para as demais tabelas
CREATE POLICY "Users can manage their own transactions." ON public.transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own budgets." ON public.budgets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own financial goals." ON public.financial_goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own todos." ON public.todos FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own notes." ON public.notes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Developers can manage their own clients." ON public.dev_clients FOR ALL USING (auth.uid() = user_id);


-- ### ETAPA 6: DADOS INICIAIS (Seed Data) ###

-- Cria um índice único para garantir que não haja categorias padrão duplicadas.
CREATE UNIQUE INDEX IF NOT EXISTS categories_default_name_type_unique ON public.categories(name, type) WHERE is_default = true;

-- Insere categorias padrão que estarão disponíveis para todos os usuários.
INSERT INTO public.categories (name, type, icon, is_default) VALUES
  ('Salário', 'income', 'DollarSign', true),
  ('Rendimentos', 'income', 'TrendingUp', true),
  ('Vendas', 'income', 'ShoppingCart', true),
  ('Outras Receitas', 'income', 'PiggyBank', true),
  ('Moradia', 'expense', 'Home', true),
  ('Alimentação', 'expense', 'Utensils', true),
  ('Transporte', 'expense', 'Car', true),
  ('Lazer', 'expense', 'Gamepad2', true),
  ('Saúde', 'expense', 'HeartPulse', true),
  ('Educação', 'expense', 'GraduationCap', true),
  ('Vestuário', 'expense', 'Shirt', true),
  ('Impostos', 'expense', 'Landmark', true),
  ('Serviços', 'expense', 'Wrench', true),
  ('Outras Despesas', 'expense', 'Receipt', true)
ON CONFLICT (name, type) WHERE is_default = true DO NOTHING;

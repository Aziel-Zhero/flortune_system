-- Apagar tabelas antigas e tipos para garantir um ambiente limpo.
-- A ordem é importante para respeitar as chaves estrangeiras.
DROP POLICY IF EXISTS "Allow authenticated users to read financial assets" ON public.financial_assets;
DROP POLICY IF EXISTS "Allow authenticated users to read cities" ON public.api_cities;
DROP POLICY IF EXISTS "Users can manage their own weather logs" ON public.weather_logs;
DROP POLICY IF EXISTS "Users can manage their own quote logs" ON public.quote_logs;
DROP POLICY IF EXISTS "Users can manage their own dev clients" ON public.dev_clients;
DROP POLICY IF EXISTS "Users can manage their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can manage their own todos" ON public.todos;
DROP POLICY IF EXISTS "Users can manage their own financial goals" ON public.financial_goals;
DROP POLICY IF EXISTS "Users can manage their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can manage their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view their own or default categories" ON public.categories;
DROP POLICY IF EXISTS "Users can manage their own custom categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow anon to insert their own profile on signup" ON public.profiles;


DROP TRIGGER IF EXISTS on_profile_update ON public.profiles;
DROP FUNCTION IF EXISTS public.handle_profile_update();

DROP TABLE IF EXISTS public.quote_logs CASCADE;
DROP TABLE IF EXISTS public.weather_logs CASCADE;
DROP TABLE IF EXISTS public.financial_assets CASCADE;
DROP TABLE IF EXISTS public.api_cities CASCADE;
DROP TABLE IF EXISTS public.dev_clients CASCADE;
DROP TABLE IF EXISTS public-notes CASCADE;
DROP TABLE IF EXISTS public.todos CASCADE;
DROP TABLE IF EXISTS public.financial_goals CASCADE;
DROP TABLE IF EXISTS public.budgets CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;


-- Apagar ENUMs personalizados se eles existirem
DROP TYPE IF EXISTS public.account_type;
DROP TYPE IF EXISTS public.transaction_type;
DROP TYPE IF EXISTS public.goal_status;
DROP TYPE IF EXISTS public.client_status;
DROP TYPE IF EXISTS public.client_priority;
DROP TYPE IF EXISTS public.asset_type;

-- 1. CRIAR ENUMS (TIPOS)
CREATE TYPE public.account_type AS ENUM ('pessoa', 'empresa');
CREATE TYPE public.transaction_type AS ENUM ('income', 'expense');
CREATE TYPE public.goal_status AS ENUM ('in_progress', 'achieved', 'cancelled');
CREATE TYPE public.client_status AS ENUM ('planning', 'in_progress', 'delivered', 'on_hold', 'delayed');
CREATE TYPE public.client_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.asset_type AS ENUM ('currency', 'stock_index', 'commodity');

-- 2. CRIAR TABELAS PRINCIPAIS

-- Tabela de Perfis de Usuário
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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
COMMENT ON TABLE public.profiles IS 'Stores user profile information, extending the auth.users table.';

-- Tabela de Categorias
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type public.transaction_type NOT NULL,
    icon TEXT,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.categories IS 'Stores transaction categories. Can be default or user-created.';

-- Tabela de Transações
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    date DATE NOT NULL,
    type public.transaction_type NOT NULL,
    is_recurring BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.transactions IS 'Records all income and expense transactions for users.';

-- Tabela de Orçamentos
CREATE TABLE public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    limit_amount NUMERIC(12, 2) NOT NULL,
    spent_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.budgets IS 'Stores user-defined spending limits for categories over a period.';

-- Tabela de Metas Financeiras
CREATE TABLE public.financial_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount NUMERIC(12, 2) NOT NULL,
    current_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    deadline_date DATE,
    icon TEXT,
    status public.goal_status NOT NULL DEFAULT 'in_progress',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.financial_goals IS 'Tracks financial goals for users.';

-- Tabela de Tarefas
CREATE TABLE public.todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    due_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.todos IS 'A simple to-do list for users.';

-- Tabela de Anotações (sincronizadas)
CREATE TABLE public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    color TEXT,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.notes IS 'Stores user notes for cross-device syncing.';

-- Tabela de Clientes/Projetos (para DEVs)
CREATE TABLE public.dev_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    service_type TEXT,
    status public.client_status NOT NULL DEFAULT 'planning',
    priority public.client_priority NOT NULL DEFAULT 'medium',
    start_date DATE,
    deadline DATE,
    total_price NUMERIC(12, 2),
    tasks TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.dev_clients IS 'Manages clients and projects for developer users.';


-- 3. CRIAR TABELAS PARA DADOS DE APIS

-- Tabela para Cidades (Clima)
CREATE TABLE public.api_cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    country VARCHAR(5),
    latitude DECIMAL(9, 6),
    longitude DECIMAL(9, 6),
    UNIQUE (name, country)
);
COMMENT ON TABLE public.api_cities IS 'Stores unique cities for weather lookups.';

-- Tabela para Logs de Clima
CREATE TABLE public.weather_logs (
    id SERIAL PRIMARY KEY,
    city_id INT NOT NULL REFERENCES public.api_cities(id) ON DELETE CASCADE,
    temperature DECIMAL(5, 2),
    description VARCHAR(255),
    icon_code VARCHAR(10),
    humidity INT,
    wind_speed DECIMAL(5, 2),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.weather_logs IS 'Historical log of weather data fetched from the API.';

-- Tabela para Ativos Financeiros (Cotações)
CREATE TABLE public.financial_assets (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100),
    asset_type public.asset_type NOT NULL
);
COMMENT ON TABLE public.financial_assets IS 'Stores unique financial assets for quote lookups.';

-- Tabela para Logs de Cotações
CREATE TABLE public.quote_logs (
    id SERIAL PRIMARY KEY,
    asset_id INT NOT NULL REFERENCES public.financial_assets(id) ON DELETE CASCADE,
    bid_price DECIMAL(18, 6),
    ask_price DECIMAL(18, 6),
    pct_change DECIMAL(10, 4),
    high_price DECIMAL(18, 6),
    low_price DECIMAL(18, 6),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.quote_logs IS 'Historical log of financial asset quotes fetched from the API.';


-- 4. HABILITAR ROW LEVEL SECURITY (RLS) E CRIAR POLÍTICAS
-- A segurança é a prioridade. Nenhuma tabela pode ser acessada sem uma política.

-- Perfis
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow anon to insert their own profile on signup" ON public.profiles FOR INSERT WITH CHECK (true); -- Permitir que a server action insira

-- Categorias
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own or default categories" ON public.categories FOR SELECT USING (auth.uid() = user_id OR is_default = true);
CREATE POLICY "Users can manage their own custom categories" ON public.categories FOR ALL USING (auth.uid() = user_id AND is_default = false);

-- Transações
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id);

-- Orçamentos
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own budgets" ON public.budgets FOR ALL USING (auth.uid() = user_id);

-- Metas Financeiras
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own financial goals" ON public.financial_goals FOR ALL USING (auth.uid() = user_id);

-- Tarefas
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own todos" ON public.todos FOR ALL USING (auth.uid() = user_id);

-- Anotações
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own notes" ON public.notes FOR ALL USING (auth.uid() = user_id);

-- Clientes DEV
ALTER TABLE public.dev_clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own dev clients" ON public.dev_clients FOR ALL USING (auth.uid() = user_id);

-- Tabelas de API (assumindo que são lidas/escritas por funções seguras ou pelo usuário logado)
ALTER TABLE public.api_cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read cities" ON public.api_cities FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE public.weather_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own weather logs" ON public.weather_logs FOR ALL USING (true); -- Simplificado, idealmente seria por uma FK para user_id

ALTER TABLE public.financial_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read financial assets" ON public.financial_assets FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE public.quote_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own quote logs" ON public.quote_logs FOR ALL USING (true); -- Simplificado


-- 5. INSERIR DADOS INICIAIS (SEEDING)

-- Inserir categorias padrão de despesa
INSERT INTO public.categories (name, type, icon, is_default) VALUES
('Moradia', 'expense', 'Home', true),
('Alimentação', 'expense', 'Utensils', true),
('Transporte', 'expense', 'Car', true),
('Lazer', 'expense', 'Gamepad2', true),
('Saúde', 'expense', 'HeartPulse', true),
('Educação', 'expense', 'BookOpen', true),
('Roupas', 'expense', 'Shirt', true),
('Impostos', 'expense', 'Landmark', true),
('Outros', 'expense', 'MoreHorizontal', true);

-- Inserir categorias padrão de receita
INSERT INTO public.categories (name, type, icon, is_default) VALUES
('Salário', 'income', 'Briefcase', true),
('Freelance', 'income', 'Laptop', true),
('Investimentos', 'income', 'TrendingUp', true),
('Presentes', 'income', 'Gift', true),
('Outras Receitas', 'income', 'DollarSign', true);


-- 6. TRIGGERS (Apenas para `updated_at`)

-- Função para atualizar `updated_at`
CREATE OR REPLACE FUNCTION public.moddatetime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.moddatetime();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.moddatetime();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.moddatetime();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.moddatetime();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.financial_goals FOR EACH ROW EXECUTE FUNCTION public.moddatetime();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.todos FOR EACH ROW EXECUTE FUNCTION public.moddatetime();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.moddatetime();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.dev_clients FOR EACH ROW EXECUTE FUNCTION public.moddatetime();

-- Fim do script

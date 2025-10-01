-- ----------------------------------------------------------------
-- 1. SCHEMA CLEANUP
--
-- This section drops all existing tables, types, and functions in the public schema
-- to ensure a clean state before creating the new structure. The `CASCADE`
-- keyword handles dependencies automatically.
-- ----------------------------------------------------------------

-- Drop policies from all tables if they exist
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Users can manage their own data" ON public.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Users can view their own data" ON public.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Users can insert their own data" ON public.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Users can update their own data" ON public.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Users can delete their own data" ON public.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Allow public read-only access" ON public.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Allow anon to insert their own profile on signup" ON public.' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- Drop all triggers from all tables if they exist
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS on_public_' || r.tablename || '_updated ON public.' || quote_ident(r.tablename);
    END LOOP;
END $$;


-- Drop all tables in the public schema if they exist
DROP TABLE IF EXISTS public.quote_logs CASCADE;
DROP TABLE IF EXISTS public.financial_assets CASCADE;
DROP TABLE IF EXISTS public.weather_logs CASCADE;
DROP TABLE IF EXISTS public.api_cities CASCADE;
DROP TABLE IF EXISTS public.todos CASCADE;
DROP TABLE IF EXISTS public.notes CASCADE;
DROP TABLE IF EXISTS public.budgets CASCADE;
DROP TABLE IF EXISTS public.financial_goals CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;


-- Drop all custom types if they exist
DROP TYPE IF EXISTS public.account_type;
DROP TYPE IF EXISTS public.transaction_type;
DROP TYPE IF EXISTS public.goal_status;
DROP TYPE IF EXISTS public.client_status;
DROP TYPE IF EXISTS public.client_priority;
DROP TYPE IF EXISTS public.asset_type;

-- Drop all functions if they exist
DROP FUNCTION IF EXISTS public.handle_updated_at;

-- ----------------------------------------------------------------
-- 2. EXTENSIONS
--
-- Ensure necessary PostgreSQL extensions are enabled.
-- ----------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- ----------------------------------------------------------------
-- 3. HELPER FUNCTIONS
--
-- This function automatically updates the `updated_at` timestamp
-- on any table it's triggered on.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------
-- 4. CUSTOM TYPES
--
-- Defines custom ENUM types for consistency and data integrity.
-- ----------------------------------------------------------------
CREATE TYPE public.account_type AS ENUM ('pessoa', 'empresa');
CREATE TYPE public.transaction_type AS ENUM ('income', 'expense');
CREATE TYPE public.goal_status AS ENUM ('in_progress', 'achieved', 'cancelled');
CREATE TYPE public.client_status AS ENUM ('planning', 'in_progress', 'delivered', 'on_hold', 'delayed');
CREATE TYPE public.client_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.asset_type AS ENUM ('currency', 'stock_index', 'commodity');

-- ----------------------------------------------------------------
-- 5. TABLE CREATION
--
-- Creates all tables for the application's core data model
-- and for storing API data.
-- ----------------------------------------------------------------

-- Table for User Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  full_name TEXT,
  display_name TEXT,
  email TEXT NOT NULL UNIQUE,
  hashed_password TEXT,
  phone TEXT,
  cpf_cnpj TEXT UNIQUE,
  rg TEXT,
  avatar_url TEXT,
  account_type public.account_type,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.profiles IS 'Stores user profile information, extending the auth.users table.';

-- Table for Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type public.transaction_type NOT NULL,
  icon TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, name, type)
);
COMMENT ON TABLE public.categories IS 'Stores transaction categories. Can be default or user-created.';

-- Table for Transactions
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
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
COMMENT ON TABLE public.transactions IS 'Stores all financial transactions for each user.';

-- Table for Budgets
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  limit_amount NUMERIC(12, 2) NOT NULL,
  spent_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.budgets IS 'Stores user-defined spending limits for categories.';

-- Table for Financial Goals
CREATE TABLE public.financial_goals (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC(12, 2) NOT NULL,
  current_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  deadline_date DATE,
  icon TEXT,
  status public.goal_status NOT NULL DEFAULT 'in_progress',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.financial_goals IS 'Stores financial goals for users.';

-- Table for To-Do Items
CREATE TABLE public.todos (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.todos IS 'Stores to-do list items for users.';

-- Table for Notepad (previously in localStorage)
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  color TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.notes IS 'Stores user notes for the notepad feature.';

-- Table for Cities (Weather API)
CREATE TABLE public.api_cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    country VARCHAR(10),
    latitude DECIMAL(9, 6),
    longitude DECIMAL(9, 6),
    UNIQUE (name, country)
);
COMMENT ON TABLE public.api_cities IS 'Stores unique cities for weather data to avoid redundancy.';

-- Table for Weather Logs (Weather API)
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
COMMENT ON TABLE public.weather_logs IS 'Logs historical weather data for cities.';

-- Table for Financial Assets (Quotes API)
CREATE TABLE public.financial_assets (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100),
    asset_type public.asset_type NOT NULL
);
COMMENT ON TABLE public.financial_assets IS 'Stores unique financial assets for quotes to avoid redundancy.';

-- Table for Quote Logs (Quotes API)
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
COMMENT ON TABLE public.quote_logs IS 'Logs historical quote data for financial assets.';

-- ----------------------------------------------------------------
-- 6. TRIGGERS
--
-- Attaches the `handle_updated_at` function to all tables.
-- ----------------------------------------------------------------
CREATE TRIGGER on_public_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_public_categories_updated BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_public_transactions_updated BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_public_budgets_updated BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_public_financial_goals_updated BEFORE UPDATE ON public.financial_goals FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_public_todos_updated BEFORE UPDATE ON public.todos FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_public_notes_updated BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- ----------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS)
--
-- Enables RLS on all tables and defines policies to ensure
-- users can only access their own data.
-- ----------------------------------------------------------------

-- Enable RLS for all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_logs ENABLE ROW LEVEL SECURITY;


-- Policies for `profiles` table
CREATE POLICY "Users can manage their own profile" ON public.profiles FOR ALL
  USING (auth.uid() = id);

-- Policies for `categories` table
CREATE POLICY "Users can manage their own categories" ON public.categories FOR ALL
  USING (auth.uid() = user_id);
CREATE POLICY "Users can view default categories" ON public.categories FOR SELECT
  USING (is_default = true);

-- Policies for other user-specific tables
CREATE POLICY "Users can manage their own data" ON public.transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own data" ON public.budgets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own data" ON public.financial_goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own data" ON public.todos FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own data" ON public.notes FOR ALL USING (auth.uid() = user_id);

-- API data tables are public for read, but inserts should be handled by trusted server-side code (e.g., via a server action or edge function).
CREATE POLICY "Allow public read-only access" ON public.api_cities FOR SELECT USING (true);
CREATE POLICY "Allow public read-only access" ON public.weather_logs FOR SELECT USING (true);
CREATE POLICY "Allow public read-only access" ON public.financial_assets FOR SELECT USING (true);
CREATE POLICY "Allow public read-only access" ON public.quote_logs FOR SELECT USING (true);


-- ----------------------------------------------------------------
-- 8. SEED DATA
--
-- Inserts initial data required for the application to function,
-- such as default categories.
-- ----------------------------------------------------------------
INSERT INTO public.categories (name, type, icon, is_default) VALUES
  ('Salário', 'income', 'DollarSign', true),
  ('Freelance', 'income', 'Briefcase', true),
  ('Investimentos', 'income', 'TrendingUp', true),
  ('Outras Receitas', 'income', 'PlusCircle', true),
  ('Moradia', 'expense', 'Home', true),
  ('Alimentação', 'expense', 'Utensils', true),
  ('Transporte', 'expense', 'Car', true),
  ('Saúde', 'expense', 'HeartPulse', true),
  ('Lazer', 'expense', 'GlassWater', true),
  ('Educação', 'expense', 'BookOpen', true),
  ('Compras', 'expense', 'ShoppingBag', true),
  ('Impostos', 'expense', 'Landmark', true),
  ('Serviços', 'expense', 'Wifi', true),
  ('Outras Despesas', 'expense', 'MinusCircle', true)
ON CONFLICT (user_id, name, type) DO NOTHING;

INSERT INTO public.financial_assets (code, name, asset_type) VALUES
  ('USD-BRL', 'Dólar Comercial', 'currency'),
  ('USDT-BRL', 'Dólar Turismo', 'currency'),
  ('EUR-BRL', 'Euro', 'currency'),
  ('GBP-BRL', 'Libra Esterlina', 'currency'),
  ('JPY-BRL', 'Iene Japonês', 'currency'),
  ('ARS-BRL', 'Peso Argentino', 'currency'),
  ('BTC-BRL', 'Bitcoin', 'currency'),
  ('ETH-BRL', 'Ethereum', 'currency'),
  ('IBOV', 'Ibovespa', 'stock_index'),
  ('NASDAQ', 'Nasdaq', 'stock_index')
ON CONFLICT (code) DO NOTHING;

-- End of script

-- Flortune - Database Schema
-- Version: 3.0
-- Description: Re-architected schema in English, normalized, and with security policies.
-- This version corrects previous omissions and errors.

-- ----------------------------------------------------------------
-- 1. CLEANUP: Drop all existing objects to ensure a fresh start
-- ----------------------------------------------------------------

-- Deactivate RLS on all tables it's active on before dropping them
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' NO FORCE ROW LEVEL SECURITY';
    END LOOP;
END $$;

-- Drop all policies from public tables
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- Drop all tables in the public schema
DROP TABLE IF EXISTS public.budgets CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.financial_goals CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.todos CASCADE;
DROP TABLE IF EXISTS public.notes CASCADE;
DROP TABLE IF EXISTS public.dev_clients CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop custom types if they exist
DROP TYPE IF EXISTS public.account_type;
DROP TYPE IF EXISTS public.transaction_type;
DROP TYPE IF EXISTS public.goal_status;
DROP TYPE IF EXISTS public.dev_client_status;
DROP TYPE IF EXISTS public.dev_client_priority;

-- Clean up next-auth managed tables if they exist (handle with care)
-- Note: SupabaseAdapter might create these automatically. Dropping them ensures a clean slate.
DROP TABLE IF EXISTS next_auth.users CASCADE;
DROP TABLE IF EXISTS next_auth.accounts CASCADE;
DROP TABLE IF EXISTS next_auth.sessions CASCADE;
DROP TABLE IF EXISTS next_auth.verification_tokens CASCADE;
DROP SCHEMA IF EXISTS next_auth CASCADE;


-- ----------------------------------------------------------------
-- 2. EXTENSIONS & SCHEMA SETUP
-- ----------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- Create the schema for NextAuth.js if it doesn't exist.
-- The SupabaseAdapter will use this schema.
CREATE SCHEMA IF NOT EXISTS next_auth;


-- ----------------------------------------------------------------
-- 3. CREATE CUSTOM ENUM TYPES
-- ----------------------------------------------------------------
CREATE TYPE public.account_type AS ENUM ('pessoa', 'empresa');
CREATE TYPE public.transaction_type AS ENUM ('income', 'expense');
CREATE TYPE public.goal_status AS ENUM ('in_progress', 'achieved', 'cancelled');
CREATE TYPE public.dev_client_status AS ENUM ('planning', 'in_progress', 'delivered', 'on_hold', 'delayed');
CREATE TYPE public.dev_client_priority AS ENUM ('low', 'medium', 'high');


-- ----------------------------------------------------------------
-- 4. CREATE TABLES
-- ----------------------------------------------------------------

-- Table: public.profiles
CREATE TABLE public.profiles (
    id uuid NOT NULL PRIMARY KEY,
    full_name text,
    display_name text,
    email text NOT NULL UNIQUE,
    hashed_password text,
    phone text,
    avatar_url text,
    account_type public.account_type,
    cpf_cnpj text UNIQUE,
    rg text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.profiles IS 'Stores user profile information, separate from auth system.';

-- Table: public.categories
CREATE TABLE public.categories (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    type public.transaction_type NOT NULL,
    icon text,
    is_default boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.categories IS 'Stores transaction categories, both default and user-created.';

-- Table: public.transactions
CREATE TABLE public.transactions (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    description text NOT NULL,
    amount numeric NOT NULL,
    date date NOT NULL,
    type public.transaction_type NOT NULL,
    notes text,
    is_recurring boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.transactions IS 'Stores all financial transactions for users.';

-- Table: public.budgets
CREATE TABLE public.budgets (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    limit_amount numeric NOT NULL,
    spent_amount numeric NOT NULL DEFAULT 0,
    period_start_date date NOT NULL,
    period_end_date date NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.budgets IS 'Stores user-defined spending limits for categories.';

-- Table: public.financial_goals
CREATE TABLE public.financial_goals (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    target_amount numeric NOT NULL,
    current_amount numeric NOT NULL DEFAULT 0,
    deadline_date date,
    icon text,
    status public.goal_status NOT NULL DEFAULT 'in_progress',
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.financial_goals IS 'Stores financial goals for users.';

-- Table: public.todos
CREATE TABLE public.todos (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    description text NOT NULL,
    is_completed boolean NOT NULL DEFAULT false,
    due_date date,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.todos IS 'Simple to-do list items for users.';

-- Table: public.notes (Added as per plan)
CREATE TABLE public.notes (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    content text,
    color text NOT NULL,
    is_pinned boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.notes IS 'Stores user notes for synchronization across devices.';

-- Table: public.dev_clients (Added as per plan)
CREATE TABLE public.dev_clients (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    service_type text,
    status public.dev_client_status NOT NULL DEFAULT 'planning',
    priority public.dev_client_priority NOT NULL DEFAULT 'medium',
    start_date date,
    deadline date,
    total_price numeric,
    notes text,
    tasks text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.dev_clients IS 'Stores client and project data for the DEV module.';

-- ----------------------------------------------------------------
-- 5. SEED DATA: Insert default categories
-- ----------------------------------------------------------------
INSERT INTO public.categories (name, type, icon, is_default) VALUES
    ('Salário', 'income', 'DollarSign', true),
    ('Freelance', 'income', 'Briefcase', true),
    ('Investimentos', 'income', 'TrendingUp', true),
    ('Outras Receitas', 'income', 'MoreHorizontal', true),
    ('Moradia', 'expense', 'Home', true),
    ('Alimentação', 'expense', 'Utensils', true),
    ('Transporte', 'expense', 'Car', true),
    ('Saúde', 'expense', 'Heartbeat', true),
    ('Lazer', 'expense', 'Gamepad2', true),
    ('Educação', 'expense', 'BookOpen', true),
    ('Compras', 'expense', 'ShoppingBag', true),
    ('Contas e Serviços', 'expense', 'FileText', true),
    ('Impostos', 'expense', 'Landmark', true),
    ('Outras Despesas', 'expense', 'MoreHorizontal', true);


-- ----------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------

-- -- PROFILES Table Policies
-- Note: A `handle_new_user` trigger previously handled profile creation.
-- This logic is now in `auth.actions.ts`. The policies below are for access control post-creation.

DROP POLICY IF EXISTS "Allow anon to insert their own profile on signup" ON public.profiles;
CREATE POLICY "Allow anon to insert their own profile on signup"
  ON public.profiles FOR INSERT
  TO anon, service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
CREATE POLICY "Users can delete their own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);


-- CATEGORIES Table Policies
DROP POLICY IF EXISTS "Users can manage their own categories" ON public.categories;
CREATE POLICY "Users can manage their own categories"
    ON public.categories FOR ALL
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view default categories" ON public.categories;
CREATE POLICY "Users can view default categories"
    ON public.categories FOR SELECT
    USING (is_default = true);

-- TRANSACTIONS Table Policies
DROP POLICY IF EXISTS "Users can manage their own transactions" ON public.transactions;
CREATE POLICY "Users can manage their own transactions"
    ON public.transactions FOR ALL
    USING (auth.uid() = user_id);

-- BUDGETS Table Policies
DROP POLICY IF EXISTS "Users can manage their own budgets" ON public.budgets;
CREATE POLICY "Users can manage their own budgets"
    ON public.budgets FOR ALL
    USING (auth.uid() = user_id);

-- FINANCIAL_GOALS Table Policies
DROP POLICY IF EXISTS "Users can manage their own financial goals" ON public.financial_goals;
CREATE POLICY "Users can manage their own financial goals"
    ON public.financial_goals FOR ALL
    USING (auth.uid() = user_id);

-- TODOS Table Policies
DROP POLICY IF EXISTS "Users can manage their own todos" ON public.todos;
CREATE POLICY "Users can manage their own todos"
    ON public.todos FOR ALL
    USING (auth.uid() = user_id);

-- NOTES Table Policies
DROP POLICY IF EXISTS "Users can manage their own notes" ON public.notes;
CREATE POLICY "Users can manage their own notes"
    ON public.notes FOR ALL
    USING (auth.uid() = user_id);
    
-- DEV_CLIENTS Table Policies
DROP POLICY IF EXISTS "Users can manage their own dev_clients" ON public.dev_clients;
CREATE POLICY "Users can manage their own dev_clients"
    ON public.dev_clients FOR ALL
    USING (auth.uid() = user_id);


-- ----------------------------------------------------------------
-- 7. ENABLE RLS ON ALL TABLES
-- ----------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_clients ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- 8. FUNCTIONS & TRIGGERS (for updated_at)
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to all tables with an updated_at column
DO $$
DECLARE
    t_name TEXT;
BEGIN
    FOR t_name IN (SELECT table_name FROM information_schema.columns WHERE table_schema = 'public' AND column_name = 'updated_at')
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS handle_updated_at ON public.' || quote_ident(t_name);
        EXECUTE 'CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.' || quote_ident(t_name) || ' FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();';
    END LOOP;
END $$;

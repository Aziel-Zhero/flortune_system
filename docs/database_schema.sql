-- -----------------------------------------------------------------------------------------------
-- Flortune Database Schema
-- Last Updated: [Current Date]
--
-- This script sets up the entire database structure for the Flortune application on Supabase.
-- It includes schemas, tables, policies for Row Level Security (RLS), and triggers.
-- To set up your database, execute this entire script in the Supabase SQL Editor.
-- -----------------------------------------------------------------------------------------------

-- -----------------------------------------------------------------------------------------------
-- EXTENSIONS (if not already enabled)
-- Ensure necessary extensions are available.
-- -----------------------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- -----------------------------------------------------------------------------------------------
-- TABLE: profiles
-- Stores public user information and app-specific settings.
-- Data is populated automatically by a trigger on the `auth.users` table.
-- -----------------------------------------------------------------------------------------------
DROP TABLE IF EXISTS public.profiles;
CREATE TABLE public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    display_name text,
    email text UNIQUE NOT NULL,
    phone text,
    avatar_url text,
    account_type text, -- 'pessoa' ou 'empresa'
    cpf_cnpj text UNIQUE,
    rg text,
    plan_id text DEFAULT 'tier-cultivador', -- Ex: 'free', 'premium', 'dev'
    has_seen_welcome_message boolean DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS for the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile."
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- -----------------------------------------------------------------------------------------------
-- TRIGGER: handle_new_user
-- This trigger automatically creates a profile entry when a new user signs up via Supabase Auth.
-- It copies metadata provided during signup (like name, account type, etc.) into the new profile.
-- -----------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, display_name, avatar_url, account_type, cpf_cnpj, rg, plan_id, has_seen_welcome_message)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'account_type',
    new.raw_user_meta_data->>'cpf_cnpj',
    new.raw_user_meta_data->>'rg',
    new.raw_user_meta_data->>'plan_id',
    COALESCE((new.raw_user_meta_data->>'has_seen_welcome_message')::boolean, false)
  );
  RETURN new;
END;
$$;

-- Drop existing trigger to ensure the new one is applied correctly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- -----------------------------------------------------------------------------------------------
-- TABLE: categories
-- Stores default and user-defined categories for transactions.
-- -----------------------------------------------------------------------------------------------
DROP TABLE IF EXISTS public.categories CASCADE;
CREATE TABLE public.categories (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('income', 'expense')),
    icon text,
    is_default boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_id, name, type)
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Policies for categories
DROP POLICY IF EXISTS "Users can view default categories and their own." ON public.categories;
CREATE POLICY "Users can view default categories and their own."
    ON public.categories FOR SELECT
    USING (is_default = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own categories." ON public.categories;
CREATE POLICY "Users can insert their own categories."
    ON public.categories FOR INSERT
    WITH CHECK (auth.uid() = user_id AND is_default = false);

DROP POLICY IF EXISTS "Users can update their own categories." ON public.categories;
CREATE POLICY "Users can update their own categories."
    ON public.categories FOR UPDATE
    USING (auth.uid() = user_id AND is_default = false);

DROP POLICY IF EXISTS "Users can delete their own categories." ON public.categories;
CREATE POLICY "Users can delete their own categories."
    ON public.categories FOR DELETE
    USING (auth.uid() = user_id AND is_default = false);

-- Insert default categories
INSERT INTO public.categories (name, type, icon, is_default) VALUES
    ('Salário', 'income', 'DollarSign', true),
    ('Investimentos', 'income', 'TrendingUp', true),
    ('Aluguel', 'expense', 'Home', true),
    ('Alimentação', 'expense', 'ShoppingCart', true),
    ('Transporte', 'expense', 'Car', true),
    ('Lazer', 'expense', 'Beer', true),
    ('Saúde', 'expense', 'Heart', true),
    ('Educação', 'expense', 'BookOpen', true),
    ('Outros', 'expense', 'Tag', true)
ON CONFLICT (user_id, name, type) DO NOTHING;


-- -----------------------------------------------------------------------------------------------
-- TABLE: transactions
-- Stores all financial transactions for each user.
-- -----------------------------------------------------------------------------------------------
DROP TABLE IF EXISTS public.transactions CASCADE;
CREATE TABLE public.transactions (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    description text NOT NULL,
    amount numeric(10, 2) NOT NULL,
    date date NOT NULL,
    type text NOT NULL CHECK (type IN ('income', 'expense')),
    notes text,
    is_recurring boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Policies for transactions
DROP POLICY IF EXISTS "Users can manage their own transactions." ON public.transactions;
CREATE POLICY "Users can manage their own transactions."
    ON public.transactions FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- -----------------------------------------------------------------------------------------------
-- TABLE: budgets
-- Stores user-defined budgets for specific categories.
-- -----------------------------------------------------------------------------------------------
DROP TABLE IF EXISTS public.budgets CASCADE;
CREATE TABLE public.budgets (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    limit_amount numeric(10, 2) NOT NULL,
    spent_amount numeric(10, 2) NOT NULL DEFAULT 0,
    period_start_date date NOT NULL,
    period_end_date date NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_id, category_id, period_start_date, period_end_date)
);

-- Enable RLS
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Policies for budgets
DROP POLICY IF EXISTS "Users can manage their own budgets." ON public.budgets;
CREATE POLICY "Users can manage their own budgets."
    ON public.budgets FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- -----------------------------------------------------------------------------------------------
-- TABLE: financial_goals
-- Stores user's financial goals.
-- -----------------------------------------------------------------------------------------------
DROP TABLE IF EXISTS public.financial_goals CASCADE;
CREATE TABLE public.financial_goals (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    target_amount numeric(12, 2) NOT NULL,
    current_amount numeric(12, 2) NOT NULL DEFAULT 0,
    deadline_date date,
    icon text,
    status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'achieved', 'cancelled')),
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;

-- Policies for financial_goals
DROP POLICY IF EXISTS "Users can manage their own financial goals." ON public.financial_goals;
CREATE POLICY "Users can manage their own financial goals."
    ON public.financial_goals FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- -----------------------------------------------------------------------------------------------
-- TABLE: todos
-- Stores user's to-do items.
-- -----------------------------------------------------------------------------------------------
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

-- Enable RLS
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Policies for todos
DROP POLICY IF EXISTS "Users can manage their own to-do items." ON public.todos;
CREATE POLICY "Users can manage their own to-do items."
    ON public.todos FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- -----------------------------------------------------------------------------------------------
-- NOTE: The `next_auth` schema and its tables are managed by the Supabase/NextAuth adapter.
-- The script no longer creates them manually to avoid conflicts.
-- -----------------------------------------------------------------------------------------------

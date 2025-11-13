-- FLORTUNE - DATABASE SCHEMA (3FN MASTER)
-- This script is designed to be idempotent and can be re-run safely.

-- 1. EXTENSIONS
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- 2. TABLE CREATION
-- Drop tables in reverse order of dependency to avoid foreign key conflicts on re-run.
DROP TABLE IF EXISTS public.financial_goals;
DROP TABLE IF EXISTS public.budgets;
DROP TABLE IF EXISTS public.transactions;
DROP TABLE IF EXISTS public.categories;
DROP TABLE IF EXISTS public.profiles;

-- User Profiles Table
-- Stores public information for each user. Linked to auth.users by ID.
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    full_name TEXT,
    display_name TEXT,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    account_type TEXT CHECK (account_type IN ('pessoa', 'empresa')),
    cpf_cnpj TEXT UNIQUE,
    rg TEXT,
    plan_id TEXT DEFAULT 'tier-cultivador',
    has_seen_welcome_message BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.profiles IS 'Stores public-facing profile information for each user, including their role.';

-- Categories Table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    icon TEXT,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, name, type)
);
COMMENT ON TABLE public.categories IS 'Stores categories for transactions. Default categories have a NULL user_id.';

-- Transactions Table
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    date DATE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    notes TEXT,
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.transactions IS 'Records all income and expense transactions for users.';

-- Budgets Table
CREATE TABLE public.budgets (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    limit_amount NUMERIC(12, 2) NOT NULL,
    spent_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_budget_period UNIQUE (user_id, category_id, period_start_date, period_end_date)
);
COMMENT ON TABLE public.budgets IS 'Defines spending limits for categories over a specific period.';

-- Financial Goals Table
CREATE TABLE public.financial_goals (
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
COMMENT ON TABLE public.financial_goals IS 'Tracks user financial goals, such as saving for a trip or a large purchase.';


-- 3. HELPER FUNCTIONS FOR RLS
-- Helper function to check if the current user is an admin.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin';
END;
$$;

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS for all user-data tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;

-- Clear existing policies before creating new ones
DROP POLICY IF EXISTS "Allow all access to admins" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;

DROP POLICY IF EXISTS "Allow all access to admins" ON public.categories;
DROP POLICY IF EXISTS "Users can view their own and default categories." ON public.categories;
DROP POLICY IF EXISTS "Users can manage their own categories." ON public.categories;

DROP POLICY IF EXISTS "Allow all access to admins" ON public.transactions;
DROP POLICY IF EXISTS "Users can manage their own transactions." ON public.transactions;

DROP POLICY IF EXISTS "Allow all access to admins" ON public.budgets;
DROP POLICY IF EXISTS "Users can manage their own budgets." ON public.budgets;

DROP POLICY IF EXISTS "Allow all access to admins" ON public.financial_goals;
DROP POLICY IF EXISTS "Users can manage their own financial goals." ON public.financial_goals;


-- PROFILES Policies
CREATE POLICY "Allow all access to admins" ON public.profiles FOR ALL USING (public.is_admin());
CREATE POLICY "Users can view their own profile." ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- CATEGORIES Policies
CREATE POLICY "Allow all access to admins" ON public.categories FOR ALL USING (public.is_admin());
CREATE POLICY "Users can view their own and default categories." ON public.categories FOR SELECT USING (auth.uid() = user_id OR is_default = TRUE);
CREATE POLICY "Users can manage their own categories." ON public.categories FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND is_default = FALSE);

-- TRANSACTIONS Policies
CREATE POLICY "Allow all access to admins" ON public.transactions FOR ALL USING (public.is_admin());
CREATE POLICY "Users can manage their own transactions." ON public.transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- BUDGETS Policies
CREATE POLICY "Allow all access to admins" ON public.budgets FOR ALL USING (public.is_admin());
CREATE POLICY "Users can manage their own budgets." ON public.budgets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- FINANCIAL_GOALS Policies
CREATE POLICY "Allow all access to admins" ON public.financial_goals FOR ALL USING (public.is_admin());
CREATE POLICY "Users can manage their own financial goals." ON public.financial_goals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- 5. TRIGGERS AND FUNCTIONS

-- Function to create a profile entry when a new user signs up in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, full_name, avatar_url, account_type, plan_id, has_seen_welcome_message, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    'pessoa', -- Always default to 'pessoa' on signup
    'tier-cultivador', -- Always default to the free plan
    FALSE,
    'user' -- Always default to 'user' role
  );
  RETURN NEW;
END;
$$;

-- Trigger to call the function on new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
    
-- Function to automatically update `updated_at` columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for `updated_at`
DROP TRIGGER IF EXISTS handle_updated_at ON public.profiles;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS handle_updated_at ON public.categories;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS handle_updated_at ON public.transactions;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS handle_updated_at ON public.budgets;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.budgets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS handle_updated_at ON public.financial_goals;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.financial_goals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();


-- 6. SEED DATA (Default Categories)
-- This ensures that every user has a basic set of categories to start with.
INSERT INTO public.categories (name, type, icon, is_default)
VALUES
    ('Salário', 'income', 'Wallet', TRUE),
    ('Freelance', 'income', 'Briefcase', TRUE),
    ('Investimentos', 'income', 'TrendingUp', TRUE),
    ('Outras Receitas', 'income', 'DollarSign', TRUE),
    ('Moradia', 'expense', 'Home', TRUE),
    ('Alimentação', 'expense', 'UtensilsCrossed', TRUE),
    ('Transporte', 'expense', 'Car', TRUE),
    ('Lazer', 'expense', 'GlassWater', TRUE),
    ('Saúde', 'expense', 'HeartPulse', TRUE),
    ('Educação', 'expense', 'BookOpen', TRUE),
    ('Compras', 'expense', 'ShoppingBag', TRUE),
    ('Contas e Serviços', 'expense', 'Receipt', TRUE),
    ('Impostos', 'expense', 'Landmark', TRUE),
    ('Outras Despesas', 'expense', 'MoreHorizontal', TRUE)
ON CONFLICT (user_id, name, type) DO NOTHING;

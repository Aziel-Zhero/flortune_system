-- =============================================================================
-- DATABASE SCHEMA FOR FLORTUNE
--
-- Features:
-- - 3rd Normal Form (3FN) structure.
-- - Row-Level Security (RLS) enabled for all user-related tables.
-- - Policies to ensure users can only access their own data.
-- - Trigger to automatically create a user profile upon new user signup.
-- - No initial seed data is inserted.
-- =============================================================================

-- === EXTENSIONS ===
-- Enable the UUID extension if not already enabled.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- === ENUM TYPES ===
-- Custom types for consistent data values.
DROP TYPE IF EXISTS public.account_type_enum CASCADE;
CREATE TYPE public.account_type_enum AS ENUM ('pessoa', 'empresa');

DROP TYPE IF EXISTS public.transaction_type_enum CASCADE;
CREATE TYPE public.transaction_type_enum AS ENUM ('income', 'expense');

DROP TYPE IF EXISTS public.goal_status_enum CASCADE;
CREATE TYPE public.goal_status_enum AS ENUM ('in_progress', 'achieved', 'cancelled');

DROP TYPE IF EXISTS public.dev_client_status_enum CASCADE;
CREATE TYPE public.dev_client_status_enum AS ENUM ('planning', 'in_progress', 'delivered', 'on_hold', 'delayed');

DROP TYPE IF EXISTS public.dev_client_priority_enum CASCADE;
CREATE TYPE public.dev_client_priority_enum AS ENUM ('low', 'medium', 'high');


-- === TABLES ===

-- 1. PROFILES TABLE
-- Stores public user information. Linked to Supabase Auth users.
DROP TABLE IF EXISTS public.profiles CASCADE;
CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  display_name text,
  email text NOT NULL UNIQUE,
  phone text,
  avatar_url text,
  account_type public.account_type_enum,
  cpf_cnpj text UNIQUE,
  rg text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.profiles IS 'Stores public-facing profile information for each user.';

-- 2. CATEGORIES TABLE
-- Stores transaction categories. Can be default or user-created.
DROP TABLE IF EXISTS public.categories CASCADE;
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  type public.transaction_type_enum NOT NULL,
  icon text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_category_name_unique UNIQUE (user_id, name)
);
COMMENT ON TABLE public.categories IS 'Stores expense and income categories. Shared (default) or user-specific.';

-- 3. TRANSACTIONS TABLE
-- Stores all financial transactions for users.
DROP TABLE IF EXISTS public.transactions CASCADE;
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  description text NOT NULL,
  amount numeric(12, 2) NOT NULL,
  date date NOT NULL,
  type public.transaction_type_enum NOT NULL,
  notes text,
  is_recurring boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.transactions IS 'Records all income and expense transactions for a user.';

-- 4. BUDGETS TABLE
-- Stores user-defined budgets for specific categories.
DROP TABLE IF EXISTS public.budgets CASCADE;
CREATE TABLE public.budgets (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  limit_amount numeric(12, 2) NOT NULL,
  spent_amount numeric(12, 2) NOT NULL DEFAULT 0.00,
  period_start_date date NOT NULL,
  period_end_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_category_period_unique UNIQUE (user_id, category_id, period_start_date)
);
COMMENT ON TABLE public.budgets IS 'Defines spending limits for categories over a specific period.';

-- 5. FINANCIAL GOALS TABLE
-- Stores user's financial savings goals.
DROP TABLE IF EXISTS public.financial_goals CASCADE;
CREATE TABLE public.financial_goals (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  target_amount numeric(12, 2) NOT NULL,
  current_amount numeric(12, 2) NOT NULL DEFAULT 0.00,
  deadline_date date,
  icon text,
  status public.goal_status_enum NOT NULL DEFAULT 'in_progress',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.financial_goals IS 'Tracks user savings goals and progress.';

-- 6. TODOS TABLE
-- A simple to-do list for users.
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
COMMENT ON TABLE public.todos IS 'A simple to-do list for user tasks.';

-- 7. NOTES TABLE
-- A simple notepad for users.
DROP TABLE IF EXISTS public.notes CASCADE;
CREATE TABLE public.notes (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  color text DEFAULT 'default',
  is_pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.notes IS 'Stores user notes and ideas.';

-- 8. DEV CLIENTS TABLE
-- For the developer module to manage clients and projects.
DROP TABLE IF EXISTS public.dev_clients CASCADE;
CREATE TABLE public.dev_clients (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  service_type text,
  status public.dev_client_status_enum NOT NULL DEFAULT 'planning',
  priority public.dev_client_priority_enum NOT NULL DEFAULT 'medium',
  start_date date,
  deadline date,
  total_price numeric(12, 2),
  notes text,
  tasks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.dev_clients IS 'Stores client and project information for the developer tools.';

-- === TRIGGERS & FUNCTIONS ===

-- Function to create a profile for a new user from auth.users.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url, account_type)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'avatar_url',
    'pessoa' -- Default to 'pessoa', can be changed later.
  );
  RETURN NEW;
END;
$$;

-- Trigger to call the function when a new user signs up.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- === ROW LEVEL SECURITY (RLS) ===

-- Enable RLS for all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_clients ENABLE ROW LEVEL SECURITY;

-- Clear existing policies before creating new ones
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Allow service_role to insert profiles." ON public.profiles;

DROP POLICY IF EXISTS "Users can manage their own categories." ON public.categories;
DROP POLICY IF EXISTS "Users can view default categories." ON public.categories;

DROP POLICY IF EXISTS "Users can manage their own transactions." ON public.transactions;
DROP POLICY IF EXISTS "Users can manage their own budgets." ON public.budgets;
DROP POLICY IF EXISTS "Users can manage their own financial goals." ON public.financial_goals;
DROP POLICY IF EXISTS "Users can manage their own todos." ON public.todos;
DROP POLICY IF EXISTS "Users can manage their own notes." ON public.notes;
DROP POLICY IF EXISTS "Users can manage their own dev clients." ON public.dev_clients;


-- RLS Policies for PROFILES
CREATE POLICY "Users can view their own profile."
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile."
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
  
CREATE POLICY "Allow service_role to insert profiles."
  ON public.profiles FOR INSERT
  WITH CHECK (auth.role() = 'service_role');


-- RLS Policies for CATEGORIES
CREATE POLICY "Users can manage their own categories."
  ON public.categories FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view default categories."
  ON public.categories FOR SELECT
  USING (is_default = true);


-- RLS Policies for other tables (simple ownership check)
CREATE POLICY "Users can manage their own transactions."
  ON public.transactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own budgets."
  ON public.budgets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own financial goals."
  ON public.financial_goals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own todos."
  ON public.todos FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own notes."
  ON public.notes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can manage their own dev clients."
  ON public.dev_clients FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================

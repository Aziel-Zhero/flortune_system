-- FLORTUNE DATABASE SCHEMA
-- This script is idempotent and can be re-run safely.

-- 1. Create a schema for NextAuth.js
DROP SCHEMA IF EXISTS next_auth CASCADE;
CREATE SCHEMA next_auth;

-- 2. Grant usage to necessary roles
GRANT USAGE ON SCHEMA next_auth TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA next_auth GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA next_auth GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA next_auth GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

-- 3. Create NextAuth.js tables
CREATE TABLE next_auth.users (
  id uuid NOT NULL,
  name text NULL,
  email text NULL,
  "emailVerified" timestamptz NULL,
  image text NULL,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_email_key UNIQUE (email)
);
CREATE TABLE next_auth.accounts (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "userId" uuid NOT NULL,
  type text NOT NULL,
  provider text NOT NULL,
  "providerAccountId" text NOT NULL,
  refresh_token text NULL,
  access_token text NULL,
  expires_at int8 NULL,
  token_type text NULL,
  scope text NULL,
  id_token text NULL,
  session_state text NULL,
  CONSTRAINT accounts_pkey PRIMARY KEY (id),
  CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES next_auth.users(id) ON DELETE CASCADE
);
CREATE TABLE next_auth.sessions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "sessionToken" text NOT NULL,
  "userId" uuid NOT NULL,
  expires timestamptz NOT NULL,
  CONSTRAINT sessions_pkey PRIMARY KEY (id),
  CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES next_auth.users(id) ON DELETE CASCADE
);
CREATE TABLE next_auth.verification_tokens (
  identifier text NOT NULL,
  token text NOT NULL,
  expires timestamptz NOT NULL,
  CONSTRAINT verification_tokens_pkey PRIMARY KEY (identifier, token)
);


-- 4. Create public.profiles table
-- This table is used to store user profile data.
-- The `hashed_password` column is REMOVED as Supabase Auth handles it.
DROP TABLE IF EXISTS public.profiles CASCADE;
CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text,
    display_name text,
    email text UNIQUE NOT NULL,
    avatar_url text,
    account_type text,
    cpf_cnpj text UNIQUE,
    rg text,
    plan_id text DEFAULT 'tier-cultivador',
    has_seen_welcome_message boolean DEFAULT false,
    role text DEFAULT 'user'::text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (id),
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.profiles IS 'Stores public profile information for each user.';

-- 5. Set up Row Level Security (RLS) for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);


-- 6. Trigger to automatically create a profile when a new user signs up in auth.users
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, display_name, avatar_url, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'avatar_url',
    'user'
  );
  return new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists and recreate it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 7. Create other application tables (transactions, categories, etc.)
-- These tables now use RLS to ensure users can only access their own data.

-- Categories Table
DROP TABLE IF EXISTS public.categories CASCADE;
CREATE TABLE public.categories (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    type text NOT NULL, -- 'income' or 'expense'
    icon text,
    is_default boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own categories, and view defaults."
  ON public.categories FOR ALL
  USING (auth.uid() = user_id OR is_default = true);

-- Transactions Table
DROP TABLE IF EXISTS public.transactions CASCADE;
CREATE TABLE public.transactions (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    description text NOT NULL,
    amount numeric(12, 2) NOT NULL,
    date date NOT NULL,
    type text NOT NULL, -- 'income' or 'expense'
    notes text,
    is_recurring boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own transactions."
  ON public.transactions FOR ALL
  USING (auth.uid() = user_id);

-- Budgets Table
DROP TABLE IF EXISTS public.budgets CASCADE;
CREATE TABLE public.budgets (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    limit_amount numeric(12, 2) NOT NULL,
    spent_amount numeric(12, 2) DEFAULT 0.00,
    period_start_date date NOT NULL,
    period_end_date date NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own budgets."
  ON public.budgets FOR ALL
  USING (auth.uid() = user_id);

-- Financial Goals Table
DROP TABLE IF EXISTS public.financial_goals CASCADE;
CREATE TABLE public.financial_goals (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    target_amount numeric(12, 2) NOT NULL,
    current_amount numeric(12, 2) DEFAULT 0.00,
    deadline_date date,
    icon text,
    status text DEFAULT 'in_progress', -- 'in_progress', 'achieved', 'cancelled'
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own financial goals."
  ON public.financial_goals FOR ALL
  USING (auth.uid() = user_id);


-- Telegram Integration Table (Admin-only, no RLS needed if accessed with service_role)
DROP TABLE IF EXISTS public.telegram_integration;
CREATE TABLE public.telegram_integration (
    id bigint PRIMARY KEY,
    bot_token text,
    chat_id text,
    updated_at timestamptz DEFAULT now()
);
-- Ensure only one row can exist for singleton pattern
CREATE UNIQUE INDEX ON public.telegram_integration ((id = 1));
-- Insert the default empty row if it doesn't exist
INSERT INTO public.telegram_integration (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Grant permissions on new public tables
GRANT ALL ON TABLE public.categories TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.transactions TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.budgets TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.financial_goals TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.telegram_integration TO postgres, service_role; -- Only service_role can access

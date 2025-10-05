-- Simplified Schema based on user request to delete non-API tables.

-- Drop dependent policies first
DROP POLICY IF EXISTS "Allow anon to insert new profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow all users to read public profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow individual users to update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow individual users to delete their own profile" ON public.profiles;

DROP POLICY IF EXISTS "Allow all users to read default categories" ON public.categories;
DROP POLICY IF EXISTS "Allow individual users to manage their own categories" ON public.categories;

DROP POLICY IF EXISTS "Allow individual users to manage their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow individual users to manage their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Allow individual users to manage their own goals" ON public.financial_goals;
DROP POLICY IF EXISTS "Allow individual users to manage their own todos" ON public.todos;
DROP POLICY IF EXISTS "Allow individual users to manage their own notes" ON public.notes;
DROP POLICY IF EXISTS "Allow individual users to manage their own dev clients" ON public.dev_clients;
DROP POLICY IF EXISTS "Allow individual users to manage their own financial assets" ON public.financial_assets;


-- Drop tables
DROP TABLE IF EXISTS public.budgets;
DROP TABLE IF EXISTS public.financial_goals;
DROP TABLE IF EXISTS public.todos;
DROP TABLE IF EXISTS public.notes;
DROP TABLE IF EXISTS public.dev_clients;
DROP TABLE IF EXISTS public.financial_assets;
DROP TABLE IF EXISTS public.transactions;
DROP TABLE IF EXISTS public.categories;
DROP TABLE IF EXISTS public.profiles;


-- Drop types if they exist
DROP TYPE IF EXISTS public.account_type_enum;
DROP TYPE IF EXISTS public.goal_status_enum;
DROP TYPE IF EXISTS public.transaction_type_enum;
DROP TYPE IF EXISTS public.client_status_enum;
DROP TYPE IF EXISTS public.client_priority_enum;

-- The tables api_cities, quote_logs, and weather_logs are intentionally kept as requested.
-- The schema is now clean of the other application tables.

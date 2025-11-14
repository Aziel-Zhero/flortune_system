-- FLORTUNE - ADMIN SCHEMA
-- This script should be run once to set up the admin table.
-- It is safe to re-run, as it uses `IF NOT EXISTS`.

-- 1. ADMINS TABLE
-- Stores credentials and information for system administrators.
-- This table is separate from `public.profiles` for security.
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.admins IS 'Stores credentials and information for system administrators.';


-- 2. ROW LEVEL SECURITY (RLS) FOR ADMINS
-- By default, no one can access the admins table.
-- This prevents accidental exposure of hashed passwords.
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Clear existing policies
DROP POLICY IF EXISTS "Admins can view their own data" ON public.admins;
DROP POLICY IF EXISTS "Deny all other access to admins table" ON public.admins;

-- Admins should not even be able to see their own data via RLS,
-- as all authentication happens with the service_role key on the server.
-- This policy denies all access to be extra safe.
CREATE POLICY "Deny all other access to admins table"
    ON public.admins FOR ALL
    USING (false)
    WITH CHECK (false);

-- 3. TRIGGER FOR `updated_at`
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_updated_at ON public.admins;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.admins FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

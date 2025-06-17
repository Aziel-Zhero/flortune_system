-- Esquema para tabelas customizadas do aplicativo (public)

-- Tabela de Perfis de Usuário (estendendo informações de autenticação)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL PRIMARY KEY, -- Este ID será o mesmo que next_auth.users.id
    full_name TEXT,
    display_name TEXT,
    email TEXT NOT NULL UNIQUE, -- Email do usuário, deve ser consistente com next_auth.users.email
    hashed_password TEXT NULL, -- Senha hasheada para login por credenciais, NULL para OAuth users
    phone TEXT UNIQUE NULL,
    cpf_cnpj TEXT UNIQUE NULL,
    rg TEXT NULL,
    avatar_url TEXT,
    account_type TEXT CHECK (account_type IN ('pessoa', 'empresa')), -- 'pessoa' ou 'empresa'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.profiles IS 'Stores user profile information, extending authentication data. The id should match the id in next_auth.users.';

-- RLS para public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política: Usuários autenticados podem ler e atualizar SEU PRÓPRIO perfil.
DROP POLICY IF EXISTS "Authenticated users can access their own profile" ON public.profiles;
CREATE POLICY "Authenticated users can access their own profile"
ON public.profiles
FOR ALL -- Permite SELECT, INSERT, UPDATE, DELETE
TO authenticated
USING (id = next_auth.uid()) -- next_auth.uid() é o ID do usuário logado via NextAuth
WITH CHECK (id = next_auth.uid());

-- Política: Permitir que 'anon' (não autenticado) insira perfis (para cadastro de credenciais)
-- Esta política é necessária para que a server action de signup possa criar um perfil.
DROP POLICY IF EXISTS "Allow anon to insert profiles" ON public.profiles;
CREATE POLICY "Allow anon to insert profiles"
ON public.profiles
FOR INSERT
TO anon
WITH CHECK (true);

-- Política: Permitir que 'anon' (não autenticado) leia emails para verificação de duplicidade no cadastro
DROP POLICY IF EXISTS "Allow anon to read emails for signup check" ON public.profiles;
CREATE POLICY "Allow anon to read emails for signup check"
ON public.profiles
FOR SELECT
TO anon
USING (true); -- Simplificado para permitir leitura de emails por anon; idealmente seria mais restrito


-- Tabela de Categorias
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NULL, -- Nulo para categorias padrão
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')), -- 'income' ou 'expense'
    icon TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_category_name UNIQUE (user_id, name, type) -- Evitar categorias duplicadas para o mesmo usuário
);
COMMENT ON TABLE public.categories IS 'Stores transaction categories, including default and user-defined ones.';

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to default categories" ON public.categories FOR SELECT USING (is_default = true);
CREATE POLICY "Users can manage their own categories" ON public.categories FOR ALL USING (user_id = next_auth.uid());


-- Tabela de Transações
CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    date DATE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.transactions IS 'Stores all financial transactions for users.';

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own transactions" ON public.transactions FOR ALL USING (user_id = next_auth.uid());


-- Tabela de Orçamentos
CREATE TABLE IF NOT EXISTS public.budgets (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    limit_amount DECIMAL(10, 2) NOT NULL,
    spent_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_category_period UNIQUE (user_id, category_id, period_start_date, period_end_date)
);
COMMENT ON TABLE public.budgets IS 'Stores user-defined budgets for specific categories and periods.';

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own budgets" ON public.budgets FOR ALL USING (user_id = next_auth.uid());


-- Tabela de Metas Financeiras
CREATE TABLE IF NOT EXISTS public.financial_goals (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount DECIMAL(10, 2) NOT NULL,
    current_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    deadline_date DATE,
    icon TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'achieved', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.financial_goals IS 'Stores user financial goals and tracks their progress.';

ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own financial goals" ON public.financial_goals FOR ALL USING (user_id = next_auth.uid());

-- Auto-update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar o trigger às tabelas que têm 'updated_at'
DO $$
DECLARE
  t_name TEXT;
BEGIN
  FOR t_name IN SELECT table_name FROM information_schema.columns WHERE column_name = 'updated_at' AND table_schema = 'public'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_timestamp ON public.%I;', t_name);
    EXECUTE format('CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_timestamp();', t_name);
  END LOOP;
END;
$$;


--
-- Schema `next_auth` para o SupabaseAdapter do NextAuth.js
-- (Conforme documentação do @auth/supabase-adapter)
--

-- Criar o schema se não existir
CREATE SCHEMA IF NOT EXISTS next_auth;
 
-- Conceder permissões
GRANT USAGE ON SCHEMA next_auth TO service_role;
GRANT ALL ON SCHEMA next_auth TO postgres; -- postgres é o superusuário
 
-- Tabela next_auth.users
CREATE TABLE IF NOT EXISTS next_auth.users
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name text,
    email text,
    "emailVerified" timestamp with time zone,
    image text,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT email_unique UNIQUE (email)
);
GRANT ALL ON TABLE next_auth.users TO postgres;
GRANT ALL ON TABLE next_auth.users TO service_role;
 
-- Função next_auth.uid() para RLS
CREATE OR REPLACE FUNCTION next_auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select
  	coalesce(
		nullif(current_setting('request.jwt.claim.sub', true), ''),
		(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
	)::uuid
$$;
 
-- Tabela next_auth.sessions
CREATE TABLE IF NOT EXISTS next_auth.sessions
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    expires timestamp with time zone NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" uuid,
    CONSTRAINT sessions_pkey PRIMARY KEY (id),
    CONSTRAINT sessionToken_unique UNIQUE ("sessionToken"),
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES next_auth.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);
GRANT ALL ON TABLE next_auth.sessions TO postgres;
GRANT ALL ON TABLE next_auth.sessions TO service_role;
 
-- Tabela next_auth.accounts
CREATE TABLE IF NOT EXISTS next_auth.accounts
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    type text NOT NULL,
    provider text NOT NULL,
    "providerAccountId" text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at bigint,
    token_type text,
    scope text,
    id_token text,
    session_state text,
    oauth_token_secret text,
    oauth_token text,
    "userId" uuid,
    CONSTRAINT accounts_pkey PRIMARY KEY (id),
    CONSTRAINT provider_account_unique UNIQUE (provider, "providerAccountId"),
    CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES next_auth.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);
GRANT ALL ON TABLE next_auth.accounts TO postgres;
GRANT ALL ON TABLE next_auth.accounts TO service_role;
 
-- Tabela next_auth.verification_tokens
CREATE TABLE IF NOT EXISTS next_auth.verification_tokens
(
    identifier text,
    token text,
    expires timestamp with time zone NOT NULL,
    CONSTRAINT verification_tokens_pkey PRIMARY KEY (token, identifier) -- Alterado para PK composta
    -- CONSTRAINT token_unique UNIQUE (token) -- Removido se PK é (token, identifier)
    -- CONSTRAINT token_identifier_unique UNIQUE (token, identifier) -- Redundante se PK é (token, identifier)
);
GRANT ALL ON TABLE next_auth.verification_tokens TO postgres;
GRANT ALL ON TABLE next_auth.verification_tokens TO service_role;


-- Trigger para criar um perfil em public.profiles quando um novo usuário é criado em next_auth.users
CREATE OR REPLACE FUNCTION public.handle_new_next_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, full_name, avatar_url, account_type)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.name, -- Usar o 'name' do NextAuth user como display_name
    NEW.name, -- E também como full_name inicialmente
    NEW.image, -- Usar o 'image' do NextAuth user como avatar_url
    'pessoa'  -- Definir um tipo de conta padrão, ex: 'pessoa'
  )
  ON CONFLICT (id) DO NOTHING; -- Não faz nada se o perfil já existir (improvável para NEW)
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_next_auth_user_created ON next_auth.users;
CREATE TRIGGER on_next_auth_user_created
  AFTER INSERT ON next_auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_next_auth_user();

-- Habilitar a extensão pgcrypto se ainda não estiver habilitada (necessária para uuid_generate_v4())
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA public;
COMMENT ON EXTENSION "pgcrypto" IS 'cryptographic functions';


-- Seed de categorias padrão
INSERT INTO public.categories (name, type, icon, is_default) VALUES
('Salário', 'income', 'Landmark', TRUE),
('Investimentos', 'income', 'TrendingUp', TRUE),
('Freelance', 'income', 'Briefcase', TRUE),
('Outras Receitas', 'income', 'DollarSign', TRUE),
('Alimentação', 'expense', 'Utensils', TRUE),
('Moradia', 'expense', 'Home', TRUE),
('Transporte', 'expense', 'Car', TRUE),
('Saúde', 'expense', 'HeartPulse', TRUE),
('Educação', 'expense', 'GraduationCap', TRUE),
('Lazer', 'expense', 'Ticket', TRUE),
('Vestuário', 'expense', 'Shirt', TRUE),
('Contas Fixas', 'expense', 'FileText', TRUE), -- Ex: água, luz, internet
('Impostos', 'expense', 'Landmark', TRUE),
('Doações', 'expense', 'Gift', TRUE),
('Cuidados Pessoais', 'expense', 'Sparkles', TRUE),
('Compras Diversas', 'expense', 'ShoppingCart', TRUE),
('Viagens', 'expense', 'Plane', TRUE),
('Assinaturas', 'expense', 'AppWindow', TRUE), -- Ex: streaming, software
('Empréstimos', 'expense', 'CreditCard', TRUE),
('Outras Despesas', 'expense', 'Receipt', TRUE)
ON CONFLICT (user_id, name, type) WHERE user_id IS NULL DO NOTHING; -- Evita duplicatas de categorias padrão se o script for rodado múltiplas vezes

-- Grant permissions on functions in public schema to service_role and authenticated
-- GRANT EXECUTE ON FUNCTION public.handle_new_next_auth_user() TO service_role;
-- GRANT EXECUTE ON FUNCTION public.trigger_set_timestamp() TO service_role;
GRANT USAGE ON SCHEMA public TO service_role, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role, authenticated;

-- Grant permissions on functions in next_auth schema to service_role
GRANT EXECUTE ON FUNCTION next_auth.uid() TO service_role;
GRANT USAGE ON SCHEMA next_auth TO service_role, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA next_auth TO authenticated; -- Permitir que usuários autenticados leiam tabelas do next_auth para o adapter.

-- Importante: Certifique-se que o schema `next_auth` está exposto na API do Supabase.
-- Vá para Supabase Dashboard > API Settings (ícone de engrenagem) > API > Config > Exposed schemas.
-- Adicione `next_auth` à lista (além de `public`, `storage`, etc.).
-- A service_role key ignora RLS, então ela terá acesso mesmo sem grants explícitos em todas as tabelas/funções.



-- SQL Schema para Flortune com NextAuth.js e SupabaseAdapter

-- PASSO 1: Limpeza (Opcional, mas recomendado para um novo começo se houve problemas)
-- Execute estes COMANDOS DE LIMPEZA no Editor SQL do Supabase ANTES de executar o restante deste script
-- SE VOCÊ JÁ OS EXECUTOU COM SUCESSO ANTERIORMENTE, PODE PULAR ESTA SEÇÃO DE LIMPEZA.
/*
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TABLE IF EXISTS public.financial_goals CASCADE;
DROP TABLE IF EXISTS public.budgets CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP SCHEMA IF EXISTS next_auth CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_from_next_auth() CASCADE;
DROP FUNCTION IF EXISTS next_auth.uid() CASCADE;
SELECT 'Script de limpeza executado (se não comentado).' as cleanup_status;
*/

-- PASSO 2: Criação do Schema `next_auth` (conforme documentação do SupabaseAdapter)
CREATE SCHEMA IF NOT EXISTS next_auth;

GRANT USAGE ON SCHEMA next_auth TO service_role;
GRANT ALL ON SCHEMA next_auth TO postgres;

-- Criar a extensão uuid-ossp se ainda não existir (necessária para uuid_generate_v4())
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- Tabela next_auth.users
CREATE TABLE IF NOT EXISTS next_auth.users
(
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    name text,
    email text,
    "emailVerified" timestamp with time zone,
    image text,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT email_unique UNIQUE (email)
);
GRANT ALL ON TABLE next_auth.users TO postgres;
GRANT ALL ON TABLE next_auth.users TO service_role;


-- Função next_auth.uid() (para RLS, conforme documentação do adapter)
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
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
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
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
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
    CONSTRAINT provider_unique UNIQUE (provider, "providerAccountId"),
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
    CONSTRAINT verification_tokens_pkey PRIMARY KEY (token),
    CONSTRAINT token_unique UNIQUE (token),
    CONSTRAINT token_identifier_unique UNIQUE (token, identifier)
);
GRANT ALL ON TABLE next_auth.verification_tokens TO postgres;
GRANT ALL ON TABLE next_auth.verification_tokens TO service_role;


-- PASSO 3: Criação das tabelas do schema `public` (Flortune)

-- Tabela public.profiles (para dados customizados do usuário e senha hasheada)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL PRIMARY KEY, -- Este ID DEVE corresponder ao next_auth.users.id
    full_name text,
    display_name text,
    email text NOT NULL UNIQUE, -- Email também é UNIQUE aqui para consistência
    hashed_password text NOT NULL, -- Para login com credenciais
    phone text,
    cpf_cnpj text UNIQUE,
    rg text,
    avatar_url text,
    account_type text CHECK (account_type IN ('pessoa', 'empresa')),
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT fk_user_id FOREIGN KEY (id) REFERENCES next_auth.users(id) ON DELETE CASCADE -- Garante que o profile seja deletado se o usuário em next_auth.users for deletado
);
-- RLS Policies para public.profiles (INICIALMENTE PERMISSIVAS PARA TESTE)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política: Usuários autenticados podem ler seus próprios perfis.
DROP POLICY IF EXISTS "Authenticated users can read their own profile" ON public.profiles;
CREATE POLICY "Authenticated users can read their own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (id = next_auth.uid());

-- Política: Usuários autenticados podem atualizar seus próprios perfis.
DROP POLICY IF EXISTS "Authenticated users can update their own profile" ON public.profiles;
CREATE POLICY "Authenticated users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = next_auth.uid())
    WITH CHECK (id = next_auth.uid());

-- Política: Permitir que 'anon' (não autenticado) leia emails para verificação de existência no cadastro.
-- E também para inserir novos perfis no momento do cadastro.
-- Esta é uma simplificação. Para produção, seria mais restrito ou feito via server-side com service_role.
DROP POLICY IF EXISTS "Allow anon to insert profiles and read emails for signup" ON public.profiles;
CREATE POLICY "Allow anon to insert profiles and read emails for signup"
    ON public.profiles FOR ALL -- ALL cobre INSERT e SELECT
    TO anon
    USING (true) -- Para SELECT, permite ler qualquer email (necessário para verificar duplicidade no signup)
    WITH CHECK (true); -- Para INSERT, permite inserir qualquer perfil

-- Tabela public.categories
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE, -- Nulo para categorias padrão
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('income', 'expense')),
    icon text,
    is_default boolean NOT NULL DEFAULT false,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
-- Política: Usuários autenticados podem gerenciar (CRUD) suas próprias categorias.
DROP POLICY IF EXISTS "Authenticated users can manage their own categories" ON public.categories;
CREATE POLICY "Authenticated users can manage their own categories"
    ON public.categories FOR ALL
    TO authenticated
    USING (user_id = next_auth.uid())
    WITH CHECK (user_id = next_auth.uid());
-- Política: Permitir leitura de categorias padrão (is_default = true) por qualquer um (anon e authenticated).
DROP POLICY IF EXISTS "Allow public read access to default categories" ON public.categories;
CREATE POLICY "Allow public read access to default categories"
    ON public.categories FOR SELECT
    TO public -- 'public' role abrange anon e authenticated
    USING (is_default = true);


-- Tabela public.transactions
CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    description text NOT NULL,
    amount numeric(12, 2) NOT NULL,
    date date NOT NULL,
    type text NOT NULL CHECK (type IN ('income', 'expense')),
    notes text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage their own transactions" ON public.transactions;
CREATE POLICY "Authenticated users can manage their own transactions"
    ON public.transactions FOR ALL
    TO authenticated
    USING (user_id = next_auth.uid())
    WITH CHECK (user_id = next_auth.uid());

-- Tabela public.budgets
CREATE TABLE IF NOT EXISTS public.budgets (
    id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    limit_amount numeric(12, 2) NOT NULL,
    spent_amount numeric(12, 2) NOT NULL DEFAULT 0.00,
    period_start_date date NOT NULL,
    period_end_date date NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT unique_budget_period_category UNIQUE (user_id, category_id, period_start_date)
);
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage their own budgets" ON public.budgets;
CREATE POLICY "Authenticated users can manage their own budgets"
    ON public.budgets FOR ALL
    TO authenticated
    USING (user_id = next_auth.uid())
    WITH CHECK (user_id = next_auth.uid());

-- Tabela public.financial_goals
CREATE TABLE IF NOT EXISTS public.financial_goals (
    id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    target_amount numeric(12, 2) NOT NULL,
    current_amount numeric(12, 2) NOT NULL DEFAULT 0.00,
    deadline_date date,
    icon text,
    notes text,
    status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'achieved', 'cancelled')),
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage their own financial_goals" ON public.financial_goals;
CREATE POLICY "Authenticated users can manage their own financial_goals"
    ON public.financial_goals FOR ALL
    TO authenticated
    USING (user_id = next_auth.uid())
    WITH CHECK (user_id = next_auth.uid());


-- PASSO 4: Trigger para popular public.profiles a partir de next_auth.users
-- Este trigger garante que quando um usuário é criado em next_auth.users (por exemplo, via OAuth),
-- um registro correspondente seja criado em public.profiles.
-- A função `signupUser` para credenciais já insere diretamente em public.profiles (e o adapter em next_auth.users).
-- Este trigger é mais um fallback/garantia para OAuth.
CREATE OR REPLACE FUNCTION public.handle_new_user_from_next_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- Insere em public.profiles usando os dados de next_auth.users
  -- hashed_password é NOT NULL, então precisamos de um placeholder se não for login por credencial
  -- Idealmente, para OAuth, o usuário não teria senha local até definir uma.
  -- Mas para a constraint, vamos usar um valor não utilizável.
  -- A action de signup para credenciais é quem deve inserir a senha hasheada correta.
  INSERT INTO public.profiles (id, email, display_name, full_name, avatar_url, hashed_password, account_type)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.name,  -- Pode ser ajustado/mapeado conforme necessário
    NEW.name,  -- Pode ser ajustado/mapeado conforme necessário
    NEW.image, -- URL do avatar do provedor OAuth
    '$2a$10$thisisadefaultplaceholdercannotbeusedtologin', -- Senha placeholder não funcional
    'pessoa' -- Tipo de conta padrão para OAuth, pode ser ajustado
  )
  ON CONFLICT (id) DO NOTHING; -- Não faz nada se o perfil já existir (ex: criado pelo signup de credenciais)
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_next_auth_user_created ON next_auth.users;
CREATE TRIGGER on_next_auth_user_created
  AFTER INSERT ON next_auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_from_next_auth();

-- Adicionar algumas categorias padrão
INSERT INTO public.categories (name, type, icon, is_default, user_id) VALUES
('Salário', 'income', 'DollarSign', true, null),
('Freelance', 'income', 'Briefcase', true, null),
('Investimentos', 'income', 'TrendingUp', true, null),
('Outras Receitas', 'income', 'PlusCircle', true, null),
('Moradia', 'expense', 'Home', true, null),
('Alimentação', 'expense', 'Utensils', true, null),
('Transporte', 'expense', 'Car', true, null),
('Saúde', 'expense', 'HeartPulse', true, null),
('Educação', 'expense', 'BookOpen', true, null),
('Lazer', 'expense', 'Gamepad2', true, null),
('Vestuário', 'expense', 'Shirt', true, null),
('Contas', 'expense', 'Receipt', true, null), -- (água, luz, internet)
('Compras', 'expense', 'ShoppingCart', true, null),
('Impostos', 'expense', 'Landmark', true, null),
('Doações', 'expense', 'Gift', true, null),
('Viagens', 'expense', 'Plane', true, null),
('Assinaturas', 'expense', 'CreditCard', true, null),
('Cuidados Pessoais', 'expense', 'Sparkles', true, null),
('Reparos e Manutenção', 'expense', 'Wrench', true, null),
('Outras Despesas', 'expense', 'MinusCircle', true, null)
ON CONFLICT (name, type, is_default, user_id) DO NOTHING
WHERE user_id IS NULL; -- Garante que só insira se user_id for NULL, para não conflitar com categorias de usuário com mesmo nome

SELECT 'Schema completo aplicado com sucesso!' as final_status;


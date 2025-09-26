
-- Versão do Schema: 1.5
-- Data de Atualização: 2024-07-26
-- Descrição: Correção crítica na tabela de perfis, removendo FK conflitante e garantindo PK para o trigger. Adiciona trigger para sincronização bidirecional.

-- ==== EXTENSÕES E CONFIGURAÇÕES GLOBAIS ====

-- Habilita a extensão para geração de UUIDs, se ainda não estiver habilitada.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- ==== DEFINIÇÕES DE TIPOS (ENUMS) ====

-- Define o tipo de conta para a tabela de perfis
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_type') THEN
        CREATE TYPE public.account_type AS ENUM ('pessoa', 'empresa');
    END IF;
END$$;

-- Define o tipo de transação
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
        CREATE TYPE public.transaction_type AS ENUM ('income', 'expense');
    END IF;
END$$;

-- Define o status da meta financeira
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'goal_status') THEN
        CREATE TYPE public.goal_status AS ENUM ('in_progress', 'achieved', 'cancelled');
    END IF;
END$$;


-- ==== CRIAÇÃO DO SCHEMA PARA NEXT-AUTH ====

-- O Supabase Adapter para NextAuth.js requer um schema específico.
CREATE SCHEMA IF NOT EXISTS next_auth;

-- ==== TABELAS DO NEXT-AUTH ====
-- Tabelas necessárias para o funcionamento do SupabaseAdapter do NextAuth.js.

CREATE TABLE IF NOT EXISTS next_auth.users (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    name text,
    email text,
    "emailVerified" timestamp with time zone,
    image text,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_email_key UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS next_auth.accounts (
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
    "userId" uuid,
    CONSTRAINT accounts_pkey PRIMARY KEY (id),
    CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES next_auth.users(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "accounts_provider_providerAccountId_idx" ON next_auth.accounts(provider, "providerAccountId");


CREATE TABLE IF NOT EXISTS next_auth.sessions (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    expires timestamp with time zone NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" uuid,
    CONSTRAINT sessions_pkey PRIMARY KEY (id),
    CONSTRAINT "sessions_sessionToken_key" UNIQUE ("sessionToken"),
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES next_auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS next_auth.verification_tokens (
    identifier text,
    token text,
    expires timestamp with time zone NOT NULL,
    CONSTRAINT "verification_tokens_token_key" UNIQUE (token),
    CONSTRAINT verification_tokens_pkey PRIMARY KEY (identifier, token)
);

-- ==== TABELAS DA APLICAÇÃO (SCHEMA PUBLIC) ====

-- Tabela para armazenar detalhes adicionais do perfil do usuário
-- **CORREÇÃO CRÍTICA**: Adicionado `PRIMARY KEY (id)` e removido `FOREIGN KEY (id)` que causava conflito.
DROP TABLE IF EXISTS public.profiles CASCADE; -- Remove a tabela antiga e suas dependências para garantir uma recriação limpa
CREATE TABLE public.profiles (
    id uuid NOT NULL, -- Este ID será o mesmo do `next_auth.users.id`
    full_name text,
    display_name text,
    email text NOT NULL,
    hashed_password text,
    phone text,
    cpf_cnpj text,
    rg text,
    avatar_url text,
    account_type public.account_type,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT profiles_pkey PRIMARY KEY (id), -- Garante a unicidade para o ON CONFLICT
    CONSTRAINT profiles_email_key UNIQUE (email),
    CONSTRAINT profiles_cpf_cnpj_key UNIQUE (cpf_cnpj)
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;


-- Outras tabelas da aplicação...
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    type public.transaction_type NOT NULL,
    icon text,
    is_default boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    description text NOT NULL,
    amount numeric(12, 2) NOT NULL,
    date date NOT NULL,
    type public.transaction_type NOT NULL,
    notes text,
    is_recurring boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.budgets (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    limit_amount numeric(12, 2) NOT NULL,
    spent_amount numeric(12, 2) NOT NULL DEFAULT 0,
    period_start_date date NOT NULL,
    period_end_date date NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id),
    UNIQUE (user_id, category_id, period_start_date)
);
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;


CREATE TABLE IF NOT EXISTS public.financial_goals (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    target_amount numeric(12, 2) NOT NULL,
    current_amount numeric(12, 2) NOT NULL DEFAULT 0,
    deadline_date date,
    icon text,
    notes text,
    status public.goal_status NOT NULL DEFAULT 'in_progress',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.todos (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    description text NOT NULL,
    is_completed boolean NOT NULL DEFAULT false,
    due_date date,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;


-- ==== TRIGGERS E FUNÇÕES ====

-- Atualiza o campo 'updated_at' automaticamente em qualquer tabela que o possua.
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = now();
  return new;
END;
$$ LANGUAGE plpgsql;

-- Aplica o trigger 'handle_updated_at' a todas as tabelas relevantes.
DO $$
DECLARE
    t_name TEXT;
BEGIN
    FOR t_name IN
        SELECT table_name FROM information_schema.columns WHERE table_schema = 'public' AND column_name = 'updated_at'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS on_%1$s_updated ON public.%1$I; CREATE TRIGGER on_%1$s_updated BEFORE UPDATE ON public.%1$I FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();', t_name);
    END LOOP;
END;
$$;


-- **FUNÇÃO CORRIGIDA**
-- Trigger para criar um perfil em `public.profiles` quando um novo usuário é criado em `next_auth.users` (ex: via OAuth).
DROP FUNCTION IF EXISTS public.handle_new_user_from_next_auth();
CREATE OR REPLACE FUNCTION public.handle_new_user_from_next_auth()
RETURNS trigger AS $$
BEGIN
  -- A cláusula ON CONFLICT agora funciona porque public.profiles.id é uma PRIMARY KEY.
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (new.id, new.name, new.email, new.image)
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(new.name, EXCLUDED.full_name),
    email = COALESCE(new.email, EXCLUDED.email),
    avatar_url = COALESCE(new.image, EXCLUDED.avatar_url);
  return new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Associa o trigger à tabela de usuários do NextAuth
DROP TRIGGER IF EXISTS on_next_auth_user_created ON next_auth.users;
CREATE TRIGGER on_next_auth_user_created
  AFTER INSERT ON next_auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_from_next_auth();

-- **NOVA FUNÇÃO**
-- Trigger para sincronizar atualizações de `public.profiles` de volta para `next_auth.users`
CREATE OR REPLACE FUNCTION public.handle_profile_update_to_next_auth_user()
RETURNS trigger AS $$
BEGIN
  UPDATE next_auth.users
  SET
    name = new.display_name,
    email = new.email,
    image = new.avatar_url
  WHERE id = new.id;
  return new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Associa o novo trigger à tabela de perfis
DROP TRIGGER IF EXISTS on_public_profile_updated ON public.profiles;
CREATE TRIGGER on_public_profile_updated
  AFTER UPDATE OF display_name, email, avatar_url ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_profile_update_to_next_auth_user();


-- ==== POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY) ====

-- --- Tabela: profiles ---
-- Permite que usuários leiam seu próprio perfil.
DROP POLICY IF EXISTS "Allow users to read their own profile" ON public.profiles;
CREATE POLICY "Allow users to read their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Permite que usuários atualizem seu próprio perfil.
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
CREATE POLICY "Allow users to update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Permite que a action de signup (usando anon key) insira um novo perfil.
-- A verificação de email duplicado é feita na server action antes da inserção.
DROP POLICY IF EXISTS "Allow anon to insert their own profile on signup" ON public.profiles;
CREATE POLICY "Allow anon to insert their own profile on signup"
  ON public.profiles FOR INSERT
  TO anon
  WITH CHECK (true);


-- --- Tabela: categories ---
DROP POLICY IF EXISTS "Allow users to manage their own categories" ON public.categories;
CREATE POLICY "Allow users to manage their own categories"
  ON public.categories FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
-- Permite que usuários autenticados leiam categorias padrão.
DROP POLICY IF EXISTS "Allow authenticated users to read default categories" ON public.categories;
CREATE POLICY "Allow authenticated users to read default categories"
  ON public.categories FOR SELECT
  TO authenticated
  USING (is_default = true);


-- --- Tabela: transactions ---
DROP POLICY IF EXISTS "Allow users to manage their own transactions" ON public.transactions;
CREATE POLICY "Allow users to manage their own transactions"
  ON public.transactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- --- Tabela: budgets ---
DROP POLICY IF EXISTS "Allow users to manage their own budgets" ON public.budgets;
CREATE POLICY "Allow users to manage their own budgets"
  ON public.budgets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- --- Tabela: financial_goals ---
DROP POLICY IF EXISTS "Allow users to manage their own financial goals" ON public.financial_goals;
CREATE POLICY "Allow users to manage their own financial goals"
  ON public.financial_goals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
  
-- --- Tabela: todos ---
DROP POLICY IF EXISTS "Allow users to manage their own todos" ON public.todos;
CREATE POLICY "Allow users to manage their own todos"
  ON public.todos FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ==== DADOS INICIAIS (CATEGORIAS PADRÃO) ====

INSERT INTO public.categories (user_id, name, type, icon, is_default) VALUES
  (NULL, 'Salário', 'income', 'DollarSign', TRUE),
  (NULL, 'Renda Extra', 'income', 'TrendingUp', TRUE),
  (NULL, 'Investimentos', 'income', 'PiggyBank', TRUE),
  (NULL, 'Moradia', 'expense', 'Home', TRUE),
  (NULL, 'Alimentação', 'expense', 'UtensilsCrossed', TRUE),
  (NULL, 'Transporte', 'expense', 'Car', TRUE),
  (NULL, 'Saúde', 'expense', 'HeartPulse', TRUE),
  (NULL, 'Lazer', 'expense', 'Ticket', TRUE),
  (NULL, 'Educação', 'expense', 'BookOpen', TRUE),
  (NULL, 'Compras', 'expense', 'ShoppingBag', TRUE),
  (NULL, 'Serviços', 'expense', 'Wrench', TRUE),
  (NULL, 'Impostos', 'expense', 'Landmark', TRUE),
  (NULL, 'Outros', 'expense', 'MoreHorizontal', TRUE)
ON CONFLICT (name, user_id) WHERE user_id IS NULL DO NOTHING;

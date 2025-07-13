
-- Habilita a extensão para gerar UUIDs se ainda não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

------------------------------------------------------------
-- Schema para NextAuth.js (Auth.js v5)
------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS next_auth;

-- Tabela de Usuários do NextAuth
CREATE TABLE IF NOT EXISTS next_auth.users (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name text,
  email text,
  "emailVerified" timestamp with time zone,
  image text,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT email_unique UNIQUE (email)
);

-- Tabela de Contas OAuth do NextAuth
CREATE TABLE IF NOT EXISTS next_auth.accounts (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "userId" uuid NOT NULL,
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
  CONSTRAINT accounts_pkey PRIMARY KEY (id),
  CONSTRAINT provider_unique UNIQUE (provider, "providerAccountId"),
  CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES next_auth.users(id) ON DELETE CASCADE
);

-- Tabela de Sessões do NextAuth
CREATE TABLE IF NOT EXISTS next_auth.sessions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "sessionToken" text NOT NULL,
  "userId" uuid NOT NULL,
  expires timestamp with time zone NOT NULL,
  CONSTRAINT sessions_pkey PRIMARY KEY (id),
  CONSTRAINT "sessionToken_unique" UNIQUE ("sessionToken"),
  CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES next_auth.users(id) ON DELETE CASCADE
);

-- Tabela de Tokens de Verificação do NextAuth
CREATE TABLE IF NOT EXISTS next_auth.verification_tokens (
  identifier text,
  token text,
  expires timestamp with time zone NOT NULL,
  CONSTRAINT verification_tokens_pkey PRIMARY KEY (token),
  CONSTRAINT token_unique UNIQUE (token),
  CONSTRAINT identifier_token_unique UNIQUE (identifier, token)
);

------------------------------------------------------------
-- Schema Público (Tabelas da Aplicação)
------------------------------------------------------------

-- Tipos ENUM para a aplicação
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_type') THEN
        CREATE TYPE public.account_type AS ENUM ('pessoa', 'empresa');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
        CREATE TYPE public.transaction_type AS ENUM ('income', 'expense');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'goal_status') THEN
        CREATE TYPE public.goal_status AS ENUM ('in_progress', 'achieved', 'cancelled');
    END IF;
END$$;


-- Tabela de Perfis de Usuários (nossa tabela principal de usuários)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL,
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
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_email_key UNIQUE (email),
    CONSTRAINT profiles_cpf_cnpj_key UNIQUE (cpf_cnpj)
);
COMMENT ON TABLE public.profiles IS 'Stores user profile information, separate from auth system tables.';

-- Tabela de Categorias
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid,
    name character varying(255) NOT NULL,
    type public.transaction_type NOT NULL,
    icon character varying(50),
    is_default boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT categories_pkey PRIMARY KEY (id),
    CONSTRAINT categories_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.categories IS 'Stores default and user-created categories for transactions.';

-- Tabela de Transações
CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL,
    category_id uuid,
    description text NOT NULL,
    amount numeric(12, 2) NOT NULL,
    date date NOT NULL,
    type public.transaction_type NOT NULL,
    notes text,
    is_recurring boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT transactions_pkey PRIMARY KEY (id),
    CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT transactions_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.transactions IS 'Stores all financial transactions for users.';

-- Tabela de Orçamentos
CREATE TABLE IF NOT EXISTS public.budgets (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL,
    category_id uuid NOT NULL,
    limit_amount numeric(12, 2) NOT NULL,
    spent_amount numeric(12, 2) NOT NULL DEFAULT 0,
    period_start_date date NOT NULL,
    period_end_date date NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT budgets_pkey PRIMARY KEY (id),
    CONSTRAINT budgets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT budgets_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.budgets IS 'Stores user-defined budgets for specific categories and periods.';

-- Tabela de Metas Financeiras
CREATE TABLE IF NOT EXISTS public.financial_goals (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    target_amount numeric(12, 2) NOT NULL,
    current_amount numeric(12, 2) NOT NULL DEFAULT 0,
    deadline_date date,
    icon character varying(50),
    notes text,
    status public.goal_status NOT NULL DEFAULT 'in_progress',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT financial_goals_pkey PRIMARY KEY (id),
    CONSTRAINT financial_goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.financial_goals IS 'Stores user financial goals and tracks their progress.';

-- Tabela de Lista de Tarefas (Todos)
CREATE TABLE IF NOT EXISTS public.todos (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL,
    description text NOT NULL,
    is_completed boolean NOT NULL DEFAULT false,
    due_date date,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT todos_pkey PRIMARY KEY (id),
    CONSTRAINT todos_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.todos IS 'Simple todo list for users.';

------------------------------------------------------------
-- Triggers e Funções
------------------------------------------------------------

-- Função para sincronizar perfis com auth.users do Supabase
-- REMOVIDA: A nova função `on_public_profile_created` assume esta responsabilidade.
DROP FUNCTION IF EXISTS public.handle_new_user_from_next_auth();

-- Função para atualizar o campo `updated_at` automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger de `updated_at` em todas as tabelas
DROP TRIGGER IF EXISTS on_update_set_updated_at ON public.profiles;
CREATE TRIGGER on_update_set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
DROP TRIGGER IF EXISTS on_update_set_updated_at ON public.categories;
CREATE TRIGGER on_update_set_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
DROP TRIGGER IF EXISTS on_update_set_updated_at ON public.transactions;
CREATE TRIGGER on_update_set_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
DROP TRIGGER IF EXISTS on_update_set_updated_at ON public.budgets;
CREATE TRIGGER on_update_set_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
DROP TRIGGER IF EXISTS on_update_set_updated_at ON public.financial_goals;
CREATE TRIGGER on_update_set_updated_at BEFORE UPDATE ON public.financial_goals FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
DROP TRIGGER IF EXISTS on_update_set_updated_at ON public.todos;
CREATE TRIGGER on_update_set_updated_at BEFORE UPDATE ON public.todos FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- **NOVA FUNÇÃO E TRIGGER:** Sincroniza `public.profiles` -> `auth.users`
-- Este trigger é acionado quando um novo perfil é inserido na nossa tabela `public.profiles`.
-- Ele então cria uma entrada correspondente em `auth.users` do Supabase.
CREATE OR REPLACE FUNCTION public.on_public_profile_created()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO auth.users (id, email, raw_user_meta_data, role)
    VALUES (
        NEW.id,
        NEW.email,
        jsonb_build_object(
            'provider', 'email',
            'providers', jsonb_build_array('email')
        ),
        'authenticated'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
COMMENT ON FUNCTION public.on_public_profile_created IS 'When a profile is created in public.profiles, create a corresponding user in auth.users.';

DROP TRIGGER IF EXISTS on_profile_created_sync_auth_user ON public.profiles;
CREATE TRIGGER on_profile_created_sync_auth_user
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.on_public_profile_created();

-- Função e trigger para manter a sincronia entre next_auth.users e public.profiles para logins OAuth
CREATE OR REPLACE FUNCTION public.sync_profile_from_next_auth()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, display_name, avatar_url)
    VALUES (NEW.id, NEW.email, NEW.name, NEW.name, NEW.image)
    ON CONFLICT (id) DO UPDATE SET
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        display_name = COALESCE(EXCLUDED.display_name, public.profiles.display_name),
        email = COALESCE(EXCLUDED.email, public.profiles.email),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
        updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_next_auth_user_created_sync_profile ON next_auth.users;
CREATE TRIGGER on_next_auth_user_created_sync_profile
    AFTER INSERT ON next_auth.users
    FOR EACH ROW EXECUTE FUNCTION public.sync_profile_from_next_auth();

------------------------------------------------------------
-- Policies de Segurança (RLS)
------------------------------------------------------------
-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Policies para `profiles`
DROP POLICY IF EXISTS "Allow individual user to read their own profile" ON public.profiles;
CREATE POLICY "Allow individual user to read their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow individual user to update their own profile" ON public.profiles;
CREATE POLICY "Allow individual user to update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow anon to insert their own profile on signup" ON public.profiles;
CREATE POLICY "Allow anon to insert their own profile on signup" ON public.profiles FOR INSERT TO anon WITH CHECK (true);

-- **NOVA POLICY**: Permite a verificação de e-mail duplicado durante o cadastro anônimo
DROP POLICY IF EXISTS "Allow anon to read email for signup check" ON public.profiles;
CREATE POLICY "Allow anon to read email for signup check" ON public.profiles FOR SELECT TO anon USING (true);


-- Policies para `categories`
DROP POLICY IF EXISTS "Allow individual user to manage their own categories" ON public.categories;
CREATE POLICY "Allow individual user to manage their own categories" ON public.categories FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow public read access to default categories" ON public.categories;
CREATE POLICY "Allow public read access to default categories" ON public.categories FOR SELECT USING (is_default = true);


-- Policies para `transactions`, `budgets`, `financial_goals`, `todos`
DROP POLICY IF EXISTS "Allow full access for own records" ON public.transactions;
CREATE POLICY "Allow full access for own records" ON public.transactions FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow full access for own records" ON public.budgets;
CREATE POLICY "Allow full access for own records" ON public.budgets FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow full access for own records" ON public.financial_goals;
CREATE POLICY "Allow full access for own records" ON public.financial_goals FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow full access for own records" ON public.todos;
CREATE POLICY "Allow full access for own records" ON public.todos FOR ALL USING (auth.uid() = user_id);

-- Inserir Categorias Padrão
INSERT INTO public.categories (name, type, icon, is_default) VALUES
('Salário', 'income', 'DollarSign', true),
('Investimentos', 'income', 'TrendingUp', true),
('Freelance', 'income', 'Briefcase', true),
('Outras Receitas', 'income', 'PlusCircle', true),
('Moradia', 'expense', 'Home', true),
('Alimentação', 'expense', 'Utensils', true),
('Transporte', 'expense', 'Car', true),
('Saúde', 'expense', 'HeartPulse', true),
('Lazer', 'expense', 'Gamepad2', true),
('Educação', 'expense', 'BookOpen', true),
('Vestuário', 'expense', 'Shirt', true),
('Contas e Utilidades', 'expense', 'Receipt', true),
('Impostos', 'expense', 'Landmark', true),
('Outras Despesas', 'expense', 'MinusCircle', true)
ON CONFLICT (name, type, is_default) DO NOTHING;

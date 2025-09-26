
-- ### Gerenciador de Extensões ###
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- #################################################################
-- ### DEFINIÇÃO DO SCHEMA PARA O NEXT-AUTH (SupabaseAdapter)
-- #################################################################
CREATE SCHEMA IF NOT EXISTS next_auth;

-- Tabela de Usuários do NextAuth
CREATE TABLE IF NOT EXISTS next_auth.users (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    name text,
    email text,
    "emailVerified" timestamp with time zone,
    image text,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_email_key UNIQUE (email)
);

-- Tabela de Contas OAuth do NextAuth
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
    CONSTRAINT "accounts_provider_providerAccountId_key" UNIQUE (provider, "providerAccountId"),
    CONSTRAINT accounts_userId_fkey FOREIGN KEY ("userId") REFERENCES next_auth.users(id) ON DELETE CASCADE
);

-- Tabela de Sessões do NextAuth
CREATE TABLE IF NOT EXISTS next_auth.sessions (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    expires timestamp with time zone NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" uuid,
    CONSTRAINT sessions_pkey PRIMARY KEY (id),
    CONSTRAINT sessions_sessionToken_key UNIQUE ("sessionToken"),
    CONSTRAINT sessions_userId_fkey FOREIGN KEY ("userId") REFERENCES next_auth.users(id) ON DELETE CASCADE
);

-- Tabela de Tokens de Verificação do NextAuth
CREATE TABLE IF NOT EXISTS next_auth.verification_tokens (
    token text,
    identifier text,
    expires timestamp with time zone NOT NULL,
    CONSTRAINT "verification_tokens_token_identifier_key" UNIQUE (token, identifier)
);

-- #################################################################
-- ### DEFINIÇÃO DAS TABELAS PÚBLICAS DA APLICAÇÃO (FLORTUNE)
-- #################################################################

-- Tabela de Perfis de Usuário (Fonte da Verdade para a aplicação)
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
    account_type text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_email_key UNIQUE (email),
    CONSTRAINT profiles_cpf_cnpj_key UNIQUE (cpf_cnpj),
    -- A FK para `auth.users` não é mais necessária aqui; a ligação é feita pelo `id`.
    -- A FK para `next_auth.users` também é removida para evitar dependências cruzadas complexas.
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.profiles IS 'Stores all user profile information, including credentials for local login.';

-- Habilitar Row Level Security (RLS) para a tabela de perfis
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Limpar políticas antigas para garantir um estado limpo
DROP POLICY IF EXISTS "Allow authenticated user to read/update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow anon to insert their own profile on signup" ON public.profiles;

-- Política de INSERT para a Server Action de signup (que usa a chave anônima)
CREATE POLICY "Allow anon to insert their own profile on signup"
  ON public.profiles FOR INSERT
  TO anon
  WITH CHECK (true);
  
-- Política de SELECT/UPDATE para o usuário dono do perfil
CREATE POLICY "Allow authenticated user to read/update their own profile"
  ON public.profiles FOR ALL
  TO authenticated
  USING (auth.uid() = id);

-- Trigger para manter a data de atualização
CREATE OR REPLACE TRIGGER on_profile_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- Tabela de Categorias
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid,
    name text NOT NULL,
    type text NOT NULL,
    icon text,
    is_default boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT categories_pkey PRIMARY KEY (id),
    CONSTRAINT categories_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow user to manage their own categories and see defaults" ON public.categories;
CREATE POLICY "Allow user to manage their own categories and see defaults"
  ON public.categories FOR ALL
  TO authenticated
  USING (auth.uid() = user_id OR is_default = true);

-- Tabela de Transações
CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL,
    category_id uuid,
    description text NOT NULL,
    amount numeric(12, 2) NOT NULL,
    date date NOT NULL,
    type text NOT NULL,
    notes text,
    is_recurring boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT transactions_pkey PRIMARY KEY (id),
    CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT transactions_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow user to manage their own transactions" ON public.transactions;
CREATE POLICY "Allow user to manage their own transactions"
  ON public.transactions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

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
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow user to manage their own budgets" ON public.budgets;
CREATE POLICY "Allow user to manage their own budgets"
  ON public.budgets FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Tabela de Metas Financeiras
CREATE TABLE IF NOT EXISTS public.financial_goals (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL,
    name text NOT NULL,
    target_amount numeric(12, 2) NOT NULL,
    current_amount numeric(12, 2) NOT NULL DEFAULT 0,
    deadline_date date,
    icon text,
    notes text,
    status text NOT NULL DEFAULT 'in_progress'::text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT financial_goals_pkey PRIMARY KEY (id),
    CONSTRAINT financial_goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow user to manage their own financial goals" ON public.financial_goals;
CREATE POLICY "Allow user to manage their own financial goals"
  ON public.financial_goals FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

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
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow user to manage their own todos" ON public.todos;
CREATE POLICY "Allow user to manage their own todos"
  ON public.todos FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);
  

-- #################################################################
-- ### TRIGGERS E FUNÇÕES AUTOMÁTICAS
-- #################################################################

-- ATENÇÃO: O trigger `handle_new_user_from_next_auth` FOI REMOVIDO.
-- A sincronização de perfis para usuários OAuth agora é tratada
-- na lógica do callback `jwt` do `NextAuth.js` em `/api/auth/[...nextauth]/route.ts`.
-- Isso evita conflitos e condições de corrida entre o adapter e o banco.

-- Limpa o trigger e a função antigos se existirem, para evitar conflitos.
DROP TRIGGER IF EXISTS on_next_auth_user_created ON next_auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_from_next_auth();

-- Novo Trigger: Sincroniza atualizações do perfil público para a tabela `next_auth.users`
-- Isso mantém o `name` e `image` do NextAuth atualizados se o usuário mudar no perfil.
CREATE OR REPLACE FUNCTION public.handle_profile_update_to_next_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE next_auth.users
  SET
    name = NEW.display_name,
    image = NEW.avatar_url,
    email = NEW.email
  WHERE
    id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_public_profile_update ON public.profiles;
CREATE TRIGGER on_public_profile_update
  AFTER UPDATE OF display_name, avatar_url, email ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profile_update_to_next_auth_user();


-- Função para atualizar `spent_amount` em `budgets`
CREATE OR REPLACE FUNCTION public.update_budget_spent_amount()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Se uma nova transação for inserida ou uma existente for atualizada
  IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.amount <> OLD.amount)) AND NEW.type = 'expense' THEN
    UPDATE budgets
    SET spent_amount = spent_amount + (CASE WHEN TG_OP = 'INSERT' THEN NEW.amount ELSE NEW.amount - OLD.amount END)
    WHERE user_id = NEW.user_id
      AND category_id = NEW.category_id
      AND NEW.date >= period_start_date AND NEW.date <= period_end_date;
  -- Se uma transação for deletada
  ELSIF (TG_OP = 'DELETE' AND OLD.type = 'expense') THEN
    UPDATE budgets
    SET spent_amount = spent_amount - OLD.amount
    WHERE user_id = OLD.user_id
      AND category_id = OLD.category_id
      AND OLD.date >= period_start_date AND OLD.date <= period_end_date;
  END IF;
  
  RETURN NULL; -- O resultado é ignorado para triggers AFTER
END;
$$;

DROP TRIGGER IF EXISTS on_transaction_change ON public.transactions;
CREATE TRIGGER on_transaction_change
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_budget_spent_amount();


-- #################################################################
-- ### DADOS INICIAIS (CATEGORIAS PADRÃO)
-- #################################################################

INSERT INTO public.categories (name, type, icon, is_default) VALUES
('Moradia', 'expense', 'Home', true),
('Alimentação', 'expense', 'Utensils', true),
('Transporte', 'expense', 'Car', true),
('Lazer', 'expense', 'GlassWater', true),
('Saúde', 'expense', 'HeartPulse', true),
('Educação', 'expense', 'GraduationCap', true),
('Vestuário', 'expense', 'Shirt', true),
('Dívidas', 'expense', 'Landmark', true),
('Impostos', 'expense', 'Percent', true),
('Investimentos', 'expense', 'TrendingUp', true),
('Outras Despesas', 'expense', 'MoreHorizontal', true),
('Salário', 'income', 'DollarSign', true),
('Freelance', 'income', 'Briefcase', true),
('Rendimentos', 'income', 'PiggyBank', true),
('Presentes', 'income', 'Gift', true),
('Outras Receitas', 'income', 'MoreHorizontal', true)
ON CONFLICT (name, type, is_default) DO NOTHING;

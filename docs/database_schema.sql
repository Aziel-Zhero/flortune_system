-- ### ESQUEMA NEXT-AUTH ###
-- Este esquema é necessário para o @auth/supabase-adapter

-- Criar o schema se não existir
CREATE SCHEMA IF NOT EXISTS next_auth;

-- Tabela de Usuários do NextAuth
CREATE TABLE IF NOT EXISTS next_auth.users (
  id uuid NOT NULL,
  name text NULL,
  email text NULL,
  "emailVerified" timestamptz NULL,
  image text NULL,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_email_key UNIQUE (email)
);

-- Tabela de Contas do NextAuth
CREATE TABLE IF NOT EXISTS next_auth.accounts (
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
  CONSTRAINT "accounts_provider_providerAccountId_key" UNIQUE (provider, "providerAccountId"),
  CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES next_auth.users(id) ON DELETE CASCADE
);

-- Tabela de Sessões do NextAuth
CREATE TABLE IF NOT EXISTS next_auth.sessions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "sessionToken" text NOT NULL,
  "userId" uuid NOT NULL,
  expires timestamptz NOT NULL,
  CONSTRAINT sessions_pkey PRIMARY KEY (id),
  CONSTRAINT "sessions_sessionToken_key" UNIQUE ("sessionToken"),
  CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES next_auth.users(id) ON DELETE CASCADE
);

-- Tabela de Verificação de Tokens do NextAuth
CREATE TABLE IF NOT EXISTS next_auth.verification_tokens (
  identifier text NOT NULL,
  token text NOT NULL,
  expires timestamptz NOT NULL,
  CONSTRAINT verification_tokens_pkey PRIMARY KEY (identifier, token)
);


-- ### ESQUEMA DA APLICAÇÃO (PUBLIC) ###

-- Tabela de Perfis de Usuários
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL,
    full_name text,
    display_name text,
    email text UNIQUE NOT NULL,
    avatar_url text,
    account_type text, -- 'pessoa' ou 'empresa'
    cpf_cnpj text UNIQUE,
    rg text,
    phone text,
    plan_id text DEFAULT 'tier-cultivador',
    has_seen_welcome_message boolean DEFAULT false,
    role text DEFAULT 'user'::text NOT NULL, -- Adicionada coluna de role
    hashed_password text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);
COMMENT ON COLUMN public.profiles.role IS 'Define o nível de acesso do usuário (ex: user, admin)';


-- Tabela de Categorias
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    type text NOT NULL, -- 'income' ou 'expense'
    icon text,
    is_default boolean DEFAULT false,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(user_id, name, type)
);

-- Tabela de Transações
CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    description text NOT NULL,
    amount real NOT NULL,
    date date NOT NULL,
    type text NOT NULL, -- 'income' ou 'expense'
    notes text,
    is_recurring boolean DEFAULT false,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Tabela de Orçamentos
CREATE TABLE IF NOT EXISTS public.budgets (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    limit_amount real NOT NULL,
    spent_amount real DEFAULT 0 NOT NULL,
    period_start_date date NOT NULL,
    period_end_date date NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(user_id, category_id, period_start_date)
);

-- Tabela de Metas Financeiras
CREATE TABLE IF NOT EXISTS public.financial_goals (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    target_amount real NOT NULL,
    current_amount real DEFAULT 0 NOT NULL,
    deadline_date date,
    icon text,
    status text DEFAULT 'in_progress' NOT NULL, -- 'in_progress', 'achieved', 'cancelled'
    notes text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Tabela de Lista de Tarefas (Todos)
CREATE TABLE IF NOT EXISTS public.todos (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    description text NOT NULL,
    is_completed boolean DEFAULT false,
    due_date date,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Tabela para Integrações (Telegram)
CREATE TABLE IF NOT EXISTS public.telegram (
    id smallint PRIMARY KEY DEFAULT 1,
    bot_token text,
    chat_id text,
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT only_one_row CHECK (id = 1)
);


-- ### TRIGGERS E POLÍTICAS DE SEGURANÇA (RLS) ###

-- Função para sincronizar `profiles` com `auth.users`
CREATE OR REPLACE FUNCTION public.handle_new_user_from_next_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- Insere um novo perfil quando um novo usuário é adicionado em auth.users (via OAuth)
  -- A cláusula ON CONFLICT garante que se um perfil já foi criado (via signup manual), ele será atualizado.
  INSERT INTO public.profiles (id, email, full_name, display_name, avatar_url, account_type, has_seen_welcome_message, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'pessoa'),
    false, -- Define como false para novos usuários
    'user' -- Define a role padrão
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Trigger que chama a função acima quando um novo usuário é inserido em auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_from_next_auth();


-- Habilitar Row Level Security (RLS) para as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram ENABLE ROW LEVEL SECURITY;


-- Políticas de RLS para a tabela de Perfis
DROP POLICY IF EXISTS "Allow individual user access to their own profile" ON public.profiles;
CREATE POLICY "Allow individual user access to their own profile"
  ON public.profiles FOR ALL
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow anon to insert their own profile on signup" ON public.profiles;
CREATE POLICY "Allow anon to insert their own profile on signup"
  ON public.profiles FOR INSERT
  TO anon
  WITH CHECK (true);


-- Políticas de RLS para as outras tabelas
DROP POLICY IF EXISTS "Allow individual user access to their categories" ON public.categories;
CREATE POLICY "Allow individual user access to their categories" ON public.categories FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow individual user access to their transactions" ON public.transactions;
CREATE POLICY "Allow individual user access to their transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow individual user access to their budgets" ON public.budgets;
CREATE POLICY "Allow individual user access to their budgets" ON public.budgets FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow individual user access to their financial goals" ON public.financial_goals;
CREATE POLICY "Allow individual user access to their financial goals" ON public.financial_goals FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow individual user access to their todos" ON public.todos;
CREATE POLICY "Allow individual user access to their todos" ON public.todos FOR ALL USING (auth.uid() = user_id);

-- Política para a tabela telegram: apenas admins podem acessar
DROP POLICY IF EXISTS "Allow admins to access telegram integration" ON public.telegram;
CREATE POLICY "Allow admins to access telegram integration"
  ON public.telegram FOR ALL
  USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

-- Inserir categorias padrão se não existirem
INSERT INTO public.categories (name, type, icon, is_default) VALUES
  ('Salário', 'income', 'DollarSign', true),
  ('Freelance', 'income', 'Briefcase', true),
  ('Investimentos', 'income', 'TrendingUp', true),
  ('Outras Receitas', 'income', 'PlusCircle', true),
  ('Moradia', 'expense', 'Home', true),
  ('Alimentação', 'expense', 'Utensils', true),
  ('Transporte', 'expense', 'Car', true),
  ('Lazer', 'expense', 'GlassWater', true),
  ('Saúde', 'expense', 'HeartPulse', true),
  ('Educação', 'expense', 'BookOpen', true),
  ('Contas', 'expense', 'FileText', true),
  ('Compras', 'expense', 'ShoppingBag', true),
  ('Viagens', 'expense', 'Plane', true),
  ('Outras Despesas', 'expense', 'MinusCircle', true)
ON CONFLICT (user_id, name, type) DO NOTHING;

-- FLORTUNE - DATABASE SCHEMA
-- Versão: 2.1
-- Data: 26 de Julho de 2024
-- Descrição: Schema completo para o banco de dados do Flortune no Supabase.
-- Esta versão corrige o fluxo de autenticação, remove triggers conflitantes,
-- e desabilita a confirmação de email para uma experiência de usuário mais fluida.

-- ### INÍCIO DA CONFIGURAÇÃO ###

-- 1. Habilita a extensão uuid-ossp se ainda não estiver habilitada.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- 2. Habilita a extensão moddatetime para auto-atualizar timestamps.
CREATE EXTENSION IF NOT EXISTS "moddatetime" WITH SCHEMA extensions;


-- ### SCHEMA: next_auth (Gerenciado pelo SupabaseAdapter) ###
-- Este schema é necessário para o NextAuth.js SupabaseAdapter funcionar.

CREATE SCHEMA IF NOT EXISTS next_auth;

-- Tabela de Usuários do NextAuth
CREATE TABLE IF NOT EXISTS next_auth.users (
  id uuid NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name text,
  email text,
  "emailVerified" timestamp with time zone,
  image text
);

-- Tabela de Contas (OAuth)
CREATE TABLE IF NOT EXISTS next_auth.accounts (
  id uuid NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  "userId" uuid REFERENCES next_auth.users(id) ON DELETE CASCADE,
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
  CONSTRAINT "accounts_provider_providerAccountId_key" UNIQUE (provider, "providerAccountId")
);

-- Tabela de Sessões
CREATE TABLE IF NOT EXISTS next_auth.sessions (
  id uuid NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  "sessionToken" text NOT NULL UNIQUE,
  "userId" uuid REFERENCES next_auth.users(id) ON DELETE CASCADE,
  expires timestamp with time zone NOT NULL
);

-- Tabela de Tokens de Verificação
CREATE TABLE IF NOT EXISTS next_auth.verification_tokens (
  identifier text,
  token text NOT NULL,
  expires timestamp with time zone NOT NULL,
  CONSTRAINT "verification_tokens_token_key" UNIQUE (token),
  CONSTRAINT "verification_tokens_identifier_token_key" UNIQUE (identifier, token)
);

-- ### SCHEMA: public (Tabelas da Aplicação) ###

-- Tabela de Perfis dos Usuários
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY DEFAULT auth.uid(), -- Chave Primária e FK para auth.users.id
  full_name text,
  display_name text,
  email text NOT NULL UNIQUE,
  hashed_password text,
  phone text,
  cpf_cnpj text UNIQUE,
  rg text,
  avatar_url text,
  account_type text, -- 'pessoa' ou 'empresa'
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.profiles IS 'Armazena informações detalhadas do perfil dos usuários, complementando a tabela auth.users.';

-- Tabela de Categorias
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  icon text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.categories IS 'Categorias para transações, com categorias padrão e personalizadas.';

-- Tabela de Transações
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  description text NOT NULL,
  amount numeric(12, 2) NOT NULL,
  date date NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  notes text,
  is_recurring boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.transactions IS 'Registros de todas as movimentações financeiras do usuário.';

-- Tabela de Orçamentos
CREATE TABLE IF NOT EXISTS public.budgets (
  id uuid NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  limit_amount numeric(12, 2) NOT NULL,
  spent_amount numeric(12, 2) NOT NULL DEFAULT 0.00,
  period_start_date date NOT NULL,
  period_end_date date NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT budgets_user_category_period_unique UNIQUE (user_id, category_id, period_start_date, period_end_date)
);
COMMENT ON TABLE public.budgets IS 'Orçamentos definidos pelos usuários para categorias de despesas.';

-- Tabela de Metas Financeiras
CREATE TABLE IF NOT EXISTS public.financial_goals (
  id uuid NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  target_amount numeric(12, 2) NOT NULL,
  current_amount numeric(12, 2) NOT NULL DEFAULT 0.00,
  deadline_date date,
  icon text,
  notes text,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'achieved', 'cancelled')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.financial_goals IS 'Metas financeiras dos usuários, como economizar para uma viagem.';

-- Tabela de Lista de Tarefas (To-Dos)
CREATE TABLE IF NOT EXISTS public.todos (
  id uuid NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  description text NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  due_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.todos IS 'Lista de tarefas simples para os usuários.';

-- ### TRIGGERS ###

-- Trigger para auto-atualizar 'updated_at' em CADA tabela
CREATE OR REPLACE TRIGGER handle_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime (updated_at);

CREATE OR REPLACE TRIGGER handle_updated_at_categories
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime (updated_at);

CREATE OR REPLACE TRIGGER handle_updated_at_transactions
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime (updated_at);

CREATE OR REPLACE TRIGGER handle_updated_at_budgets
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime (updated_at);

CREATE OR REPLACE TRIGGER handle_updated_at_financial_goals
  BEFORE UPDATE ON public.financial_goals
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime (updated_at);

CREATE OR REPLACE TRIGGER handle_updated_at_todos
  BEFORE UPDATE ON public.todos
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime (updated_at);

-- Trigger para criar um perfil público quando um novo usuário se cadastra no Supabase Auth.
-- Este é o fluxo central para garantir que cada usuário tenha um perfil.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, display_name, avatar_url, account_type, cpf_cnpj, rg, phone)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'display_name',
    NEW.raw_user_meta_data ->> 'avatar_url',
    NEW.raw_user_meta_data ->> 'account_type',
    NEW.raw_user_meta_data ->> 'cpf_cnpj',
    NEW.raw_user_meta_data ->> 'rg',
    NEW.raw_user_meta_data ->> 'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Anexa o trigger à tabela auth.users.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ### POLÍTICAS DE ROW LEVEL SECURITY (RLS) ###

-- Habilita RLS para todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Limpa políticas antigas
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Allow all access for authenticated users" ON public.categories;
DROP POLICY IF EXISTS "Allow read access for default categories" ON public.categories;
DROP POLICY IF EXISTS "Users can manage their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can manage their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can manage their own financial goals" ON public.financial_goals;
DROP POLICY IF EXISTS "Users can manage their own todos" ON public.todos;


-- Novas políticas
CREATE POLICY "Users can manage their own profile." ON public.profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Allow authenticated users to manage their categories" ON public.categories
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to read default categories" ON public.categories
  FOR SELECT USING (is_default = true);
  
CREATE POLICY "Users can manage their own transactions" ON public.transactions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own budgets" ON public.budgets
  FOR ALL USING (auth.uid() = user_id);
  
CREATE POLICY "Users can manage their own financial goals" ON public.financial_goals
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own todos" ON public.todos
  FOR ALL USING (auth.uid() = user_id);


-- ### DADOS INICIAIS (Seed Data) ###

-- Cria um índice único para garantir que não haja categorias padrão duplicadas.
CREATE UNIQUE INDEX IF NOT EXISTS categories_default_name_unique
ON public.categories(name)
WHERE is_default = true;

-- Insere categorias padrão. A cláusula ON CONFLICT previne erros se o script for executado novamente.
INSERT INTO public.categories (name, type, icon, is_default) VALUES
  ('Salário', 'income', 'DollarSign', true),
  ('Rendimentos', 'income', 'TrendingUp', true),
  ('Vendas', 'income', 'ShoppingCart', true),
  ('Outras Receitas', 'income', 'PiggyBank', true),
  ('Moradia', 'expense', 'Home', true),
  ('Alimentação', 'expense', 'Utensils', true),
  ('Transporte', 'expense', 'Car', true),
  ('Lazer', 'expense', 'Gamepad2', true),
  ('Saúde', 'expense', 'HeartPulse', true),
  ('Educação', 'expense', 'GraduationCap', true),
  ('Vestuário', 'expense', 'Shirt', true),
  ('Impostos', 'expense', 'Landmark', true),
  ('Serviços', 'expense', 'Wrench', true),
  ('Outras Despesas', 'expense', 'Receipt', true)
ON CONFLICT (name) WHERE is_default = true DO NOTHING;


-- ### CONFIGURAÇÃO FINAL DE AUTENTICAÇÃO ###

-- Desabilita a confirmação de email para novos usuários.
-- Isso permite que o usuário faça login imediatamente após o cadastro,
-- simplificando a experiência do usuário.
UPDATE auth.settings
SET
  disable_signup = false,
  enable_confirmations = false;

-- ### FIM DO SCRIPT ###

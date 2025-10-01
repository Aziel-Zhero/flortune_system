
-- ### INÍCIO - Limpeza Completa do Ambiente ###
-- O Supabase não permite DROP SCHEMA next_auth, então limpamos as tabelas individualmente.
DROP TABLE IF EXISTS "next_auth"."users" CASCADE;
DROP TABLE IF EXISTS "next_auth"."accounts" CASCADE;
DROP TABLE IF EXISTS "next_auth"."sessions" CASCADE;
DROP TABLE IF EXISTS "next_auth"."verification_tokens" CASCADE;

-- Limpa as tabelas da aplicação em ordem de dependência para evitar erros.
DROP TABLE IF EXISTS "public"."todos" CASCADE;
DROP TABLE IF EXISTS "public"."financial_goals" CASCADE;
DROP TABLE IF EXISTS "public"."budgets" CASCADE;
DROP TABLE IF EXISTS "public"."transactions" CASCADE;
DROP TABLE IF EXISTS "public"."categories" CASCADE;
DROP TABLE IF EXISTS "public"."clients" CASCADE;
DROP TABLE IF EXISTS "public"."notes" CASCADE;
DROP TABLE IF EXISTS "public"."weather_logs" CASCADE;
DROP TABLE IF EXISTS "public"."api_cities" CASCADE;
DROP TABLE IF EXISTS "public"."quote_logs" CASCADE;
DROP TABLE IF EXISTS "public"."financial_assets" CASCADE;
DROP TABLE IF EXISTS "public"."profiles" CASCADE;

-- Limpa os ENUMs personalizados.
DROP TYPE IF EXISTS "public"."account_type_enum";
DROP TYPE IF EXISTS "public"."transaction_type_enum";
DROP TYPE IF EXISTS "public"."goal_status_enum";
DROP TYPE IF EXISTS "public"."client_status_enum";
DROP TYPE IF EXISTS "public"."client_priority_enum";
DROP TYPE IF EXISTS "public"."asset_type_enum";

-- Remove a extensão pgcrypto se não for mais necessária (o trigger moddatetime a usa).
-- DROP EXTENSION IF EXISTS "pgcrypto";
-- ### FIM - Limpeza Completa do Ambiente ###


-- ### ESTRUTURA --
-- Habilita a extensão para gerar UUIDs.
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- ### Trigger para auto-atualizar 'updated_at' ###
-- Esta função será usada em várias tabelas.
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ### Definição dos ENUMs ###
CREATE TYPE public.account_type_enum AS ENUM ('pessoa', 'empresa');
CREATE TYPE public.transaction_type_enum AS ENUM ('income', 'expense');
CREATE TYPE public.goal_status_enum AS ENUM ('in_progress', 'achieved', 'cancelled');
CREATE TYPE public.client_status_enum AS ENUM ('planning', 'in_progress', 'delivered', 'on_hold', 'delayed');
CREATE TYPE public.client_priority_enum AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.asset_type_enum AS ENUM ('currency', 'stock_index', 'commodity');


-- ### Criação das Tabelas do NextAuth.js ###
-- Este schema é gerenciado pelo SupabaseAdapter do NextAuth.js.
CREATE SCHEMA IF NOT EXISTS next_auth;

-- Tabela de Usuários do NextAuth
CREATE TABLE IF NOT EXISTS next_auth.users (
    id uuid NOT NULL PRIMARY KEY,
    name text,
    email text,
    "emailVerified" timestamp with time zone,
    image text
);

-- Tabela de Contas (OAuth)
CREATE TABLE IF NOT EXISTS next_auth.accounts (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    "userId" uuid NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
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
    CONSTRAINT accounts_provider_providerAccountId_key UNIQUE (provider, "providerAccountId")
);

-- Tabela de Sessões
CREATE TABLE IF NOT EXISTS next_auth.sessions (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    "sessionToken" text NOT NULL UNIQUE,
    "userId" uuid NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
    expires timestamp with time zone NOT NULL
);

-- Tabela de Tokens de Verificação (para login sem senha, se usado)
CREATE TABLE IF NOT EXISTS next_auth.verification_tokens (
    identifier text,
    token text NOT NULL UNIQUE,
    expires timestamp with time zone NOT NULL,
    CONSTRAINT verification_tokens_identifier_token_key UNIQUE (identifier, token)
);


-- ### Criação das Tabelas da Aplicação ###

-- 1. Tabela de Perfis de Usuário (`profiles`)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL PRIMARY KEY DEFAULT auth.uid(),
    full_name text,
    display_name text,
    email text NOT NULL UNIQUE,
    hashed_password text,
    phone text,
    avatar_url text,
    account_type public.account_type_enum,
    cpf_cnpj text UNIQUE,
    rg text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);
-- Trigger para 'updated_at' em 'profiles'
CREATE OR REPLACE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- 2. Tabela de Categorias (`categories`)
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    type public.transaction_type_enum NOT NULL,
    icon text,
    is_default boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT categories_user_id_name_type_key UNIQUE (user_id, name, type)
);
-- Índice único para categorias padrão
CREATE UNIQUE INDEX IF NOT EXISTS categories_default_name_type_unique_idx
ON public.categories(name, type)
WHERE is_default = true;
-- Trigger para 'updated_at' em 'categories'
CREATE OR REPLACE TRIGGER on_categories_updated
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- 3. Tabela de Transações (`transactions`)
CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    description text NOT NULL,
    amount numeric(12, 2) NOT NULL,
    date date NOT NULL,
    type public.transaction_type_enum NOT NULL,
    is_recurring boolean NOT NULL DEFAULT false,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
-- Trigger para 'updated_at' em 'transactions'
CREATE OR REPLACE TRIGGER on_transactions_updated
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- 4. Tabela de Orçamentos (`budgets`)
CREATE TABLE IF NOT EXISTS public.budgets (
    id uuid NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    limit_amount numeric(12, 2) NOT NULL,
    spent_amount numeric(12, 2) NOT NULL DEFAULT 0,
    period_start_date date NOT NULL,
    period_end_date date NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
-- Trigger para 'updated_at' em 'budgets'
CREATE OR REPLACE TRIGGER on_budgets_updated
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- 5. Tabela de Metas Financeiras (`financial_goals`)
CREATE TABLE IF NOT EXISTS public.financial_goals (
    id uuid NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    target_amount numeric(12, 2) NOT NULL,
    current_amount numeric(12, 2) NOT NULL DEFAULT 0,
    deadline_date date,
    icon text,
    status public.goal_status_enum NOT NULL DEFAULT 'in_progress',
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
-- Trigger para 'updated_at' em 'financial_goals'
CREATE OR REPLACE TRIGGER on_financial_goals_updated
  BEFORE UPDATE ON public.financial_goals
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- 6. Tabela de Tarefas (`todos`)
CREATE TABLE IF NOT EXISTS public.todos (
    id uuid NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    description text NOT NULL,
    is_completed boolean NOT NULL DEFAULT false,
    due_date date,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
-- Trigger para 'updated_at' em 'todos'
CREATE OR REPLACE TRIGGER on_todos_updated
  BEFORE UPDATE ON public.todos
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- 7. Tabela de Anotações (`notes`)
CREATE TABLE IF NOT EXISTS public.notes (
    id uuid NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    content text,
    color text NOT NULL,
    is_pinned boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
-- Trigger para 'updated_at' em 'notes'
CREATE OR REPLACE TRIGGER on_notes_updated
  BEFORE UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- 8. Tabela de Clientes/Projetos (DEV) (`clients`)
CREATE TABLE IF NOT EXISTS public.clients (
    id uuid NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    "serviceType" text,
    status public.client_status_enum NOT NULL DEFAULT 'planning',
    priority public.client_priority_enum NOT NULL DEFAULT 'medium',
    "startDate" date,
    deadline date,
    "totalPrice" numeric(12, 2),
    tasks text,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
-- Trigger para 'updated_at' em 'clients'
CREATE OR REPLACE TRIGGER on_clients_updated
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- 9. Tabela de Cidades da API de Clima (`api_cities`)
CREATE TABLE IF NOT EXISTS public.api_cities (
    id serial PRIMARY KEY,
    name varchar(100) NOT NULL,
    country varchar(10) NOT NULL,
    latitude decimal(9, 6),
    longitude decimal(9, 6),
    UNIQUE (name, country)
);

-- 10. Tabela de Logs de Clima (`weather_logs`)
CREATE TABLE IF NOT EXISTS public.weather_logs (
    id bigserial PRIMARY KEY,
    city_id integer NOT NULL REFERENCES public.api_cities(id) ON DELETE CASCADE,
    temperature decimal(5, 2),
    description varchar(255),
    icon_code varchar(10),
    humidity integer,
    wind_speed decimal(5, 2),
    recorded_at timestamptz NOT NULL DEFAULT now()
);

-- 11. Tabela de Ativos Financeiros (`financial_assets`)
CREATE TABLE IF NOT EXISTS public.financial_assets (
    id serial PRIMARY KEY,
    code varchar(20) NOT NULL UNIQUE,
    name varchar(100) NOT NULL,
    asset_type public.asset_type_enum NOT NULL
);

-- 12. Tabela de Logs de Cotações (`quote_logs`)
CREATE TABLE IF NOT EXISTS public.quote_logs (
    id bigserial PRIMARY KEY,
    asset_id integer NOT NULL REFERENCES public.financial_assets(id) ON DELETE CASCADE,
    bid_price decimal(18, 6),
    ask_price decimal(18, 6),
    pct_change decimal(10, 4),
    high_price decimal(18, 6),
    low_price decimal(18, 6),
    recorded_at timestamptz NOT NULL
);

-- ### DADOS INICIAIS (SEED DATA) ###
-- Garante que o índice único para categorias padrão exista.
CREATE UNIQUE INDEX IF NOT EXISTS categories_default_name_type_key ON public.categories (name, type) WHERE (is_default = true);

-- Insere categorias padrão, ignorando conflitos se já existirem.
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
ON CONFLICT (name, type) WHERE (is_default = true) DO NOTHING;


-- ### POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY - RLS) ###

-- Habilita RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
-- Tabelas de API podem ser públicas ou ter suas próprias regras, aqui deixamos públicas por padrão.
ALTER TABLE public.api_cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_logs ENABLE ROW L
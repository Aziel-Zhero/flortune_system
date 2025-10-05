-- FLORTUNE - DATABASE SCHEMA
-- Versão: 3.0
-- Descrição: Script completo para limpar e recriar o banco de dados Flortune
-- com nomenclatura em inglês, estrutura 3NF e sem triggers em tabelas `auth`.

-- Início do Bloco de Limpeza: Apaga a estrutura antiga se existir.
-- Usamos `CASCADE` para remover objetos dependentes (views, fks, etc.).
-- Usamos `IF EXISTS` para evitar erros caso o script seja executado em um banco limpo.
-- A ordem de `DROP` aqui é importante para evitar erros de dependência.

DO $$
BEGIN
   -- Drop policies before dropping tables
   DROP POLICY IF EXISTS "Users can manage their own profiles." ON public.profiles;
   DROP POLICY IF EXISTS "Allow service_role to insert new profiles" ON public.profiles;
   DROP POLICY IF EXISTS "Users can manage their own categories." ON public.categories;
   DROP POLICY IF EXISTS "Users can manage their own transactions." ON public.transactions;
   DROP POLICY IF EXISTS "Users can manage their own budgets." ON public.budgets;
   DROP POLICY IF EXISTS "Users can manage their own financial goals." ON public.financial_goals;
   DROP POLICY IF EXISTS "Users can manage their own todos." ON public.todos;
   DROP POLICY IF EXISTS "Users can manage their own notes." ON public.notes;
   DROP POLICY IF EXISTS "Users can manage their own dev_clients." ON public.dev_clients;
   DROP POLICY IF EXISTS "Users can manage their own weather logs." ON public.weather_logs;
   DROP POLICY IF EXISTS "Users can manage their own quote logs." ON public.quote_logs;
EXCEPTION
   WHEN undefined_table THEN
      -- Se a tabela não existe, a política também não, então ignoramos o erro.
      NULL; 
END $$;


-- Drop tables
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.budgets CASCADE;
DROP TABLE IF EXISTS public.financial_goals CASCADE;
DROP TABLE IF EXISTS public.todos CASCADE;
DROP TABLE IF EXISTS public.notes CASCADE;
DROP TABLE IF EXISTS public.dev_clients CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.weather_logs CASCADE;
DROP TABLE IF EXISTS public.api_cities CASCADE;
DROP TABLE IF EXISTS public.quote_logs CASCADE;
DROP TABLE IF EXISTS public.financial_assets CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop custom types if they exist
DROP TYPE IF EXISTS public.account_type_enum;
DROP TYPE IF EXISTS public.transaction_type_enum;
DROP TYPE IF F EXISTS public.goal_status_enum;
DROP TYPE IF EXISTS public.dev_client_status_enum;
DROP TYPE IF EXISTS public.dev_client_priority_enum;
DROP TYPE IF EXISTS public.asset_type_enum;

-- Fim do Bloco de Limpeza

-- Início da Criação da Nova Estrutura

-- 1. Tipos Enumerados (ENUMs)
-- Usar ENUMs é mais eficiente e seguro do que strings de texto.
CREATE TYPE public.account_type_enum AS ENUM ('pessoa', 'empresa');
CREATE TYPE public.transaction_type_enum AS ENUM ('income', 'expense');
CREATE TYPE public.goal_status_enum AS ENUM ('in_progress', 'achieved', 'cancelled');
CREATE TYPE public.dev_client_status_enum AS ENUM ('planning', 'in_progress', 'delivered', 'on_hold', 'delayed');
CREATE TYPE public.dev_client_priority_enum AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.asset_type_enum AS ENUM ('currency', 'stock_index', 'commodity');

-- 2. Tabela `profiles`
-- Armazena os dados de perfil de cada usuário, estendendo o `auth.users`.
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    display_name TEXT,
    email TEXT UNIQUE NOT NULL,
    hashed_password TEXT, -- Mantido para cadastro via email/senha.
    phone TEXT,
    avatar_url TEXT,
    account_type public.account_type_enum,
    cpf_cnpj TEXT UNIQUE,
    rg TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabela `categories`
-- Categorias para transações. Inclui categorias padrão e as criadas pelo usuário.
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type public.transaction_type_enum NOT NULL,
    icon TEXT,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT user_category_name_unique UNIQUE (user_id, name) -- Um usuário não pode ter categorias com o mesmo nome.
);

-- 4. Tabela `transactions`
-- O coração do app: todas as movimentações financeiras.
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    amount NUMERIC(18, 2) NOT NULL,
    date DATE NOT NULL,
    type public.transaction_type_enum NOT NULL,
    is_recurring BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Tabela `budgets`
-- Orçamentos mensais por categoria.
CREATE TABLE public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    limit_amount NUMERIC(18, 2) NOT NULL,
    spent_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT user_category_period_unique UNIQUE (user_id, category_id, period_start_date)
);


-- 6. Tabela `financial_goals`
-- Metas financeiras de longo prazo.
CREATE TABLE public.financial_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount NUMERIC(18, 2) NOT NULL,
    current_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
    deadline_date DATE,
    icon TEXT,
    status public.goal_status_enum NOT NULL DEFAULT 'in_progress',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Tabela `todos`
-- Lista de tarefas simples.
CREATE TABLE public.todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    due_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Tabela `notes`
-- Anotações do usuário.
CREATE TABLE public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    color TEXT,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Tabela `dev_clients`
-- Tabela para o módulo de gerenciamento de clientes/projetos para DEVs.
CREATE TABLE public.dev_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    service_type TEXT,
    status public.dev_client_status_enum NOT NULL DEFAULT 'planning',
    priority public.dev_client_priority_enum NOT NULL DEFAULT 'medium',
    start_date DATE,
    deadline DATE,
    total_price NUMERIC(18, 2),
    notes TEXT,
    tasks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Tabelas para APIs Externas (Estrutura Normalizada)

-- Tabela para armazenar cidades únicas da API de Clima
CREATE TABLE public.api_cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    country VARCHAR(5) NOT NULL,
    latitude DECIMAL(9, 6),
    longitude DECIMAL(9, 6),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (name, country)
);

-- Tabela de logs de clima
CREATE TABLE public.weather_logs (
    id SERIAL PRIMARY KEY,
    city_id INT NOT NULL REFERENCES public.api_cities(id) ON DELETE CASCADE,
    temperature DECIMAL(5, 2),
    description VARCHAR(255),
    icon_code VARCHAR(10),
    humidity INT,
    wind_speed DECIMAL(5, 2),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela para armazenar ativos financeiros únicos da API de Cotação
CREATE TABLE public.financial_assets (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    asset_type public.asset_type_enum NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de logs de cotações
CREATE TABLE public.quote_logs (
    id SERIAL PRIMARY KEY,
    asset_id INT NOT NULL REFERENCES public.financial_assets(id) ON DELETE CASCADE,
    bid_price DECIMAL(18, 6),
    ask_price DECIMAL(18, 6),
    pct_change DECIMAL(10, 4),
    high_price DECIMAL(18, 6),
    low_price DECIMAL(18, 6),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fim da Criação de Tabelas

-- Início da Inserção de Dados Padrão (Seed)

-- Cria um índice único para as categorias padrão para que o ON CONFLICT funcione.
-- Isso só se aplica onde 'is_default' é true.
CREATE UNIQUE INDEX IF NOT EXISTS unique_default_category_name ON public.categories (name) WHERE (is_default = true);

-- Inserir categorias padrão. `ON CONFLICT (name) DO NOTHING` evita duplicatas se o script rodar novamente.
INSERT INTO public.categories (name, type, icon, is_default) VALUES
  ('Salário', 'income', 'DollarSign', true),
  ('Freelance/Bicos', 'income', 'Briefcase', true),
  ('Investimentos', 'income', 'TrendingUp', true),
  ('Presentes', 'income', 'Gift', true),
  ('Outras Receitas', 'income', 'PlusCircle', true),
  ('Moradia', 'expense', 'Home', true),
  ('Alimentação', 'expense', 'Utensils', true),
  ('Transporte', 'expense', 'Car', true),
  ('Saúde', 'expense', 'HeartPulse', true),
  ('Lazer', 'expense', 'GlassWater', true),
  ('Educação', 'expense', 'GraduationCap', true),
  ('Vestuário', 'expense', 'Shirt', true),
  ('Contas e Serviços', 'expense', 'Receipt', true),
  ('Impostos', 'expense', 'Landmark', true),
  ('Outras Despesas', 'expense', 'MinusCircle', true)
ON CONFLICT (name) WHERE is_default = true DO NOTHING;


-- Fim da Inserção de Dados Padrão


-- Início da Configuração de Row Level Security (RLS)

-- Habilitar RLS em todas as tabelas que contêm dados do usuário.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_logs ENABLE ROW LEVEL SECURITY;


-- Políticas para `profiles`
CREATE POLICY "Users can manage their own profiles." ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- CORREÇÃO: Política que permite a criação de um perfil durante o signup.
-- A server action é executada como `anon` ou `service_role`.
-- Esta política é aberta para INSERT, mas a lógica de negócio na Server Action (verificação de email, etc.)
-- é a verdadeira barreira de segurança.
CREATE POLICY "Allow authenticated users to insert their own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Políticas para `categories`
CREATE POLICY "Users can manage their own categories." ON public.categories
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view default categories." ON public.categories
  FOR SELECT USING (is_default = true);

-- Políticas para `transactions`
CREATE POLICY "Users can manage their own transactions." ON public.transactions
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para `budgets`
CREATE POLICY "Users can manage their own budgets." ON public.budgets
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para `financial_goals`
CREATE POLICY "Users can manage their own financial goals." ON public.financial_goals
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para `todos`
CREATE POLICY "Users can manage their own todos." ON public.todos
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para `notes`
CREATE POLICY "Users can manage their own notes." ON public.notes
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para `dev_clients`
CREATE POLICY "Users can manage their own dev_clients." ON public.dev_clients
  FOR ALL USING (auth.uid() = user_id);
  
-- Políticas para tabelas de log (geralmente, apenas o serviço pode escrever nelas)
-- Aqui, vamos permitir que usuários leiam logs associados aos seus dados se necessário no futuro.
-- (Nenhuma política de escrita para usuários é criada por padrão).
-- Esta parte pode ser ajustada conforme a necessidade. Por enquanto, sem políticas explícitas
-- para logs, o que significa que o acesso é negado por padrão.


-- Fim da Configuração de RLS
-- Fim do Script

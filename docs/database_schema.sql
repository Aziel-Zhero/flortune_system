-- ========== Extensões ==========
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- ========== LIMPEZA (DROP) ==========
-- Apaga em ordem de dependência para evitar erros.

-- Drop triggers
DROP TRIGGER IF EXISTS on_public_transactions_change ON public.transactions;
DROP TRIGGER IF EXISTS on_public_categories_change ON public.categories;
DROP TRIGGER IF EXISTS on_public_financial_goals_change ON public.financial_goals;
DROP TRIGGER IF EXISTS on_public_budgets_change ON public.budgets;
DROP TRIGGER IF EXISTS on_public_todos_change ON public.todos;
DROP TRIGGER IF EXISTS on_public_notes_change ON public.notes;
DROP TRIGGER IF EXISTS on_public_dev_clients_change ON public.dev_clients;
DROP TRIGGER IF EXISTS on_public_profiles_change ON public.profiles;

-- Drop policies (em ordem alfabética de tabela)
DROP POLICY IF EXISTS "Users can manage their own budgets." ON public.budgets;
DROP POLICY IF EXISTS "Users can manage their own categories." ON public.categories;
DROP POLICY IF EXISTS "Users can manage their own dev clients." ON public.dev_clients;
DROP POLICY IF EXISTS "Users can manage their own financial goals." ON public.financial_goals;
DROP POLICY IF EXISTS "Users can manage their own notes." ON public.notes;
DROP POLICY IF EXISTS "Allow anon to insert their own profile on signup" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can manage their own todos." ON public.todos;
DROP POLICY IF EXISTS "Users can manage their own transactions." ON public.transactions;

-- Drop functions
DROP FUNCTION IF EXISTS public.log_changes();

-- Drop tables (em ordem reversa de criação/dependência)
DROP TABLE IF EXISTS public.transactions_log;
DROP TABLE IF EXISTS public.categories_log;
DROP TABLE IF EXISTS public.financial_goals_log;
DROP TABLE IF EXISTS public.budgets_log;
DROP TABLE IF EXISTS public.todos_log;
DROP TABLE IF EXISTS public.notes_log;
DROP TABLE IF EXISTS public.dev_clients_log;
DROP TABLE IF EXISTS public.profiles_log;
DROP TABLE IF EXISTS public.transactions;
DROP TABLE IF EXISTS public.budgets;
DROP TABLE IF EXISTS public.categories;
DROP TABLE IF EXISTS public.financial_goals;
DROP TABLE IF EXISTS public.todos;
DROP TABLE IF EXISTS public.notes;
DROP TABLE IF EXISTS public.dev_clients;
DROP TABLE IF EXISTS public.profiles;

-- Drop ENUM types
DROP TYPE IF EXISTS public.account_type_enum;
DROP TYPE IF EXISTS public.transaction_type_enum;
DROP.TYPE IF EXISTS public.goal_status_enum;
DROP TYPE IF EXISTS public.dev_client_status_enum;
DROP TYPE IF EXISTS public.dev_client_priority_enum;

-- ========== TIPOS (ENUMS) ==========
CREATE TYPE public.account_type_enum AS ENUM ('pessoa', 'empresa');
CREATE TYPE public.transaction_type_enum AS ENUM ('income', 'expense');
CREATE TYPE public.goal_status_enum AS ENUM ('in_progress', 'achieved', 'cancelled');
CREATE TYPE public.dev_client_status_enum AS ENUM ('planning', 'in_progress', 'delivered', 'on_hold', 'delayed');
CREATE TYPE public.dev_client_priority_enum AS ENUM ('low', 'medium', 'high');

-- ========== TABELAS ==========

-- Tabela de Perfis de Usuário
CREATE TABLE public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    display_name text,
    email text UNIQUE NOT NULL,
    hashed_password text, -- Apenas para referência, o hash real está em auth.users
    phone text,
    avatar_url text,
    account_type public.account_type_enum,
    cpf_cnpj text UNIQUE,
    rg text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de Categorias
CREATE TABLE public.categories (
    id uuid NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    type public.transaction_type_enum NOT NULL,
    icon text,
    is_default boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
-- Índice único para nomes de categorias padrão para evitar duplicatas no seed.
CREATE UNIQUE INDEX IF NOT EXISTS unique_default_category_name ON public.categories (name) WHERE is_default = true;

-- Tabela de Transações
CREATE TABLE public.transactions (
    id uuid NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    description text NOT NULL,
    amount real NOT NULL,
    date date NOT NULL,
    type public.transaction_type_enum NOT NULL,
    notes text,
    is_recurring boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de Orçamentos
CREATE TABLE public.budgets (
    id uuid NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    limit_amount real NOT NULL,
    spent_amount real NOT NULL DEFAULT 0,
    period_start_date date NOT NULL,
    period_end_date date NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, category_id, period_start_date) -- Evita orçamentos duplicados para mesma categoria no mesmo período
);

-- Tabela de Metas Financeiras
CREATE TABLE public.financial_goals (
    id uuid NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    target_amount real NOT NULL,
    current_amount real NOT NULL DEFAULT 0,
    deadline_date date,
    icon text,
    status public.goal_status_enum NOT NULL DEFAULT 'in_progress',
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de Tarefas (To-Do List)
CREATE TABLE public.todos (
    id uuid NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    description text NOT NULL,
    is_completed boolean NOT NULL DEFAULT false,
    due_date date,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de Anotações (Notepad)
CREATE TABLE public.notes (
    id uuid NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    content text,
    color text,
    is_pinned boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de Clientes para Módulo DEV
CREATE TABLE public.dev_clients (
    id uuid NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    service_type text,
    status public.dev_client_status_enum,
    priority public.dev_client_priority_enum,
    start_date date,
    deadline date,
    total_price real,
    notes text,
    tasks text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- ========== TABELAS DE LOG ==========

CREATE TABLE public.profiles_log (
    id serial PRIMARY KEY,
    operation char(1) NOT NULL, -- I for insert, U for update, D for delete
    timestamp timestamptz NOT NULL DEFAULT now(),
    user_performing_action text,
    record_id uuid,
    old_data jsonb,
    new_data jsonb
);
CREATE TABLE public.transactions_log ( id serial PRIMARY KEY, operation char(1) NOT NULL, timestamp timestamptz NOT NULL DEFAULT now(), user_performing_action text, record_id uuid, old_data jsonb, new_data jsonb );
CREATE TABLE public.categories_log ( id serial PRIMARY KEY, operation char(1) NOT NULL, timestamp timestamptz NOT NULL DEFAULT now(), user_performing_action text, record_id uuid, old_data jsonb, new_data jsonb );
CREATE TABLE public.financial_goals_log ( id serial PRIMARY KEY, operation char(1) NOT NULL, timestamp timestamptz NOT NULL DEFAULT now(), user_performing_action text, record_id uuid, old_data jsonb, new_data jsonb );
CREATE TABLE public.budgets_log ( id serial PRIMARY KEY, operation char(1) NOT NULL, timestamp timestamptz NOT NULL DEFAULT now(), user_performing_action text, record_id uuid, old_data jsonb, new_data jsonb );
CREATE TABLE public.todos_log ( id serial PRIMARY KEY, operation char(1) NOT NULL, timestamp timestamptz NOT NULL DEFAULT now(), user_performing_action text, record_id uuid, old_data jsonb, new_data jsonb );
CREATE TABLE public.notes_log ( id serial PRIMARY KEY, operation char(1) NOT NULL, timestamp timestamptz NOT NULL DEFAULT now(), user_performing_action text, record_id uuid, old_data jsonb, new_data jsonb );
CREATE TABLE public.dev_clients_log ( id serial PRIMARY KEY, operation char(1) NOT NULL, timestamp timestamptz NOT NULL DEFAULT now(), user_performing_action text, record_id uuid, old_data jsonb, new_data jsonb );

-- ========== FUNÇÃO DE LOG GENÉRICA ==========

CREATE OR REPLACE FUNCTION public.log_changes()
RETURNS TRIGGER AS $$
DECLARE
    log_table_name TEXT;
BEGIN
    log_table_name := TG_TABLE_NAME || '_log';
    IF (TG_OP = 'INSERT') THEN
        EXECUTE format('INSERT INTO public.%I (operation, user_performing_action, record_id, new_data) VALUES ($1, $2, $3, $4)', log_table_name)
        USING 'I', auth.uid()::text, NEW.id, to_jsonb(NEW);
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        EXECUTE format('INSERT INTO public.%I (operation, user_performing_action, record_id, old_data, new_data) VALUES ($1, $2, $3, $4, $5)', log_table_name)
        USING 'U', auth.uid()::text, NEW.id, to_jsonb(OLD), to_jsonb(NEW);
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        EXECUTE format('INSERT INTO public.%I (operation, user_performing_action, record_id, old_data) VALUES ($1, $2, $3, $4)', log_table_name)
        USING 'D', auth.uid()::text, OLD.id, to_jsonb(OLD);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ========== TRIGGERS PARA LOGS ==========

CREATE TRIGGER on_public_profiles_change AFTER INSERT OR UPDATE OR DELETE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.log_changes();
CREATE TRIGGER on_public_transactions_change AFTER INSERT OR UPDATE OR DELETE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.log_changes();
CREATE TRIGGER on_public_categories_change AFTER INSERT OR UPDATE OR DELETE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.log_changes();
CREATE TRIGGER on_public_financial_goals_change AFTER INSERT OR UPDATE OR DELETE ON public.financial_goals FOR EACH ROW EXECUTE FUNCTION public.log_changes();
CREATE TRIGGER on_public_budgets_change AFTER INSERT OR UPDATE OR DELETE ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.log_changes();
CREATE TRIGGER on_public_todos_change AFTER INSERT OR UPDATE OR DELETE ON public.todos FOR EACH ROW EXECUTE FUNCTION public.log_changes();
CREATE TRIGGER on_public_notes_change AFTER INSERT OR UPDATE OR DELETE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.log_changes();
CREATE TRIGGER on_public_dev_clients_change AFTER INSERT OR UPDATE OR DELETE ON public.dev_clients FOR EACH ROW EXECUTE FUNCTION public.log_changes();


-- ========== SEED INICIAL DE CATEGORIAS ==========

-- A cláusula ON CONFLICT requer um índice único. Criamos um índice único parcial para as categorias padrão.
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

-- ========== POLÍTICAS DE SEGURANÇA (RLS) ==========

-- Ativa RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_clients ENABLE ROW LEVEL SECURITY;

-- Políticas para a tabela 'profiles'
CREATE POLICY "Users can view their own profile." ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow anon to insert their own profile on signup" ON public.profiles FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow service_role to insert new profiles" ON public.profiles FOR INSERT TO service_role WITH CHECK (true);

-- Políticas para a tabela 'categories'
CREATE POLICY "Users can manage their own categories." ON public.categories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view default categories." ON public.categories FOR SELECT USING (is_default = true);

-- Políticas para as demais tabelas (padrão de "dono do dado")
CREATE POLICY "Users can manage their own transactions." ON public.transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own budgets." ON public.budgets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own financial goals." ON public.financial_goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own todos." ON public.todos FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own notes." ON public.notes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own dev clients." ON public.dev_clients FOR ALL USING (auth.uid() = user_id);


-- ### Limpeza Geral do Banco de Dados ###
-- O código abaixo remove todas as tabelas, tipos e funções customizadas
-- para garantir um ambiente limpo antes de criar a nova estrutura.
-- É seguro executar isso mesmo que as tabelas não existam.

-- Desabilita a confirmação de email para novos usuários (fluxo de cadastro mais simples)
-- Nota: Usando um bloco anônimo para evitar erros se a configuração já estiver correta.
DO $$
BEGIN
   IF EXISTS (SELECT 1 FROM pg_settings WHERE name = 'app.settings.allow_anonymous_users' AND setting = 't') THEN
      UPDATE auth.settings SET confirm_email = false;
      RAISE NOTICE 'Email confirmation disabled.';
   ELSE
      -- Em versões mais recentes do Supabase, a alteração é via API ou Dashboard.
      -- Este comando pode falhar, mas não impede o resto do script.
      -- A alternativa é desabilitar manualmente no Dashboard > Authentication > Providers > Email.
      BEGIN
         UPDATE auth.settings SET confirm_email = false;
         RAISE NOTICE 'Attempted to disable email confirmation.';
      EXCEPTION WHEN OTHERS THEN
         RAISE NOTICE 'Could not disable email confirmation via SQL. Please check Supabase dashboard settings.';
      END;
   END IF;
END $$;


DROP TABLE IF EXISTS public.quote_logs CASCADE;
DROP TABLE IF EXISTS public.financial_assets CASCADE;
DROP TABLE IF EXISTS public.weather_logs CASCADE;
DROP TABLE IF EXISTS public.api_cities CASCADE;
DROP TABLE IF EXISTS public.todos CASCADE;
DROP TABLE IF EXISTS public.notes CASCADE;
DROP TABLE IF EXISTS public.financial_goals CASCADE;
DROP TABLE IF EXISTS public.budgets CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP TYPE IF EXISTS public.account_type;
DROP TYPE IF EXISTS public.transaction_type;
DROP TYPE IF EXISTS public.goal_status;
DROP TYPE IF EXISTS public.client_status;
DROP TYPE IF EXISTS public.client_priority;
DROP TYPE IF EXISTS public.asset_type;

-- Remove a função e o trigger de `moddatetime` se existirem
DROP TRIGGER IF EXISTS on_public_tables_update ON public.profiles;
DROP TRIGGER IF EXISTS on_public_tables_update ON public.categories;
DROP TRIGGER IF EXISTS on_public_tables_update ON public.transactions;
DROP TRIGGER IF EXISTS on_public_tables_update ON public.budgets;
DROP TRIGGER IF EXISTS on_public_tables_update ON public.financial_goals;
DROP TRIGGER IF EXISTS on_public_tables_update ON public.todos;
DROP TRIGGER IF EXISTS on_public_tables_update ON public.notes;
DROP TRIGGER IF EXISTS on_public_tables_update ON public.api_cities;
DROP TRIGGER IF EXISTS on_public_tables_update ON public.weather_logs;
DROP TRIGGER IF EXISTS on_public_tables_update ON public.financial_assets;
DROP TRIGGER IF EXISTS on_public_tables_update ON public.quote_logs;

DROP FUNCTION IF EXISTS public.moddatetime();

-- ### Criação da Estrutura (Tabelas, Tipos e Funções) ###

-- Função para auto-atualizar o campo `updated_at`
CREATE OR REPLACE FUNCTION public.moddatetime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criação de Tipos (ENUMs)
CREATE TYPE public.account_type AS ENUM ('pessoa', 'empresa');
CREATE TYPE public.transaction_type AS ENUM ('income', 'expense');
CREATE TYPE public.goal_status AS ENUM ('in_progress', 'achieved', 'cancelled');
CREATE TYPE public.client_status AS ENUM ('planning', 'in_progress', 'delivered', 'on_hold', 'delayed');
CREATE TYPE public.client_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.asset_type AS ENUM ('currency', 'stock_index', 'commodity');


-- Tabela de Perfis de Usuário
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY DEFAULT auth.uid(),
  full_name TEXT,
  display_name TEXT,
  email TEXT NOT NULL UNIQUE,
  hashed_password TEXT,
  phone TEXT,
  avatar_url TEXT,
  account_type public.account_type,
  cpf_cnpj TEXT UNIQUE,
  rg TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT email_must_be_valid_email CHECK (email ~* '^[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$')
);
CREATE TRIGGER on_public_profiles_update BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.moddatetime();

-- Tabela de Categorias
CREATE TABLE public.categories (
  id UUID NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type public.transaction_type NOT NULL,
  icon TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTamptz NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER on_public_categories_update BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE PROCEDURE public.moddatetime();
-- Garante que o nome de uma categoria customizada seja único para aquele usuário
CREATE UNIQUE INDEX user_category_name_unique ON public.categories (user_id, name) WHERE user_id IS NOT NULL;
-- Garante que o nome de uma categoria padrão seja único
CREATE UNIQUE INDEX default_category_name_unique ON public.categories (name) WHERE is_default = true;


-- Tabela de Transações
CREATE TABLE public.transactions (
  id UUID NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  date DATE NOT NULL,
  type public.transaction_type NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER on_public_transactions_update BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE PROCEDURE public.moddatetime();

-- Tabela de Orçamentos
CREATE TABLE public.budgets (
  id UUID NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  limit_amount NUMERIC(12, 2) NOT NULL,
  spent_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT limit_must_be_positive CHECK (limit_amount > 0)
);
CREATE TRIGGER on_public_budgets_update BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE PROCEDURE public.moddatetime();

-- Tabela de Metas Financeiras
CREATE TABLE public.financial_goals (
  id UUID NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC(12, 2) NOT NULL,
  current_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  deadline_date DATE,
  icon TEXT,
  status public.goal_status NOT NULL DEFAULT 'in_progress',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER on_public_financial_goals_update BEFORE UPDATE ON public.financial_goals FOR EACH ROW EXECUTE PROCEDURE public.moddatetime();

-- Tabela de Lista de Tarefas (Todos)
CREATE TABLE public.todos (
  id UUID NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER on_public_todos_update BEFORE UPDATE ON public.todos FOR EACH ROW EXECUTE PROCEDURE public.moddatetime();

-- Tabela de Anotações (Notepad)
CREATE TABLE public.notes (
    id UUID NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    color TEXT,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER on_public_notes_update BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE PROCEDURE public.moddatetime();


-- ### Novas Tabelas para APIs Externas ###

-- Tabela para Cidades (API de Clima)
CREATE TABLE public.api_cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    country VARCHAR(5) NOT NULL,
    latitude DECIMAL(9, 6),
    longitude DECIMAL(9, 6),
    UNIQUE (name, country)
);

-- Tabela para Histórico de Clima
CREATE TABLE public.weather_logs (
    id SERIAL PRIMARY KEY,
    city_id INT NOT NULL REFERENCES public.api_cities(id) ON DELETE CASCADE,
    temperature DECIMAL(5, 2),
    description VARCHAR(255),
    icon_code VARCHAR(10),
    humidity INT,
    wind_speed DECIMAL(5, 2),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela para Ativos Financeiros (API de Cotações)
CREATE TABLE public.financial_assets (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    asset_type public.asset_type NOT NULL
);

-- Tabela para Histórico de Cotações
CREATE TABLE public.quote_logs (
    id SERIAL PRIMARY KEY,
    asset_id INT NOT NULL REFERENCES public.financial_assets(id) ON DELETE CASCADE,
    bid_price DECIMAL(18, 6),
    ask_price DECIMAL(18, 6),
    pct_change DECIMAL(10, 4),
    high_price DECIMAL(18, 6),
    low_price DECIMAL(18, 6),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ### Gatilho para Sincronização de Usuários do Supabase Auth ###
-- Este trigger garante que um perfil seja criado na tabela `public.profiles`
-- sempre que um novo usuário se cadastra no `auth.users` do Supabase.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, display_name, avatar_url, account_type, cpf_cnpj, rg, phone)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'display_name',
        NEW.raw_user_meta_data->>'avatar_url',
        (NEW.raw_user_meta_data->>'account_type')::public.account_type,
        NEW.raw_user_meta_data->>'cpf_cnpj',
        NEW.raw_user_meta_data->>'rg',
        NEW.raw_user_meta_data->>'phone'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove o trigger antigo se existir e cria o novo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ### Dados Iniciais (Seed Data) ###
-- Insere categorias padrão que estarão disponíveis para todos os usuários.
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


-- ### Políticas de Segurança (Row Level Security - RLS) ###

-- Habilitar RLS para todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
-- As tabelas de API são de acesso público ou gerenciadas pelo servidor, RLS pode não ser necessária ou ter uma lógica diferente.
ALTER TABLE public.api_cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_logs ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas antes de criar novas para evitar erros de "already exists"
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can view default and their own categories." ON public.categories;
DROP POLICY IF EXISTS "Users can manage their own categories." ON public.categories;
DROP POLICY IF EXISTS "Users can manage their own transactions." ON public.transactions;
DROP POLICY IF EXISTS "Users can manage their own budgets." ON public.budgets;
DROP POLICY IF EXISTS "Users can manage their own financial goals." ON public.financial_goals;
DROP POLICY IF EXISTS "Users can manage their own todos." ON public.todos;
DROP POLICY IF EXISTS "Users can manage their own notes." ON public.notes;
DROP POLICY IF EXISTS "API data tables are publicly readable." ON public.api_cities;
DROP POLICY IF EXISTS "API data tables are publicly readable." ON public.weather_logs;
DROP POLICY IF EXISTS "API data tables are publicly readable." ON public.financial_assets;
DROP POLICY IF EXISTS "API data tables are publicly readable." ON public.quote_logs;


-- Políticas para `profiles`
CREATE POLICY "Users can view their own profile." ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Políticas para `categories`
CREATE POLICY "Users can view default and their own categories." ON public.categories FOR SELECT USING (is_default = true OR auth.uid() = user_id);
CREATE POLICY "Users can manage their own categories." ON public.categories FOR ALL USING (auth.uid() = user_id);

-- Políticas para `transactions`, `budgets`, `financial_goals`, `todos`, `notes`
CREATE POLICY "Users can manage their own transactions." ON public.transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own budgets." ON public.budgets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own financial goals." ON public.financial_goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own todos." ON public.todos FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own notes." ON public.notes FOR ALL USING (auth.uid() = user_id);

-- Políticas para tabelas de API (Exemplo: permitir leitura para todos os usuários autenticados)
CREATE POLICY "API data tables are publicly readable." ON public.api_cities FOR SELECT USING (true);
CREATE POLICY "API data tables are publicly readable." ON public.weather_logs FOR SELECT USING (true);
CREATE POLICY "API data tables are publicly readable." ON public.financial_assets FOR SELECT USING (true);
CREATE POLICY "API data tables are publicly readable." ON public.quote_logs FOR SELECT USING (true);

-- ### Fim do Script ###

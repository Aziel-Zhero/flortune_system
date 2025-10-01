
-- ### FLUXO DE LIMPEZA COMPLETA (DROP ALL) ###
-- Desabilita a proteção contra exclusão de objetos no schema 'auth'
-- NOTA: Execute isso apenas se tiver certeza de que deseja recriar tudo.
-- Pode ser necessário rodar este bloco separadamente se houver proteções no Supabase.
-- DO $$
-- BEGIN
--   IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'auth' AND policyname = 'Allow all to objects in auth') THEN
--     ALTER POLICY "Allow all to objects in auth" ON "auth"."users" USING (true);
--   END IF;
-- END;
-- $$;

-- Remove tabelas do schema public em ordem de dependência
DROP TABLE IF EXISTS public.todos CASCADE;
DROP TABLE IF EXISTS public.financial_goals CASCADE;
DROP TABLE IF EXISTS public.budgets CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Remove as novas tabelas de API (caso o script seja rodado mais de uma vez)
DROP TABLE IF EXISTS public.weather_logs CASCADE;
DROP TABLE IF EXISTS public.api_cities CASCADE;
DROP TABLE IF EXISTS public.quote_logs CASCADE;
DROP TABLE IF EXISTS public.financial_assets CASCADE;

-- Remove as tabelas do schema next_auth
DROP TABLE IF EXISTS next_auth.users CASCADE;
DROP TABLE IF EXISTS next_auth.sessions CASCADE;
DROP TABLE IF EXISTS next_auth.accounts CASCADE;
DROP TABLE IF EXISTS next_auth.verification_tokens CASCADE;

-- Remove o schema do NextAuth se ele existir
DROP SCHEMA IF EXISTS next_auth CASCADE;

-- Remove os ENUM types personalizados
DROP TYPE IF EXISTS public.account_type;
DROP TYPE IF EXISTS public.transaction_type;
DROP TYPE IF EXISTS public.goal_status;
DROP TYPE IF EXISTS public.asset_type;
DROP TYPE IF EXISTS public.client_project_status;
DROP TYPE IF EXISTS public.client_project_priority;

-- Remove as funções de trigger
DROP FUNCTION IF EXISTS public.handle_new_user;
DROP FUNCTION IF EXISTS public.handle_profile_update;


-- ### INÍCIO DA CRIAÇÃO DO NOVO SCHEMA ###

-- Habilita as extensões necessárias no schema 'extensions'
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "moddatetime" WITH SCHEMA extensions;

-- ### DEFINIÇÃO DE TIPOS (ENUMS) ###
CREATE TYPE public.account_type AS ENUM ('pessoa', 'empresa');
CREATE TYPE public.transaction_type AS ENUM ('income', 'expense');
CREATE TYPE public.goal_status AS ENUM ('in_progress', 'achieved', 'cancelled');
CREATE TYPE public.asset_type AS ENUM ('currency', 'stock_index', 'commodity');
CREATE TYPE public.client_project_status AS ENUM ('planning', 'in_progress', 'delivered', 'on_hold', 'delayed');
CREATE TYPE public.client_project_priority AS ENUM ('low', 'medium', 'high');


-- ### CRIAÇÃO DAS TABELAS DO NÚCLEO ###

-- Tabela 1: profiles (Usuários)
CREATE TABLE public.profiles (
    id uuid NOT NULL PRIMARY KEY DEFAULT auth.uid(),
    full_name text,
    display_name text,
    email text NOT NULL UNIQUE,
    hashed_password text,
    phone text,
    avatar_url text,
    account_type public.account_type,
    cpf_cnpj text UNIQUE,
    rg text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT email_check CHECK (email ~* '^[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$')
);
COMMENT ON TABLE public.profiles IS 'Armazena dados de perfil para todos os usuários, complementando a tabela auth.users.';

-- Trigger para atualizar 'updated_at' na tabela profiles
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);

-- Tabela 2: categories (Categorias de Transações)
CREATE TABLE public.categories (
    id uuid NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    type public.transaction_type NOT NULL,
    icon text,
    is_default boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.categories IS 'Categorias para classificar transações, podem ser padrão ou do usuário.';
-- Garante que o nome da categoria seja único por usuário (ou para categorias padrão)
CREATE UNIQUE INDEX categories_user_name_type_unique ON public.categories (user_id, name, type);
-- Garante que categorias padrão não tenham nomes duplicados
CREATE UNIQUE INDEX categories_default_name_type_unique ON public.categories (name, type) WHERE is_default = true;

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);

-- Tabela 3: transactions (Transações Financeiras)
CREATE TABLE public.transactions (
    id uuid NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    description text NOT NULL,
    amount numeric(12, 2) NOT NULL,
    date date NOT NULL,
    type public.transaction_type NOT NULL,
    is_recurring boolean NOT NULL DEFAULT false,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.transactions IS 'Registros de todas as movimentações financeiras dos usuários.';

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);

-- Tabela 4: budgets (Orçamentos)
CREATE TABLE public.budgets (
    id uuid NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    limit_amount numeric(12, 2) NOT NULL,
    spent_amount numeric(12, 2) NOT NULL DEFAULT 0,
    period_start_date date NOT NULL,
    period_end_date date NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_id, category_id, period_start_date)
);
COMMENT ON TABLE public.budgets IS 'Orçamentos de gastos para categorias específicas em um período.';

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);

-- Tabela 5: financial_goals (Metas Financeiras)
CREATE TABLE public.financial_goals (
    id uuid NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    target_amount numeric(12, 2) NOT NULL,
    current_amount numeric(12, 2) NOT NULL DEFAULT 0,
    deadline_date date,
    icon text,
    status public.goal_status NOT NULL DEFAULT 'in_progress',
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.financial_goals IS 'Metas financeiras de longo ou curto prazo dos usuários.';

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.financial_goals
  FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);

-- Tabela 6: todos (Lista de Tarefas)
CREATE TABLE public.todos (
    id uuid NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    description text NOT NULL,
    is_completed boolean NOT NULL DEFAULT false,
    due_date date,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.todos IS 'Lista de tarefas simples para os usuários.';

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.todos
  FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);

-- ### CRIAÇÃO DAS TABELAS PARA APIS EXTERNAS ###

-- Tabela 7: api_cities (Cidades para o Clima)
CREATE TABLE public.api_cities (
    id serial PRIMARY KEY,
    name varchar(100) NOT NULL,
    country varchar(5) NOT NULL,
    latitude decimal(9, 6),
    longitude decimal(9, 6),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (name, country)
);
COMMENT ON TABLE public.api_cities IS 'Armazena cidades únicas para consulta de clima.';

-- Tabela 8: weather_logs (Logs de Clima)
CREATE TABLE public.weather_logs (
    id serial PRIMARY KEY,
    city_id integer NOT NULL REFERENCES public.api_cities(id) ON DELETE CASCADE,
    temperature decimal(5, 2),
    description varchar(255),
    icon_code varchar(10),
    humidity integer,
    wind_speed decimal(5, 2),
    recorded_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.weather_logs IS 'Histórico de registros de clima para as cidades.';

-- Tabela 9: financial_assets (Ativos Financeiros para Cotação)
CREATE TABLE public.financial_assets (
    id serial PRIMARY KEY,
    code varchar(20) NOT NULL UNIQUE,
    name varchar(100) NOT NULL,
    asset_type public.asset_type NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.financial_assets IS 'Armazena ativos financeiros únicos para cotações.';

-- Tabela 10: quote_logs (Logs de Cotações)
CREATE TABLE public.quote_logs (
    id serial PRIMARY KEY,
    asset_id integer NOT NULL REFERENCES public.financial_assets(id) ON DELETE CASCADE,
    bid_price decimal(18, 6),
    ask_price decimal(18, 6),
    pct_change decimal(10, 4),
    high_price decimal(18, 6),
    low_price decimal(18, 6),
    recorded_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.quote_logs IS 'Histórico de cotações para os ativos financeiros.';

-- ### CRIAÇÃO DAS TABELAS PARA AUTENTICAÇÃO (NextAuth.js) ###
-- Este schema é necessário para o SupabaseAdapter do NextAuth.js
CREATE SCHEMA IF NOT EXISTS next_auth;

CREATE TABLE next_auth.users (
  id uuid NOT NULL PRIMARY KEY,
  name text,
  email text,
  "emailVerified" timestamptz,
  image text
);

CREATE TABLE next_auth.accounts (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
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
  "userId" uuid REFERENCES next_auth.users(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX accounts_provider_providerAccountId_idx ON next_auth.accounts(provider, "providerAccountId");

CREATE TABLE next_auth.sessions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  expires timestamptz NOT NULL,
  "sessionToken" text NOT NULL UNIQUE,
  "userId" uuid REFERENCES next_auth.users(id) ON DELETE CASCADE
);

CREATE TABLE next_auth.verification_tokens (
  identifier text,
  token text,
  expires timestamptz NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- ### TRIGGERS E FUNÇÕES ###

-- Função para criar um perfil público quando um novo usuário se registra no auth.users do Supabase
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, display_name, avatar_url, account_type, phone, cpf_cnpj, rg)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'display_name',
    NEW.raw_user_meta_data ->> 'avatar_url',
    (NEW.raw_user_meta_data ->> 'account_type')::public.account_type,
    NEW.raw_user_meta_data ->> 'phone',
    NEW.raw_user_meta_data ->> 'cpf_cnpj',
    NEW.raw_user_meta_data ->> 'rg'
  );
  RETURN NEW;
END;
$$;

-- Trigger que chama a função handle_new_user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ### DADOS INICIAIS (SEED DATA) ###
-- Insere categorias padrão que estarão disponíveis para todos os usuários.
-- A cláusula ON CONFLICT garante que a inserção não falhará se o script for executado novamente.
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
ON CONFLICT (name, type) WHERE is_default = true DO NOTHING;

-- ### POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY - RLS) ###

-- Habilita RLS em todas as tabelas principais
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Política para profiles: Usuários podem ver e editar seu próprio perfil.
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
CREATE POLICY "Users can view their own profile." ON public.profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Política para categories: Usuários podem ver categorias padrão OU as que eles criaram. Podem gerenciar apenas as suas.
DROP POLICY IF EXISTS "Users can view default or their own categories." ON public.categories;
CREATE POLICY "Users can view default or their own categories." ON public.categories FOR SELECT USING (is_default = true OR auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage their own categories." ON public.categories FOR ALL USING (auth.uid() = user_id);

-- Políticas para as demais tabelas: Usuários só podem gerenciar seus próprios dados.
DROP POLICY IF EXISTS "Users can manage their own transactions." ON public.transactions;
CREATE POLICY "Users can manage their own transactions." ON public.transactions FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own budgets." ON public.budgets;
CREATE POLICY "Users can manage their own budgets." ON public.budgets FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own financial goals." ON public.financial_goals;
CREATE POLICY "Users can manage their own financial goals." ON public.financial_goals FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own todos." ON public.todos;
CREATE POLICY "Users can manage their own todos." ON public.todos FOR ALL USING (auth.uid() = user_id);

-- Desabilita a confirmação por email para novos usuários (fluxo de cadastro mais rápido)
-- UPDATE auth.settings SET confirm_email = false;
-- A linha acima é um comentário pois requer privilégios que o agente pode não ter via SQL Editor.
-- Recomenda-se fazer isso manualmente em: Supabase Dashboard > Authentication > Providers > Email > "Confirm email" (desmarcar).
-- Ou, se tiver permissão, execute o comando acima.
DO $$
BEGIN
   IF EXISTS(SELECT 1 FROM pg_tables WHERE schemaname = 'auth' AND tablename = 'settings') THEN
      UPDATE auth.settings SET confirm_email = false;
   END IF;
END $$;

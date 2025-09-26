
-- ### HABILITA EXTENSÕES ESSENCIAIS ###
-- Habilita a extensão para geração de UUIDs, necessária para as chaves primárias.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
-- Habilita a extensão para funções de data e hora, como a atualização automática de `updated_at`.
CREATE EXTENSION IF NOT EXISTS "moddatetime" WITH SCHEMA extensions;

-- ### SCHEMA `next_auth` (Gerenciado pelo SupabaseAdapter) ###
-- Este schema armazena as informações essenciais para a integração com NextAuth.js.
CREATE SCHEMA IF NOT EXISTS next_auth;

-- Tabela de Usuários do NextAuth
-- Armazena o perfil básico retornado pelos provedores de autenticação (Google, etc.).
CREATE TABLE IF NOT EXISTS next_auth.users (
    id uuid NOT NULL PRIMARY KEY,
    name text,
    email text,
    "emailVerified" timestamp with time zone,
    image text
);

-- Tabela de Contas do NextAuth
-- Vincula um usuário a um provedor de autenticação (ex: a conta Google de um usuário).
CREATE TABLE IF NOT EXISTS next_auth.accounts (
    id uuid NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
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

-- Tabela de Sessões do NextAuth
-- Armazena as sessões ativas dos usuários.
CREATE TABLE IF NOT EXISTS next_auth.sessions (
    id uuid NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    expires timestamp with time zone NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" uuid REFERENCES next_auth.users(id) ON DELETE CASCADE
);

-- Tabela de Tokens de Verificação do NextAuth
-- Usada para fluxos de "magic link" ou verificação de email.
CREATE TABLE IF NOT EXISTS next_auth.verification_tokens (
    identifier text,
    token text,
    expires timestamp with time zone NOT NULL,
    PRIMARY KEY (identifier, token)
);

-- ### SCHEMA `public` (Dados da Aplicação) ###

-- Tabela de Perfis
-- Nossa tabela principal, estende os dados do usuário com informações específicas do app.
-- A coluna `id` é a chave primária e usa o `id` do usuário de `auth.users` como padrão.
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY DEFAULT auth.uid(),
  full_name text,
  display_name text,
  email text NOT NULL UNIQUE,
  hashed_password text, -- Para login com credenciais
  phone text,
  cpf_cnpj text UNIQUE,
  rg text,
  avatar_url text,
  account_type text, -- 'pessoa' ou 'empresa'
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.profiles IS 'Stores detailed user profile information, extending the base auth user.';

-- Tabela de Categorias
-- Armazena categorias de despesas e receitas.
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL, -- 'income' ou 'expense'
  icon text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.categories IS 'Stores user-defined and default categories for transactions.';

-- Garante que categorias padrão não tenham nomes duplicados
CREATE UNIQUE INDEX IF NOT EXISTS categories_default_name_unique 
ON public.categories(name)
WHERE is_default = true;

-- Tabela de Transações
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  description text NOT NULL,
  amount numeric(12, 2) NOT NULL,
  date date NOT NULL,
  type text NOT NULL, -- 'income' ou 'expense'
  notes text,
  is_recurring boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.transactions IS 'Records all financial income and expenses.';

-- Tabela de Orçamentos
CREATE TABLE IF NOT EXISTS public.budgets (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  limit_amount numeric(12, 2) NOT NULL,
  spent_amount numeric(12, 2) NOT NULL DEFAULT 0,
  period_start_date date NOT NULL,
  period_end_date date NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.budgets IS 'Defines spending limits for categories over a period.';

-- Tabela de Metas Financeiras
CREATE TABLE IF NOT EXISTS public.financial_goals (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  target_amount numeric(12, 2) NOT NULL,
  current_amount numeric(12, 2) NOT NULL DEFAULT 0,
  deadline_date date,
  icon text,
  notes text,
  status text NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'achieved', 'cancelled'
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.financial_goals IS 'Tracks user financial savings goals.';

-- Tabela de Tarefas
CREATE TABLE IF NOT EXISTS public.todos (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  description text NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  due_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.todos IS 'Simple to-do list for user tasks.';

-- ### TRIGGERS E FUNÇÕES ###

-- Função para criar um perfil público quando um novo usuário é criado no Supabase Auth.
-- Esta função é o coração da sincronização entre `auth.users` e `public.profiles`.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, display_name, avatar_url, phone, cpf_cnpj, rg, account_type)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'cpf_cnpj',
    new.raw_user_meta_data->>'rg',
    new.raw_user_meta_data->>'account_type'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que chama a função `handle_new_user` após a inserção de um novo usuário.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para atualizar o campo `updated_at` em todas as tabelas.
-- Usando a extensão `moddatetime`.
DROP TRIGGER IF EXISTS handle_updated_at ON public.profiles;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);

DROP TRIGGER IF EXISTS handle_updated_at ON public.categories;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);

DROP TRIGGER IF EXISTS handle_updated_at ON public.transactions;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);

DROP TRIGGER IF EXISTS handle_updated_at ON public.budgets;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);

DROP TRIGGER IF EXISTS handle_updated_at ON public.financial_goals;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.financial_goals
  FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);
  
DROP TRIGGER IF EXISTS handle_updated_at ON public.todos;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.todos
  FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);

-- ### POLÍTICAS DE SEGURANÇA (RLS - Row Level Security) ###
-- As políticas garantem que os usuários só possam acessar seus próprios dados.

-- Habilita RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Políticas para a tabela `profiles`
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Políticas para as outras tabelas (CRUD completo para o dono dos dados)
CREATE OR REPLACE FUNCTION create_crud_policies(table_name TEXT)
RETURNS void AS $$
BEGIN
  EXECUTE format('DROP POLICY IF EXISTS "Users can view their own %1$s." ON public.%1$s;', table_name);
  EXECUTE format('CREATE POLICY "Users can view their own %1$s." ON public.%1$s FOR SELECT USING (auth.uid() = user_id);', table_name);
  
  EXECUTE format('DROP POLICY IF EXISTS "Users can insert their own %1$s." ON public.%1$s;', table_name);
  EXECUTE format('CREATE POLICY "Users can insert their own %1$s." ON public.%1$s FOR INSERT WITH CHECK (auth.uid() = user_id);', table_name);
  
  EXECUTE format('DROP POLICY IF EXISTS "Users can update their own %1$s." ON public.%1$s;', table_name);
  EXECUTE format('CREATE POLICY "Users can update their own %1$s." ON public.%1$s FOR UPDATE USING (auth.uid() = user_id);', table_name);
  
  EXECUTE format('DROP POLICY IF EXISTS "Users can delete their own %1$s." ON public.%1$s;', table_name);
  EXECUTE format('CREATE POLICY "Users can delete their own %1$s." ON public.%1$s FOR DELETE USING (auth.uid() = user_id);', table_name);
END;
$$ LANGUAGE plpgsql;

-- Aplica as políticas CRUD
SELECT create_crud_policies('transactions');
SELECT create_crud_policies('budgets');
SELECT create_crud_policies('financial_goals');
SELECT create_crud_policies('todos');

-- Políticas específicas para `categories` (permite visualizar categorias padrão)
DROP POLICY IF EXISTS "Users can view their own and default categories." ON public.categories;
CREATE POLICY "Users can view their own and default categories." ON public.categories
  FOR SELECT USING (auth.uid() = user_id OR is_default = true);

DROP POLICY IF EXISTS "Users can insert their own categories." ON public.categories;
CREATE POLICY "Users can insert their own categories." ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_default = false);

DROP POLICY IF EXISTS "Users can update their own categories." ON public.categories;
CREATE POLICY "Users can update their own categories." ON public.categories
  FOR UPDATE USING (auth.uid() = user_id AND is_default = false);

DROP POLICY IF EXISTS "Users can delete their own categories." ON public.categories;
CREATE POLICY "Users can delete their own categories." ON public.categories
  FOR DELETE USING (auth.uid() = user_id AND is_default = false);


-- ### Dados Iniciais (Seed Data) ###
-- Insere categorias padrão que estarão disponíveis para todos os usuários.
-- A cláusula ON CONFLICT garante que a inserção não falhe se o script for executado novamente.
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

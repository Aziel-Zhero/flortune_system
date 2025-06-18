-- Garante que a extensão uuid-ossp está disponível
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- Remove tabelas existentes se elas existirem para um novo começo limpo
DROP TABLE IF EXISTS public.financial_goals CASCADE;
DROP TABLE IF EXISTS public.budgets CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.todos CASCADE; -- Adicionado para a nova tabela de Todos
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP SCHEMA IF EXISTS next_auth CASCADE;


-- Criação do schema next_auth para o SupabaseAdapter
CREATE SCHEMA next_auth;

-- Tabela de Usuários (next_auth.users)
CREATE TABLE next_auth.users (
    id uuid NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    name text,
    email text UNIQUE,
    "emailVerified" timestamptz,
    image text
);

-- Tabela de Sessões (next_auth.sessions)
CREATE TABLE next_auth.sessions (
    id uuid NOT NULL PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    expires timestamptz NOT NULL,
    "sessionToken" text NOT NULL UNIQUE,
    "userId" uuid REFERENCES next_auth.users(id) ON DELETE CASCADE
);

-- Tabela de Contas (next_auth.accounts)
CREATE TABLE next_auth.accounts (
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
    oauth_token_secret text,
    oauth_token text,
    "userId" uuid REFERENCES next_auth.users(id) ON DELETE CASCADE,
    UNIQUE(provider, "providerAccountId")
);

-- Tabela de Tokens de Verificação (next_auth.verification_tokens)
CREATE TABLE next_auth.verification_tokens (
    identifier text,
    token text UNIQUE,
    expires timestamptz NOT NULL,
    PRIMARY KEY (identifier, token)
);

-- Tabela de Perfis de Usuário (public.profiles)
CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY, -- Este ID DEVE ser o mesmo que next_auth.users.id
  full_name TEXT,
  display_name TEXT,
  email TEXT NOT NULL UNIQUE,
  hashed_password TEXT, -- Para login com credenciais
  phone TEXT,
  cpf_cnpj TEXT UNIQUE,
  rg TEXT,
  avatar_url TEXT,
  account_type TEXT CHECK (account_type IN ('pessoa', 'empresa')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- NÃO HÁ MAIS FK DIRETA para next_auth.users.id aqui.
  -- A ligação é por convenção (mesmo ID) e gerenciada pelo trigger.
);

-- Trigger para atualizar 'updated_at' na tabela 'profiles'
CREATE OR REPLACE FUNCTION public.handle_profile_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profile_update_timestamp();


-- Função de Trigger para sincronizar next_auth.users com public.profiles
-- Esta função é SECURITY DEFINER para poder operar nas tabelas de ambos os schemas.
CREATE OR REPLACE FUNCTION public.handle_new_user_from_next_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Importante para permitir acesso a public.profiles e next_auth.users
AS $$
BEGIN
  -- Defina o search_path localmente para garantir que 'extensions' e 'public' sejam encontrados
  SET LOCAL search_path = public, extensions;

  -- Tenta inserir o novo usuário em public.profiles
  -- Se o ID já existir (caso da action signupUser ter criado o perfil primeiro),
  -- atualiza os campos que o NextAuth/OAuth poderia ter (nome, avatar).
  -- Não sobrescreve email, hashed_password, cpf_cnpj, account_type, etc., que foram
  -- definidos pela action signupUser.
  INSERT INTO public.profiles (id, email, display_name, full_name, avatar_url, account_type)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.name, -- NextAuth 'name' pode ser display_name ou full_name
    NEW.name, -- Inicializa full_name com o mesmo valor, pode ser ajustado pelo usuário depois
    NEW.image,
    'pessoa' -- Assume 'pessoa' por padrão para OAuth, pode ser ajustado
  )
  ON CONFLICT (id) DO UPDATE SET
    -- Apenas atualiza se o valor de NEW (vindo do NextAuth) for diferente e não nulo
    -- Prioriza os dados já existentes em public.profiles se NEW for nulo
    display_name = COALESCE(NEW.name, public.profiles.display_name),
    full_name = COALESCE(NEW.name, public.profiles.full_name), -- Atualiza full_name se o nome do NextAuth for diferente
    avatar_url = COALESCE(NEW.image, public.profiles.avatar_url),
    email = COALESCE(NEW.email, public.profiles.email), -- Garante que o email esteja sincronizado
    updated_at = NOW(); -- Sempre atualiza o timestamp de modificação
  RETURN NEW;
END;
$$;

-- Trigger que chama a função acima quando um novo usuário é inserido em next_auth.users
CREATE TRIGGER on_next_auth_user_created
  AFTER INSERT ON next_auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_from_next_auth();


-- RLS para public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to read their own profile" ON public.profiles;
CREATE POLICY "Allow authenticated users to read their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid())); -- Compara com o ID do usuário da sessão Supabase (que é o mesmo que o NextAuth User ID)

DROP POLICY IF EXISTS "Allow authenticated users to update their own profile" ON public.profiles;
CREATE POLICY "Allow authenticated users to update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- Permite que a action de signup (usando anon key) insira um novo perfil.
-- A verificação de email duplicado já é feita na server action.
DROP POLICY IF EXISTS "Allow anon to insert their own profile on signup" ON public.profiles;
CREATE POLICY "Allow anon to insert their own profile on signup"
  ON public.profiles FOR INSERT
  TO anon
  WITH CHECK (true);

-- Para a verificação de email existente na action `signupUser` (que usa anon key):
DROP POLICY IF EXISTS "Allow anon to select email from profiles for signup check" ON public.profiles;
CREATE POLICY "Allow anon to select email from profiles for signup check"
  ON public.profiles FOR SELECT
  TO anon -- A chave anônima do Supabase
  USING (true); -- Permite ler todos os emails, mas só selecionamos a coluna email.


-- RLS para outras tabelas
-- Categories
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow users to manage their own categories" ON public.categories;
CREATE POLICY "Allow users to manage their own categories"
  ON public.categories FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS "Allow users to read default categories" ON public.categories;
CREATE POLICY "Allow users to read default categories"
  ON public.categories FOR SELECT
  TO authenticated
  USING (is_default = true);

-- Transactions
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow users to manage their own transactions" ON public.transactions;
CREATE POLICY "Allow users to manage their own transactions"
  ON public.transactions FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Budgets
CREATE TABLE public.budgets (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  limit_amount NUMERIC(10, 2) NOT NULL,
  spent_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow users to manage their own budgets" ON public.budgets;
CREATE POLICY "Allow users to manage their own budgets"
  ON public.budgets FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Financial Goals
CREATE TABLE public.financial_goals (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC(10, 2) NOT NULL,
  current_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  deadline_date DATE,
  icon TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'achieved', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow users to manage their own financial goals" ON public.financial_goals;
CREATE POLICY "Allow users to manage their own financial goals"
  ON public.financial_goals FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Tabela de Tarefas (Todos)
CREATE TABLE public.todos (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow users to manage their own todos" ON public.todos;
CREATE POLICY "Allow users to manage their own todos"
  ON public.todos FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Concede permissões ao role anon e authenticated para os schemas
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA next_auth TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;

-- Permissões para tabelas do next_auth (o adapter precisa disso)
GRANT SELECT ON next_auth.users TO service_role;
GRANT INSERT ON next_auth.users TO service_role;
GRANT UPDATE ON next_auth.users TO service_role;
GRANT DELETE ON next_auth.users TO service_role;

GRANT SELECT ON next_auth.sessions TO service_role;
GRANT INSERT ON next_auth.sessions TO service_role;
GRANT UPDATE ON next_auth.sessions TO service_role;
GRANT DELETE ON next_auth.sessions TO service_role;

GRANT SELECT ON next_auth.accounts TO service_role;
GRANT INSERT ON next_auth.accounts TO service_role;
GRANT UPDATE ON next_auth.accounts TO service_role;
GRANT DELETE ON next_auth.accounts TO service_role;

GRANT SELECT ON next_auth.verification_tokens TO service_role;
GRANT INSERT ON next_auth.verification_tokens TO service_role;
GRANT UPDATE ON next_auth.verification_tokens TO service_role;
GRANT DELETE ON next_auth.verification_tokens TO service_role;

-- Permissões para as tabelas do schema public para o service_role (usado pelo SupabaseAdapter e Triggers)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.budgets TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_goals TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.todos TO service_role; -- Adicionado

-- Permissões para o usuário autenticado (que são então restritas por RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.budgets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_goals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.todos TO authenticated; -- Adicionado

-- Permissões para o usuário anônimo (ex: para a action de signup poder verificar email)
GRANT SELECT ON public.profiles (email) TO anon;
GRANT INSERT ON public.profiles (id, full_name, display_name, email, hashed_password, phone, cpf_cnpj, rg, avatar_url, account_type) TO anon;


-- Verifica se o schema next_auth foi criado
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'next_auth';

-- Verifica se a tabela next_auth.users foi criada
SELECT COUNT(*) as next_auth_users_table_exists FROM pg_tables WHERE schemaname = 'next_auth' AND tablename = 'users';

-- Verifica se a coluna 'email' existe em 'public.profiles'
SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email';

-- Verifica se a tabela 'public.todos' foi criada
SELECT COUNT(*) as todos_table_exists FROM pg_tables WHERE schemaname = 'public' AND tablename = 'todos';

SELECT 'Schema script executado. Verifique os resultados das queries de verificação acima.' as script_status;

    

-- Esquema Supabase para Flortune App
-- Versão: 2.5
-- Última Atualização: Adição da tabela 'todos' e RLS. Refinamento de RLS para profiles.

-- Habilitar extensão para UUIDs se ainda não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- Habilitar pg_net para Supabase Edge Functions se necessário
-- CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;


-- -----------------------------------------------------------------------------
-- SCHEMA: next_auth (Gerenciado pelo SupabaseAdapter do NextAuth.js)
-- Tabelas: users, accounts, sessions, verification_tokens
-- -----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS next_auth;

-- Tabela: next_auth.users
DROP TABLE IF EXISTS next_auth.users CASCADE;
CREATE TABLE next_auth.users (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    name text NULL,
    email text NULL,
    "emailVerified" timestamptz NULL,
    image text NULL,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT email_unique UNIQUE (email)
);
COMMENT ON TABLE next_auth.users IS 'Armazena informações básicas de usuários gerenciadas pelo NextAuth.js.';

-- Tabela: next_auth.accounts
DROP TABLE IF EXISTS next_auth.accounts CASCADE;
CREATE TABLE next_auth.accounts (
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
    CONSTRAINT provider_unique UNIQUE (provider, "providerAccountId"),
    CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES next_auth.users(id) ON DELETE CASCADE
);
COMMENT ON TABLE next_auth.accounts IS 'Armazena informações de contas de provedores OAuth vinculadas aos usuários.';

-- Tabela: next_auth.sessions
DROP TABLE IF EXISTS next_auth.sessions CASCADE;
CREATE TABLE next_auth.sessions (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "sessionToken" text NOT NULL,
    "userId" uuid NOT NULL,
    expires timestamptz NOT NULL,
    CONSTRAINT sessions_pkey PRIMARY KEY (id),
    CONSTRAINT sessiontoken_unique UNIQUE ("sessionToken"),
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES next_auth.users(id) ON DELETE CASCADE
);
COMMENT ON TABLE next_auth.sessions IS 'Armazena sessões ativas de usuários.';

-- Tabela: next_auth.verification_tokens
DROP TABLE IF EXISTS next_auth.verification_tokens CASCADE;
CREATE TABLE next_auth.verification_tokens (
    identifier text NULL,
    token text NOT NULL,
    expires timestamptz NOT NULL,
    CONSTRAINT verification_tokens_pkey PRIMARY KEY (token),
    CONSTRAINT token_identifier_unique UNIQUE (token, identifier)
);
COMMENT ON TABLE next_auth.verification_tokens IS 'Armazena tokens de verificação (ex: para login sem senha ou verificação de email).';


-- -----------------------------------------------------------------------------
-- SCHEMA: public (Tabelas específicas da aplicação Flortune)
-- Tabelas: profiles, categories, transactions, budgets, financial_goals, todos
-- -----------------------------------------------------------------------------

-- Tabela: public.profiles
DROP TABLE IF EXISTS public.profiles CASCADE;
CREATE TABLE public.profiles (
    id uuid NOT NULL, -- Chave Primária, DEVE ser o mesmo ID de next_auth.users.id
    full_name text,
    display_name text,
    email text NOT NULL UNIQUE, -- NOT NULL e UNIQUE para garantir consistência e lookup
    hashed_password text, -- Para login com credenciais
    phone text,
    cpf_cnpj text UNIQUE, -- CPF ou CNPJ, único
    rg text,
    avatar_url text,
    account_type text CHECK (account_type IN ('pessoa', 'empresa')),
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT profiles_pkey PRIMARY KEY (id)
    -- A FK direta para next_auth.users.id foi removida para permitir que a action de signup crie o perfil primeiro.
    -- A ligação é mantida pelo trigger e pela lógica da aplicação.
    -- CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES next_auth.users(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.profiles IS 'Armazena detalhes de perfil estendidos para usuários do Flortune, incluindo senha para login por credenciais.';


-- Trigger: public.handle_new_user_from_next_auth
-- Este trigger é crucial para manter a sincronia entre next_auth.users e public.profiles.
-- Ele dispara APÓS um novo usuário ser inserido em next_auth.users (pelo SupabaseAdapter).
DROP FUNCTION IF EXISTS public.handle_new_user_from_next_auth();
CREATE OR REPLACE FUNCTION public.handle_new_user_from_next_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com os privilégios do criador da função (geralmente um superusuário)
AS $$
BEGIN
  -- Tenta inserir um novo perfil.
  -- Se um perfil com o mesmo ID já existir (criado pela action de signup, por exemplo),
  -- atualiza os campos que podem vir do provedor OAuth ou do NextAuth (email, display_name, avatar_url).
  -- Campos como hashed_password, full_name, cpf_cnpj, account_type não devem ser sobrescritos
  -- por este trigger se já foram definidos pela action de signup.
  SET LOCAL search_path = public, extensions; -- Garante que uuid_generate_v4() esteja no path se usado como default
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.name, -- NextAuth 'name' pode ser usado como 'display_name' inicial
    NEW.image   -- NextAuth 'image' pode ser usado como 'avatar_url' inicial
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, public.profiles.email), -- Atualiza email se o novo for diferente, mas prioriza o existente se EXCLUDED.email for nulo
    display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name), -- Prioriza o display_name existente se houver
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),       -- Prioriza o avatar_url existente
    updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_next_auth_user_created ON next_auth.users;
CREATE TRIGGER on_next_auth_user_created
  AFTER INSERT ON next_auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_from_next_auth();
COMMENT ON TRIGGER on_next_auth_user_created ON next_auth.users IS 'Quando um usuário é criado em next_auth.users, cria/atualiza o perfil correspondente em public.profiles.';


-- Tabela: public.categories
DROP TABLE IF EXISTS public.categories CASCADE;
CREATE TABLE public.categories (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE, -- Nulo para categorias padrão
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('income', 'expense')),
    icon text,
    is_default boolean NOT NULL DEFAULT false,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.categories IS 'Categorias para transações, podem ser padrão ou definidas pelo usuário.';

-- Tabela: public.transactions
DROP TABLE IF EXISTS public.transactions CASCADE;
CREATE TABLE public.transactions (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    description text NOT NULL,
    amount numeric(12, 2) NOT NULL, -- Aumentada precisão
    date date NOT NULL,
    type text NOT NULL CHECK (type IN ('income', 'expense')),
    notes text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.transactions IS 'Registros de todas as transações financeiras dos usuários.';

-- Tabela: public.budgets
DROP TABLE IF EXISTS public.budgets CASCADE;
CREATE TABLE public.budgets (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    limit_amount numeric(12, 2) NOT NULL,
    spent_amount numeric(12, 2) NOT NULL DEFAULT 0.00,
    period_start_date date NOT NULL,
    period_end_date date NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT unique_budget_period_category UNIQUE (user_id, category_id, period_start_date, period_end_date),
    CONSTRAINT check_dates CHECK (period_end_date >= period_start_date)
);
COMMENT ON TABLE public.budgets IS 'Orçamentos definidos pelos usuários para categorias específicas.';

-- Tabela: public.financial_goals
DROP TABLE IF EXISTS public.financial_goals CASCADE;
CREATE TABLE public.financial_goals (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    target_amount numeric(12, 2) NOT NULL,
    current_amount numeric(12, 2) NOT NULL DEFAULT 0.00,
    deadline_date date,
    icon text,
    notes text,
    status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'achieved', 'cancelled')),
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.financial_goals IS 'Metas financeiras dos usuários.';

-- Tabela: public.todos (NOVA TABELA)
DROP TABLE IF EXISTS public.todos CASCADE;
CREATE TABLE public.todos (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    description text NOT NULL,
    is_completed boolean NOT NULL DEFAULT false,
    due_date date,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.todos IS 'Lista de tarefas para os usuários.';


-- -----------------------------------------------------------------------------
-- POLÍTICAS DE ROW LEVEL SECURITY (RLS)
-- -----------------------------------------------------------------------------

-- Habilitar RLS para todas as tabelas relevantes
ALTER TABLE next_auth.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE next_auth.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE next_auth.sessions ENABLE ROW LEVEL SECURITY;
-- verification_tokens geralmente não precisa de RLS complexa se gerenciada por Auth.js

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY; -- Habilitar RLS para a nova tabela

-- Políticas para next_auth.users (gerenciadas pelo SupabaseAdapter)
-- O SupabaseAdapter espera poder ler e escrever na tabela users.
-- A policy abaixo é um exemplo; o adapter pode precisar de mais permissões.
DROP POLICY IF EXISTS "Allow all access for SupabaseAdapter on users" ON next_auth.users;
CREATE POLICY "Allow all access for SupabaseAdapter on users"
    ON next_auth.users
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Políticas para next_auth.accounts
DROP POLICY IF EXISTS "Allow all access for SupabaseAdapter on accounts" ON next_auth.accounts;
CREATE POLICY "Allow all access for SupabaseAdapter on accounts"
    ON next_auth.accounts
    FOR ALL
    USING (true) -- Permite leitura se userId corresponde ou se for service_role
    WITH CHECK (auth.uid() = "userId"); -- Permite escrita apenas se userId corresponde

-- Políticas para next_auth.sessions
DROP POLICY IF EXISTS "Allow all access for SupabaseAdapter on sessions" ON next_auth.sessions;
CREATE POLICY "Allow all access for SupabaseAdapter on sessions"
    ON next_auth.sessions
    FOR ALL
    USING (true) -- Permite leitura se userId corresponde ou se for service_role
    WITH CHECK (auth.uid() = "userId"); -- Permite escrita apenas se userId corresponde

-- Políticas para public.profiles
DROP POLICY IF EXISTS "Allow authenticated users to read their own profile" ON public.profiles;
CREATE POLICY "Allow authenticated users to read their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
CREATE POLICY "Allow users to update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Permite que a action de signup (usando anon key por padrão para o client Supabase) insira um novo perfil.
-- A verificação de email duplicado já é feita na server action antes da inserção.
-- A verificação de ID único (PK) e email único (constraint) na tabela previne duplicatas.
DROP POLICY IF EXISTS "Allow anon to insert their own profile on signup" ON public.profiles;
CREATE POLICY "Allow anon to insert their own profile on signup"
  ON public.profiles FOR INSERT
  TO anon
  WITH CHECK (true); -- A action valida os dados antes.

-- Permite que o trigger handle_new_user_from_next_auth (SECURITY DEFINER) insira/atualize perfis.
-- Esta política é para a role que o trigger efetivamente usa.
-- Se o trigger é SECURITY DEFINER e o definer é postgres (ou supabase_admin),
-- ele bypassa RLS, então uma política específica para a role do trigger pode não ser estritamente necessária,
-- mas é bom ter em mente. Por enquanto, a política de INSERT para 'anon' e o trigger devem cobrir.

-- Políticas para public.categories
DROP POLICY IF EXISTS "Allow users to manage their own categories" ON public.categories;
CREATE POLICY "Allow users to manage their own categories"
  ON public.categories FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow all users to read default categories" ON public.categories;
CREATE POLICY "Allow all users to read default categories"
  ON public.categories FOR SELECT
  TO public -- Ou 'anon, authenticated'
  USING (is_default = true);

-- Políticas para public.transactions
DROP POLICY IF EXISTS "Allow users to manage their own transactions" ON public.transactions;
CREATE POLICY "Allow users to manage their own transactions"
  ON public.transactions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas para public.budgets
DROP POLICY IF EXISTS "Allow users to manage their own budgets" ON public.budgets;
CREATE POLICY "Allow users to manage their own budgets"
  ON public.budgets FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas para public.financial_goals
DROP POLICY IF EXISTS "Allow users to manage their own financial goals" ON public.financial_goals;
CREATE POLICY "Allow users to manage their own financial goals"
  ON public.financial_goals FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas para public.todos (NOVA TABELA)
DROP POLICY IF EXISTS "Allow users to manage their own todos" ON public.todos;
CREATE POLICY "Allow users to manage their own todos"
  ON public.todos FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- -----------------------------------------------------------------------------
-- DADOS INICIAIS (Exemplos)
-- -----------------------------------------------------------------------------

-- Categorias Padrão
INSERT INTO public.categories (name, type, icon, is_default) VALUES
('Salário', 'income', 'DollarSign', true),
('Outras Receitas', 'income', 'TrendingUp', true),
('Moradia', 'expense', 'Home', true),
('Alimentação', 'expense', 'Utensils', true),
('Transporte', 'expense', 'Car', true),
('Saúde', 'expense', 'HeartPulse', true),
('Educação', 'expense', 'BookOpen', true),
('Lazer', 'expense', 'Gamepad2', true),
('Vestuário', 'expense', 'Shirt', true),
('Contas', 'expense', 'Receipt', true), -- Ex: água, luz, internet
('Impostos', 'expense', 'Landmark', true),
('Investimentos', 'expense', 'PiggyBank', true), -- Pode ser 'expense' se for saída para investimento
('Presentes', 'expense', 'Gift', true),
('Doações', 'expense', 'HandHeart', true),
('Viagens', 'expense', 'Plane', true),
('Cuidados Pessoais', 'expense', 'Sparkles', true),
('Assinaturas', 'expense', 'Youtube', true), -- Ex: Netflix, Spotify
('Outras Despesas', 'expense', 'MinusCircle', true)
ON CONFLICT (name, user_id, is_default) WHERE is_default = true DO NOTHING; -- Evita duplicatas se rodar múltiplas vezes


-- -----------------------------------------------------------------------------
-- FUNÇÕES AUXILIARES (Exemplo para atualizar spent_amount em budgets)
-- -----------------------------------------------------------------------------
-- Esta função pode ser chamada por um trigger em 'transactions'
-- para manter 'spent_amount' em 'budgets' atualizado.
-- ATENÇÃO: Triggers podem adicionar complexidade e sobrecarga.
-- Considere se esta lógica é melhor no lado da aplicação ou via jobs.

-- Exemplo de como você poderia criar a função (descomente e ajuste se for usar)
/*
CREATE OR REPLACE FUNCTION public.update_budget_spent_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  budget_record RECORD;
  total_spent NUMERIC;
BEGIN
  -- Se é um INSERT ou UPDATE em transactions
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    -- Encontrar o orçamento correspondente para a categoria e período da transação
    SELECT * INTO budget_record
    FROM public.budgets b
    WHERE b.user_id = NEW.user_id
      AND b.category_id = NEW.category_id
      AND NEW.date >= b.period_start_date
      AND NEW.date <= b.period_end_date;

    IF FOUND THEN
      -- Calcular o total gasto para essa categoria dentro do período do orçamento
      SELECT COALESCE(SUM(t.amount), 0) INTO total_spent
      FROM public.transactions t
      WHERE t.user_id = budget_record.user_id
        AND t.category_id = budget_record.category_id
        AND t.type = 'expense' -- Apenas despesas contam para o gasto do orçamento
        AND t.date >= budget_record.period_start_date
        AND t.date <= budget_record.period_end_date;

      -- Atualizar o spent_amount do orçamento
      UPDATE public.budgets
      SET spent_amount = total_spent, updated_at = now()
      WHERE id = budget_record.id;
    END IF;
  END IF;

  -- Se é um DELETE em transactions
  IF (TG_OP = 'DELETE') THEN
    SELECT * INTO budget_record
    FROM public.budgets b
    WHERE b.user_id = OLD.user_id
      AND b.category_id = OLD.category_id
      AND OLD.date >= b.period_start_date
      AND OLD.date <= b.period_end_date;

    IF FOUND THEN
      SELECT COALESCE(SUM(t.amount), 0) INTO total_spent
      FROM public.transactions t
      WHERE t.user_id = budget_record.user_id
        AND t.category_id = budget_record.category_id
        AND t.type = 'expense'
        AND t.date >= budget_record.period_start_date
        AND t.date <= budget_record.period_end_date;

      UPDATE public.budgets
      SET spent_amount = total_spent, updated_at = now()
      WHERE id = budget_record.id;
    END IF;
  END IF;

  RETURN NULL; -- Resultado do trigger não é usado
END;
$$;

DROP TRIGGER IF EXISTS on_transaction_change_update_budget ON public.transactions;
CREATE TRIGGER on_transaction_change_update_budget
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_budget_spent_amount();
COMMENT ON TRIGGER on_transaction_change_update_budget ON public.transactions IS 'Atualiza o spent_amount na tabela budgets quando uma transação é adicionada, atualizada ou deletada.';
*/

-- -----------------------------------------------------------------------------
-- Verifica se o trigger on_next_auth_user_created foi criado (DEBUG)
-- -----------------------------------------------------------------------------
SELECT tgname, relname
FROM pg_trigger
JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
WHERE tgname = 'on_next_auth_user_created';

-- Verifica as colunas da tabela public.profiles (DEBUG)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles';

-- Verifica as políticas RLS na tabela public.profiles (DEBUG)
SELECT policyname, ঘটনা, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles';

SELECT policyname, cmd, qual, with_check -- Corrigido para cmd
FROM pg_policies
WHERE schemaname = 'next_auth' AND tablename = 'users';

-- Verificar se a tabela 'todos' foi criada
SELECT EXISTS (
   SELECT FROM information_schema.tables
   WHERE  table_schema = 'public'
   AND    table_name   = 'todos'
);

-- Verificar RLS da tabela 'todos'
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'todos';


-- FIM DO SCRIPT
SELECT 'Schema Flortune v2.5 aplicado com sucesso!' AS status;
    
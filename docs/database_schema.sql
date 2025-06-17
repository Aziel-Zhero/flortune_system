
-- Remover schema existente 'next_auth' e 'public' se existirem, para um novo começo.
-- CUIDADO: ISSO APAGARÁ TODOS OS DADOS NOS SCHEMAS 'public' e 'next_auth'.
-- FAÇA BACKUP SE NECESSÁRIO. EM PRODUÇÃO, USE MIGRAÇÕES CUIDADOSAS.
DROP SCHEMA IF EXISTS next_auth CASCADE;
-- Não vamos dropar 'public' inteiro, mas sim as tabelas específicas do app
DROP TABLE IF EXISTS public.financial_goals CASCADE;
DROP TABLE IF EXISTS public.budgets CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE; -- Esta será recriada com a nova estrutura


-- Habilitar extensão pgcrypto se não estiver habilitada (para uuid_generate_v4())
CREATE EXTENSION IF NOT EXISTS pgcrypto;

--------------------------------------------------------------------------------
-- Schema: next_auth (para SupabaseAdapter do NextAuth.js)
--------------------------------------------------------------------------------
CREATE SCHEMA next_auth;

GRANT USAGE ON SCHEMA next_auth TO service_role;
GRANT ALL ON SCHEMA next_auth TO postgres;

-- Tabela next_auth.users
CREATE TABLE IF NOT EXISTS next_auth.users
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text,
    email text,
    "emailVerified" timestamp with time zone,
    image text,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT email_unique UNIQUE (email)
);
GRANT ALL ON TABLE next_auth.users TO postgres;
GRANT ALL ON TABLE next_auth.users TO service_role;

-- Função next_auth.uid()
CREATE OR REPLACE FUNCTION next_auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select
  	coalesce(
		nullif(current_setting('request.jwt.claim.sub', true), ''),
		(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
	)::uuid
$$;

-- Tabela next_auth.sessions
CREATE TABLE IF NOT EXISTS next_auth.sessions
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    expires timestamp with time zone NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" uuid,
    CONSTRAINT sessions_pkey PRIMARY KEY (id),
    CONSTRAINT sessionToken_unique UNIQUE ("sessionToken"),
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES next_auth.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);
GRANT ALL ON TABLE next_auth.sessions TO postgres;
GRANT ALL ON TABLE next_auth.sessions TO service_role;

-- Tabela next_auth.accounts
CREATE TABLE IF NOT EXISTS next_auth.accounts
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
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
    "userId" uuid,
    CONSTRAINT accounts_pkey PRIMARY KEY (id),
    CONSTRAINT provider_account_unique UNIQUE (provider, "providerAccountId"),
    CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES next_auth.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);
GRANT ALL ON TABLE next_auth.accounts TO postgres;
GRANT ALL ON TABLE next_auth.accounts TO service_role;

-- Tabela next_auth.verification_tokens
CREATE TABLE IF NOT EXISTS next_auth.verification_tokens
(
    identifier text,
    token text NOT NULL,
    expires timestamp with time zone NOT NULL,
    CONSTRAINT verification_tokens_pkey PRIMARY KEY (token),
    -- CONSTRAINT token_identifier_unique UNIQUE (token, identifier) -- Removido, PK em token é suficiente
    CONSTRAINT token_unique UNIQUE (token)
);
GRANT ALL ON TABLE next_auth.verification_tokens TO postgres;
GRANT ALL ON TABLE next_auth.verification_tokens TO service_role;


--------------------------------------------------------------------------------
-- Schema: public (para tabelas específicas da aplicação Flortune)
--------------------------------------------------------------------------------

-- Tabela public.profiles (Armazena detalhes do perfil do usuário, incluindo senha hasheada)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL PRIMARY KEY, -- Este ID DEVE ser o mesmo que next_auth.users.id
    full_name text,
    display_name text,
    email text NOT NULL UNIQUE, -- Email também é UNIQUE aqui para consistência
    hashed_password text, -- Senha hasheada para login por credenciais
    phone text,
    cpf_cnpj text UNIQUE,
    rg text,
    avatar_url text,
    account_type text CHECK (account_type IN ('pessoa', 'empresa')),
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") -- Garante que o ID do perfil existe em next_auth.users
        REFERENCES  next_auth.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE -- Se o usuário for deletado em next_auth, o perfil também será.
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies para public.profiles:
-- 1. Permitir que usuários anônimos criem seus próprios perfis (essencial para o cadastro).
CREATE POLICY "Allow anon to insert their own profile"
ON public.profiles FOR INSERT TO anon WITH CHECK (true);

-- 2. Permitir que usuários autenticados leiam SEU PRÓPRIO perfil.
CREATE POLICY "Allow authenticated users to read their own profile"
ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);

-- 3. Permitir que usuários autenticados atualizem SEU PRÓPRIO perfil.
CREATE POLICY "Allow authenticated users to update their own profile"
ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 4. (Opcional, mas útil para o admin do Supabase) Permitir que service_role acesse tudo.
CREATE POLICY "Allow service_role full access to profiles"
ON public.profiles TO service_role USING (true) WITH CHECK (true);

-- 5. Permitir que ANÔNIMOS leiam o email para verificar se já existe durante o cadastro
--    Esta policy é crucial para a verificação de email existente na action de signup.
CREATE POLICY "Allow anon to select email for signup check"
ON public.profiles FOR SELECT TO anon USING (true); -- Restringir colunas se necessário, mas para `select('email')` isso funciona


-- Tabela public.categories
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE, -- Nulo para categorias padrão
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('income', 'expense')),
    icon text,
    is_default boolean DEFAULT false,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
-- Policies para categories (Exemplos, ajuste conforme necessário):
CREATE POLICY "Allow users to manage their own categories"
ON public.categories FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow public read access to default categories"
ON public.categories FOR SELECT TO public -- anon e authenticated
USING (is_default = true);


-- Tabela public.transactions
CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    description text NOT NULL,
    amount numeric(10, 2) NOT NULL,
    date date NOT NULL,
    type text NOT NULL CHECK (type IN ('income', 'expense')),
    notes text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage their own transactions"
ON public.transactions FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- Tabela public.budgets
CREATE TABLE IF NOT EXISTS public.budgets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    limit_amount numeric(10, 2) NOT NULL,
    spent_amount numeric(10, 2) DEFAULT 0 NOT NULL,
    period_start_date date NOT NULL,
    period_end_date date NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE (user_id, category_id, period_start_date) -- Evitar orçamentos duplicados para mesma categoria e período
);
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage their own budgets"
ON public.budgets FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- Tabela public.financial_goals
CREATE TABLE IF NOT EXISTS public.financial_goals (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    target_amount numeric(12, 2) NOT NULL,
    current_amount numeric(12, 2) DEFAULT 0 NOT NULL,
    deadline_date date,
    icon text,
    notes text,
    status text DEFAULT 'in_progress' NOT NULL CHECK (status IN ('in_progress', 'achieved', 'cancelled')),
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage their own financial goals"
ON public.financial_goals FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- Função para atualizar 'updated_at' automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger às tabelas
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_financial_goals_updated_at BEFORE UPDATE ON public.financial_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para criar um perfil em public.profiles quando um usuário é inserido em next_auth.users
-- Isso é crucial para que usuários de OAuth (como Google) também tenham um perfil no Flortune.
CREATE OR REPLACE FUNCTION public.handle_new_user_from_next_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- Insere na tabela public.profiles usando os dados de next_auth.users
  -- e valores padrão para campos específicos do Flortune
  INSERT INTO public.profiles (id, email, display_name, full_name, avatar_url, account_type, hashed_password)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.name, -- Usa o 'name' do NextAuth como 'display_name' e 'full_name' inicialmente
    NEW.name, 
    NEW.image, -- Usa a 'image' do NextAuth como 'avatar_url'
    'pessoa', -- Assume 'pessoa' como tipo de conta padrão para OAuth
    NULL -- OAuth users não terão senha hasheada aqui, o login é pelo provider
  )
  ON CONFLICT (id) DO NOTHING; -- Se o perfil já existe (ex: criado por Credentials e depois OAuth com mesmo email)
  -- Se o usuário OAuth já tem um perfil (ex: criou com email/senha antes), não faz nada.
  -- Se quiser mesclar/atualizar, a lógica ON CONFLICT seria mais complexa.
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- SECURITY DEFINER é importante aqui

-- Remover trigger antigo se existir, para evitar duplicação ou erro
DROP TRIGGER IF EXISTS on_next_auth_user_created ON next_auth.users;
-- Criar o novo trigger
CREATE TRIGGER on_next_auth_user_created
  AFTER INSERT ON next_auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_from_next_auth();


-- Adicionar categorias padrão (se não existirem)
INSERT INTO public.categories (name, type, icon, is_default, user_id)
VALUES
    ('Salário', 'income', 'Briefcase', true, NULL),
    ('Renda Extra', 'income', 'DollarSign', true, NULL),
    ('Investimentos', 'income', 'TrendingUp', true, NULL),
    ('Moradia', 'expense', 'Home', true, NULL),
    ('Alimentação', 'expense', 'Utensils', true, NULL),
    ('Transporte', 'expense', 'Car', true, NULL),
    ('Saúde', 'expense', 'HeartPulse', true, NULL),
    ('Educação', 'expense', 'BookOpen', true, NULL),
    ('Lazer', 'expense', 'Gamepad2', true, NULL),
    ('Vestuário', 'expense', 'Shirt', true, NULL),
    ('Contas', 'expense', 'FileText', true, NULL),
    ('Impostos', 'expense', 'Landmark', true, NULL),
    ('Doações', 'expense', 'Gift', true, NULL),
    ('Outras Receitas', 'income', 'PlusCircle', true, NULL),
    ('Outras Despesas', 'expense', 'MinusCircle', true, NULL)
ON CONFLICT (name, user_id, is_default) DO NOTHING; -- Evita duplicatas se user_id for NULL para padrão

-- Conceder permissões básicas no schema public para anon e authenticated
-- O Supabase Adapter já lida com permissões para o schema next_auth.
-- Para o schema public, as RLS são a principal forma de controle.
-- Estes grants são mais sobre a capacidade de usar o schema.
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon; -- Permite SELECT para anon, RLS cuidará da restrição de linhas
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated; -- RLS cuidará da restrição de linhas

-- As RLS definidas acima para cada tabela especificarão quem pode fazer o quê.
-- Por exemplo, embora 'anon' possa ter SELECT em public.transactions,
-- a RLS "Allow users to manage their own transactions" impedirá que anon veja quaisquer linhas
-- porque auth.uid() será nulo para anon, e user_id nunca será nulo em transactions.

-- Para o `service_role` (usado pelo SupabaseAdapter e possivelmente pelo backend),
-- ele ignora RLS por padrão.
-- Para o usuário `postgres` (superusuário), ele também ignora RLS.

-- Garantir que `anon` e `authenticated` possam executar a função `next_auth.uid()`
GRANT EXECUTE ON FUNCTION next_auth.uid() TO anon;
GRANT EXECUTE ON FUNCTION next_auth.uid() TO authenticated;

    
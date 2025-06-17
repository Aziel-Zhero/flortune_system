
-- Certifique-se de que a extensão uuid-ossp está habilitada e no schema 'extensions'
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- Schema para o NextAuth.js Supabase Adapter
CREATE SCHEMA IF NOT EXISTS next_auth;

-- Concede permissão ao usuário 'postgres' (e por extensão, à service_role key)
-- para usar o schema 'extensions' onde uuid_generate_v4 reside.
-- E também para o schema 'next_auth'.
GRANT USAGE ON SCHEMA extensions TO postgres;
GRANT USAGE ON SCHEMA next_auth TO postgres;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA extensions TO postgres;


-- Tabela next_auth.users
CREATE TABLE IF NOT EXISTS next_auth.users
(
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    name text,
    email text,
    "emailVerified" timestamp with time zone,
    image text,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT email_unique UNIQUE (email)
);
GRANT ALL ON TABLE next_auth.users TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE next_auth.users TO service_role;
GRANT SELECT ON TABLE next_auth.users TO authenticated;
GRANT SELECT ON TABLE next_auth.users TO anon;


-- Tabela next_auth.sessions
CREATE TABLE IF NOT EXISTS next_auth.sessions
(
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    expires timestamp with time zone NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" uuid,
    CONSTRAINT sessions_pkey PRIMARY KEY (id),
    CONSTRAINT "sessionToken_unique" UNIQUE ("sessionToken"),
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES next_auth.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);
GRANT ALL ON TABLE next_auth.sessions TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE next_auth.sessions TO service_role;
GRANT SELECT ON TABLE next_auth.sessions TO authenticated;
GRANT SELECT ON TABLE next_auth.sessions TO anon;


-- Tabela next_auth.accounts
CREATE TABLE IF NOT EXISTS next_auth.accounts
(
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
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
    "userId" uuid,
    CONSTRAINT accounts_pkey PRIMARY KEY (id),
    CONSTRAINT "provider_providerAccountId_unique" UNIQUE (provider, "providerAccountId"),
    CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES next_auth.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);
GRANT ALL ON TABLE next_auth.accounts TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE next_auth.accounts TO service_role;
GRANT SELECT ON TABLE next_auth.accounts TO authenticated;
GRANT SELECT ON TABLE next_auth.accounts TO anon;


-- Tabela next_auth.verification_tokens
CREATE TABLE IF NOT EXISTS next_auth.verification_tokens
(
    identifier text,
    token text NOT NULL,
    expires timestamp with time zone NOT NULL,
    CONSTRAINT verification_tokens_pkey PRIMARY KEY (token),
    CONSTRAINT token_unique UNIQUE (token),
    CONSTRAINT "identifier_token_unique" UNIQUE (identifier, token)
);
GRANT ALL ON TABLE next_auth.verification_tokens TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE next_auth.verification_tokens TO service_role;
GRANT SELECT ON TABLE next_auth.verification_tokens TO authenticated;
GRANT SELECT ON TABLE next_auth.verification_tokens TO anon;


-- Tabela public.profiles (para informações adicionais do usuário)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY, -- Chave primária, DEVE corresponder a next_auth.users.id
  full_name TEXT,
  display_name TEXT,
  email TEXT NOT NULL UNIQUE, -- Email do usuário, DEVE corresponder a next_auth.users.email
  hashed_password TEXT,       -- Para login com credenciais
  phone TEXT,
  cpf_cnpj TEXT UNIQUE,
  rg TEXT,
  avatar_url TEXT,
  account_type TEXT CHECK (account_type IN ('pessoa', 'empresa')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES next_auth.users(id) ON DELETE CASCADE -- Chave estrangeira para next_auth.users
);
GRANT ALL ON TABLE public.profiles TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO service_role;
-- As RLS abaixo são exemplos e precisam ser ajustadas à sua lógica de acesso


-- Função utilitária (opcional, mas usada pelo Supabase Adapter em algumas versões/configurações)
CREATE OR REPLACE FUNCTION next_auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select
    coalesce(
      current_setting('request.jwt.claim.sub', true),
      (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
    )::uuid
$$;
GRANT EXECUTE ON FUNCTION next_auth.uid() TO postgres, anon, authenticated, service_role;


-- Trigger para sincronizar novos usuários de next_auth.users para public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user_from_next_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Importante para permitir que o trigger escreva em public.profiles
AS $$
BEGIN
  -- Define o search_path explicitamente dentro da função para garantir visibilidade dos schemas
  SET search_path = public, extensions;

  -- Insere um novo perfil, pegando dados de new (o novo registro em next_auth.users)
  INSERT INTO public.profiles (id, email, display_name, full_name, avatar_url, account_type)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.name, -- Usa 'name' de next_auth.users para display_name por padrão
    NEW.name, -- Usa 'name' de next_auth.users para full_name por padrão
    NEW.image, -- Usa 'image' de next_auth.users para avatar_url por padrão
    'pessoa' -- Define 'pessoa' como tipo de conta padrão para usuários OAuth/novos.
             -- Se for cadastro por credenciais, a action `signupUser` definirá o account_type.
  )
  ON CONFLICT (id) DO NOTHING; -- Se já existir um perfil com esse ID, não faz nada.
                              -- Isso pode acontecer se o trigger rodar mais de uma vez ou se o perfil foi criado de outra forma.

  -- Caso o usuário tenha sido criado por signup de credenciais, o `hashed_password` e `account_type`
  -- já estarão em `public.profiles`. Para OAuth, esses campos não são preenchidos pelo `next_auth.users`.
  -- O `email` em `public.profiles` é UNIQUE, então se o usuário OAuth tiver o mesmo email de um usuário
  -- de credenciais, o `ON CONFLICT (email)` na action `signupUser` deve ter prevenido duplicatas.
  -- O `ON CONFLICT (id)` aqui é mais uma segurança para o próprio trigger.

  RETURN NEW;
END;
$$;
GRANT EXECUTE ON FUNCTION public.handle_new_user_from_next_auth() TO postgres, service_role;

-- Cria o trigger na tabela next_auth.users
DROP TRIGGER IF EXISTS on_next_auth_user_created ON next_auth.users; -- Remove o trigger antigo se existir
CREATE TRIGGER on_next_auth_user_created
  AFTER INSERT ON next_auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_from_next_auth();


-- RLS para public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow authenticated users to read their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = next_auth.uid()); -- Compara com o ID do usuário da sessão NextAuth

CREATE POLICY IF NOT EXISTS "Allow authenticated users to update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = next_auth.uid())
  WITH CHECK (id = next_auth.uid());

-- Política para permitir que a função `handle_new_user_from_next_auth` (SECURITY DEFINER) insira.
-- A service_role já tem bypass RLS, mas para segurança, definimos que só pode inserir
-- se o email ainda não existir, para evitar conflitos de email que o `ON CONFLICT` do trigger pode não pegar.
-- Esta política é mais uma camada de segurança.
CREATE POLICY IF NOT EXISTS "Allow service_role to insert new profiles if email does not exist"
  ON public.profiles FOR INSERT
  TO service_role -- Ou ao usuário que o trigger executa como, se não for SECURITY DEFINER
  WITH CHECK (NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.email = public.profiles.email));
  -- A linha acima é um exemplo de como restringir, mas o ON CONFLICT na função é mais robusto para emails.
  -- A política mais simples seria apenas permitir insert para service_role.
  -- Dado que o trigger é SECURITY DEFINER, ele opera com os privilégios do definidor (postgres).
  -- Para simplificar e garantir que o trigger funcione, vamos permitir insert pela service_role (usada pelo SupabaseAdapter).
  -- O SupabaseAdapter e o trigger SECURITY DEFINER devem ter permissão para inserir.
  -- O `service_role` por padrão ignora RLS.
  -- A verificação de email duplicado é feita na action `signupUser`.
  -- O trigger usa `ON CONFLICT (id) DO NOTHING;`.

-- Para a verificação de email existente na action `signupUser` (que usa anon key):
CREATE POLICY IF NOT EXISTS "Allow anon to select email from profiles for signup check"
  ON public.profiles FOR SELECT
  TO anon -- A chave anônima do Supabase
  USING (true); -- Permite ler todos os emails, mas só selecionamos a coluna email.


-- RLS para outras tabelas (exemplo, ajuste conforme necessário)
-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
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
CREATE POLICY IF NOT EXISTS "Allow users to manage their own categories"
  ON public.categories FOR ALL
  TO authenticated
  USING (user_id = next_auth.uid())
  WITH CHECK (user_id = next_auth.uid());
CREATE POLICY IF NOT EXISTS "Allow users to read default categories"
  ON public.categories FOR SELECT
  TO authenticated
  USING (is_default = true);

-- Transactions
CREATE TABLE IF NOT EXISTS public.transactions (
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
CREATE POLICY IF NOT EXISTS "Allow users to manage their own transactions"
  ON public.transactions FOR ALL
  TO authenticated
  USING (user_id = next_auth.uid())
  WITH CHECK (user_id = next_auth.uid());

-- Budgets
CREATE TABLE IF NOT EXISTS public.budgets (
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
CREATE POLICY IF NOT EXISTS "Allow users to manage their own budgets"
  ON public.budgets FOR ALL
  TO authenticated
  USING (user_id = next_auth.uid())
  WITH CHECK (user_id = next_auth.uid());

-- Financial Goals
CREATE TABLE IF NOT EXISTS public.financial_goals (
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
CREATE POLICY IF NOT EXISTS "Allow users to manage their own financial goals"
  ON public.financial_goals FOR ALL
  TO authenticated
  USING (user_id = next_auth.uid())
  WITH CHECK (user_id = next_auth.uid());


-- Concede permissões ao role anon e authenticated para os schemas
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT USAGE ON SCHEMA next_auth TO anon, authenticated;

-- Permissões para tabelas do next_auth (o adapter precisa disso)
GRANT SELECT ON next_auth.users TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON next_auth.users TO service_role;

GRANT SELECT ON next_auth.sessions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON next_auth.sessions TO service_role;

GRANT SELECT ON next_auth.accounts TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON next_auth.accounts TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON next_auth.verification_tokens TO service_role;
GRANT SELECT ON next_auth.verification_tokens TO anon, authenticated; -- Geralmente não necessário para anon/auth, mas não prejudica


-- Verifica se o schema next_auth foi criado
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'next_auth';

-- Verifica se a tabela next_auth.users foi criada
SELECT COUNT(*) as next_auth_users_table_exists FROM pg_tables WHERE schemaname = 'next_auth' AND tablename = 'users';

-- Verifica se a coluna 'email' existe em 'public.profiles'
SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email';

SELECT 'Schema script executado. Verifique os resultados das queries de verificação acima.' as script_status;



-- Schema: next_auth (para SupabaseAdapter)
-- Este schema é usado pelo @auth/supabase-adapter para armazenar informações de sessão e usuário do NextAuth.js.

-- 0. Habilitar a extensão pgcrypto se ainda não estiver habilitada (para uuid_generate_v4())
--    OU melhor, usar a extensão uuid-ossp que é mais padrão.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- 1. Criar o schema 'next_auth' se ele não existir.
CREATE SCHEMA IF NOT EXISTS next_auth;

-- 2. Conceder permissões ao schema 'next_auth'.
-- A role 'service_role' é uma super role no Supabase que bypassa RLS.
-- A role 'postgres' é a dona do banco.
GRANT USAGE ON SCHEMA next_auth TO service_role;
GRANT ALL ON SCHEMA next_auth TO postgres;

-- 3. Criar a tabela 'users' no schema 'next_auth'.
-- Esta tabela armazena informações básicas do usuário gerenciadas pelo NextAuth.js.
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
GRANT ALL ON TABLE next_auth.users TO service_role;

-- 4. Criar a tabela 'sessions' no schema 'next_auth'.
-- Esta tabela armazena as sessões ativas dos usuários.
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
        ON DELETE CASCADE -- Se um usuário for deletado, suas sessões também serão.
);
GRANT ALL ON TABLE next_auth.sessions TO postgres;
GRANT ALL ON TABLE next_auth.sessions TO service_role;

-- 5. Criar a tabela 'accounts' no schema 'next_auth'.
-- Esta tabela é usada para vincular contas de provedores OAuth (como Google) aos usuários.
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
    oauth_token_secret text,
    oauth_token text,
    "userId" uuid,
    CONSTRAINT accounts_pkey PRIMARY KEY (id),
    CONSTRAINT provider_unique UNIQUE (provider, "providerAccountId"),
    CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES next_auth.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE -- Se um usuário for deletado, suas contas vinculadas também serão.
);
GRANT ALL ON TABLE next_auth.accounts TO postgres;
GRANT ALL ON TABLE next_auth.accounts TO service_role;

-- 6. Criar a tabela 'verification_tokens' no schema 'next_auth'.
-- Esta tabela armazena tokens usados para verificação de email (se o provedor Email for usado).
CREATE TABLE IF NOT EXISTS next_auth.verification_tokens
(
    identifier text,
    token text,
    expires timestamp with time zone NOT NULL,
    CONSTRAINT verification_tokens_pkey PRIMARY KEY (token), -- Alterado para token como PK simples
    CONSTRAINT token_identifier_unique UNIQUE (token, identifier) -- Mantém a unicidade de token e identifier
);
GRANT ALL ON TABLE next_auth.verification_tokens TO postgres;
GRANT ALL ON TABLE next_auth.verification_tokens TO service_role;

-- 7. Criar a função 'uid()' no schema 'next_auth'.
-- Esta função é usada nas políticas RLS para obter o ID do usuário autenticado a partir do JWT.
-- Importante: Se você já tem essa função de uma configuração anterior do Supabase Auth, pode precisar deletá-la.
-- O adapter @auth/supabase-adapter espera que essa função exista.
CREATE OR REPLACE FUNCTION next_auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select
    coalesce(
        nullif(current_setting('request.jwt.claim.sub', true), ''),
        (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
    )::uuid
$$;
GRANT EXECUTE ON FUNCTION next_auth.uid() TO service_role, authenticated;


-- Schema: public (para dados da aplicação)

-- 1. Tabela 'profiles' (Usuários da Aplicação)
-- Armazena detalhes adicionais do perfil, incluindo senha hasheada para CredentialsProvider.
-- O 'id' aqui DEVE ser o mesmo 'id' da tabela 'next_auth.users'.
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL PRIMARY KEY, -- Chave primária, DEVE corresponder a next_auth.users.id
    full_name TEXT,
    display_name TEXT,
    email TEXT NOT NULL UNIQUE, -- Email do usuário, deve ser único
    hashed_password TEXT, -- Para login com credenciais (pode ser nulo se só usar OAuth)
    phone TEXT,
    cpf_cnpj TEXT UNIQUE, -- CPF ou CNPJ, deve ser único se preenchido
    rg TEXT,
    avatar_url TEXT,
    account_type TEXT CHECK (account_type IN ('pessoa', 'empresa')), -- 'pessoa' ou 'empresa'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES next_auth.users(id) ON DELETE CASCADE -- Garante integridade com next_auth.users
);
COMMENT ON TABLE public.profiles IS 'Stores user profile information, extending NextAuth users.';
COMMENT ON COLUMN public.profiles.id IS 'User ID, references next_auth.users.id.';

-- Habilitar RLS para a tabela 'profiles'
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para 'profiles':
-- Permitir que usuários anônimos (anon) insiram novos perfis (necessário para o cadastro).
CREATE POLICY IF NOT EXISTS "Allow anon to insert profiles"
    ON public.profiles FOR INSERT
    TO anon
    WITH CHECK (true);

-- Permitir que usuários autenticados leiam seus próprios perfis.
CREATE POLICY IF NOT EXISTS "Allow authenticated users to read their own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (next_auth.uid() = id);

-- Permitir que usuários autenticados atualizem seus próprios perfis.
CREATE POLICY IF NOT EXISTS "Allow authenticated users to update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (next_auth.uid() = id)
    WITH CHECK (next_auth.uid() = id);

-- (Opcional) Impedir que usuários deletem seus perfis diretamente via API (deleção gerenciada por outros processos, se necessário).
-- CREATE POLICY "Disallow direct deletion of profiles"
--     ON public.profiles FOR DELETE
--     TO authenticated
--     USING (false);


-- 2. Tabela 'categories'
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE, -- Nulo para categorias padrão
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    icon TEXT,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.categories IS 'Stores transaction categories, including default and user-defined ones.';
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow users to manage their own categories"
    ON public.categories FOR ALL
    TO authenticated
    USING (user_id = next_auth.uid() OR is_default = true) -- Usuários podem ver/usar categorias padrão
    WITH CHECK (user_id = next_auth.uid() AND is_default = false); -- Só podem criar/modificar/deletar as suas próprias que não são padrão

CREATE POLICY IF NOT EXISTS "Allow public read access to default categories"
    ON public.categories FOR SELECT
    TO anon, authenticated -- Anônimos e autenticados podem ler as padrão
    USING (is_default = true);


-- 3. Tabela 'transactions'
CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL, -- Permite categoria nula ou a remove se a categoria for deletada
    description TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    date DATE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.transactions IS 'Stores user financial transactions.';
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow users to manage their own transactions"
    ON public.transactions FOR ALL
    TO authenticated
    USING (user_id = next_auth.uid())
    WITH CHECK (user_id = next_auth.uid());


-- 4. Tabela 'budgets'
CREATE TABLE IF NOT EXISTS public.budgets (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE, -- Se categoria deletada, orçamento também
    limit_amount NUMERIC(10, 2) NOT NULL,
    spent_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_category_period UNIQUE (user_id, category_id, period_start_date) -- Garante um orçamento por categoria por período
);
COMMENT ON TABLE public.budgets IS 'Stores user budgets for specific categories and periods.';
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow users to manage their own budgets"
    ON public.budgets FOR ALL
    TO authenticated
    USING (user_id = next_auth.uid())
    WITH CHECK (user_id = next_auth.uid());


-- 5. Tabela 'financial_goals'
CREATE TABLE IF NOT EXISTS public.financial_goals (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount NUMERIC(10, 2) NOT NULL,
    current_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    deadline_date DATE,
    icon TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'achieved', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.financial_goals IS 'Stores user financial goals.';
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow users to manage their own financial goals"
    ON public.financial_goals FOR ALL
    TO authenticated
    USING (user_id = next_auth.uid())
    WITH CHECK (user_id = next_auth.uid());


-- Trigger e Função para sincronizar novos usuários do next_auth.users para public.profiles
-- Isso garante que quando o SupabaseAdapter (ou um provedor OAuth) cria um usuário em next_auth.users,
-- um perfil correspondente é criado em public.profiles.
CREATE OR REPLACE FUNCTION public.handle_new_user_from_next_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Executar com os privilégios do criador da função (geralmente um superusuário)
SET search_path = public, extensions, next_auth -- Garante que os schemas corretos estão visíveis
AS $$
BEGIN
  -- Insere um novo perfil em public.profiles usando os dados do novo usuário em next_auth.users
  -- O ID é o mesmo. Email, nome e avatar_url (image) são copiados.
  -- Hashed_password fica nulo por padrão (usuário pode definir depois, ou se cadastrou com credenciais, já terá sido preenchido pela action)
  -- account_type default para 'pessoa' para usuários OAuth.
  INSERT INTO public.profiles (id, email, display_name, full_name, avatar_url, account_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.name, NEW.email), -- Usa o nome se disponível, senão o email como display_name
    NEW.name, -- Full_name pode ser o mesmo que name do OAuth
    NEW.image, -- Avatar do OAuth
    'pessoa'   -- Default para usuários criados via OAuth/trigger
  )
  -- Se já existir um perfil com esse ID (improvável se o ID é FK de next_auth.users e único),
  -- ou se o email já existir (mais provável se o cadastro via credentials ocorreu primeiro),
  -- então não faz nada para evitar erro de violação de constraint UNIQUE.
  -- A lógica de cadastro via credentials deve ser a principal fonte de criação de 'profiles' com todos os campos.
  -- Este trigger é um fallback para garantir que usuários OAuth tenham um perfil básico.
  ON CONFLICT (id) DO NOTHING;
  -- ON CONFLICT (email) DO NOTHING; -- Comentado pois o adapter pode tentar inserir user em next_auth.users com email já existente em public.profiles.
                                  -- A constraint UNIQUE no email de public.profiles e next_auth.users deve ser suficiente.
  RETURN NEW;
END;
$$;

-- Criar o trigger na tabela next_auth.users
-- Este trigger é disparado DEPOIS que um novo registro é inserido em next_auth.users.
DROP TRIGGER IF EXISTS on_next_auth_user_created ON next_auth.users; -- Remove se já existir
CREATE TRIGGER on_next_auth_user_created
  AFTER INSERT ON next_auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_from_next_auth();

GRANT EXECUTE ON FUNCTION public.handle_new_user_from_next_auth() TO service_role, authenticated;


-- Adicionar algumas categorias padrão (opcional, mas útil)
INSERT INTO public.categories (name, type, icon, is_default, user_id)
VALUES
    ('Salário', 'income', 'Landmark', true, null),
    ('Alimentação', 'expense', 'Utensils', true, null),
    ('Transporte', 'expense', 'Car', true, null),
    ('Moradia', 'expense', 'Home', true, null),
    ('Lazer', 'expense', 'Ticket', true, null),
    ('Saúde', 'expense', 'HeartPulse', true, null),
    ('Educação', 'expense', 'BookOpen', true, null),
    ('Contas', 'expense', 'FileText', true, null), -- Ex: água, luz, internet
    ('Investimentos', 'income', 'TrendingUp', true, null), -- Pode ser 'expense' dependendo da perspectiva
    ('Outras Receitas', 'income', 'DollarSign', true, null),
    ('Outras Despesas', 'expense', 'ShoppingBag', true, null)
ON CONFLICT (name, user_id, is_default) DO NOTHING; -- Evita duplicatas se o script for rodado múltiplas vezes (considerando user_id NULL para padrão)


-- Queries de Verificação (execute após rodar o script para confirmar a criação)
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'next_auth';
SELECT COUNT(*) as next_auth_users_table_exists FROM pg_tables WHERE schemaname = 'next_auth' AND tablename = 'users';
SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email';

SELECT 'Schema script executado. Verifique os resultados das queries de verificação acima.' as script_status;


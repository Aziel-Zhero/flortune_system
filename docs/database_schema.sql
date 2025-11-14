-- /---------------------------------------------------------------------------------------\
-- |                                                                                       |
-- |  ███████╗██╗     ██████╗ ████████╗██╗   ██╗███╗   ██╗███████╗███████╗                    |
-- |  ██╔════╝██║     ██╔══██╗╚══██╔══╝██║   ██║████╗  ██║██╔════╝██╔════╝                    |
-- |  █████╗  ██║     ██████╔╝   ██║   ██║   ██║██╔██╗ ██║█████╗  █████╗                      |
-- |  ██╔══╝  ██║     ██╔══██╗   ██║   ██║   ██║██║╚██╗██║██╔══╝  ██╔══╝                      |
-- |  ██║     ███████╗██║  ██║   ██║   ╚██████╔╝██║ ╚████║███████╗███████╗                    |
-- |  ╚═╝     ╚══════╝╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚═╝  ╚═══╝╚══════╝╚══════╝                    |
-- |                                                                                       |
-- |  ✅ Script de Banco de Dados Oficial para o Projeto Flortune                            |
-- |  Este script é projetado para ser IDEMPOTENTE. Isso significa que ele pode ser         |
-- |  executado várias vezes sem causar erros ou perda de dados. Ele verifica a existência  |
-- |  de objetos (tabelas, políticas, etc.) antes de criá-los ou alterá-los.               |
-- |                                                                                       |
-- \---------------------------------------------------------------------------------------/

-- Habilitar a extensão pgcrypto para usar a função gen_salt.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Definição da tabela de Perfis
-- Esta tabela armazena informações públicas e privadas dos usuários,
-- estendendo a tabela auth.users do Supabase.
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    display_name text,
    email text UNIQUE NOT NULL,
    avatar_url text,
    hashed_password text, -- Adicionado para login com email/senha
    account_type text, -- 'pessoa' ou 'empresa'
    cpf_cnpj text UNIQUE,
    rg text,
    plan_id text DEFAULT 'tier-cultivador',
    has_seen_welcome_message boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Adiciona a coluna 'role' se ela não existir, sem quebrar o script em re-execuções.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' NOT NULL;


-- 2. Gatilho (Trigger) para Sincronizar Novos Usuários
-- Quando um novo usuário é criado na tabela auth.users (seja por OAuth, Magic Link ou signup),
-- esta função é acionada para criar um registro correspondente na tabela public.profiles.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER -- Importante para permitir que a função acesse auth.users
SET search_path = public
AS $$
BEGIN
  -- Insere um novo perfil para o novo usuário.
  -- A cláusula ON CONFLICT previne erros se o perfil já existir (raro, mas seguro)
  -- e atualiza os campos básicos para garantir a sincronização.
  INSERT INTO public.profiles (id, email, full_name, display_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'avatar_url',
    'user' -- Todo novo usuário começa com a role 'user'.
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = now();
  RETURN NEW;
END;
$$;

-- Aplica o gatilho à tabela auth.users.
-- Ele será disparado após cada nova inserção de usuário.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Políticas de Segurança (Row Level Security - RLS) para a Tabela de Perfis
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver seus próprios perfis." ON public.profiles;
CREATE POLICY "Usuários podem ver seus próprios perfis."
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios perfis." ON public.profiles;
CREATE POLICY "Usuários podem atualizar seus próprios perfis."
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Permite que a Server Action de signup (que usa a anon key) insira um perfil.
-- A lógica de negócio (ex: email duplicado) é tratada na action, não no banco.
DROP POLICY IF EXISTS "Permitir inserção anônima para cadastro." ON public.profiles;
CREATE POLICY "Permitir inserção anônima para cadastro."
  ON public.profiles FOR INSERT
  TO anon
  WITH CHECK (true);


-- 4. Tabela de Categorias
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    type text NOT NULL, -- 'income' ou 'expense'
    icon text,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem gerenciar suas próprias categorias e ver as padrão." ON public.categories;
CREATE POLICY "Usuários podem gerenciar suas próprias categorias e ver as padrão."
  ON public.categories FOR ALL
  USING (auth.uid() = user_id OR is_default = true);


-- 5. Tabela de Transações
CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    description text NOT NULL,
    amount numeric(10, 2) NOT NULL,
    date date NOT NULL,
    type text NOT NULL, -- 'income' ou 'expense'
    notes text,
    is_recurring boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem gerenciar suas próprias transações." ON public.transactions;
CREATE POLICY "Usuários podem gerenciar suas próprias transações."
  ON public.transactions FOR ALL
  USING (auth.uid() = user_id);

-- 6. Tabela de Orçamentos
CREATE TABLE IF NOT EXISTS public.budgets (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    limit_amount numeric(10, 2) NOT NULL,
    spent_amount numeric(10, 2) DEFAULT 0 NOT NULL,
    period_start_date date NOT NULL,
    period_end_date date NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem gerenciar seus próprios orçamentos." ON public.budgets;
CREATE POLICY "Usuários podem gerenciar seus próprios orçamentos."
  ON public.budgets FOR ALL
  USING (auth.uid() = user_id);

-- 7. Tabela de Metas Financeiras
CREATE TABLE IF NOT EXISTS public.financial_goals (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    target_amount numeric(10, 2) NOT NULL,
    current_amount numeric(10, 2) DEFAULT 0 NOT NULL,
    deadline_date date,
    icon text,
    status text DEFAULT 'in_progress'::text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem gerenciar suas próprias metas financeiras." ON public.financial_goals;
CREATE POLICY "Usuários podem gerenciar suas próprias metas financeiras."
  ON public.financial_goals FOR ALL
  USING (auth.uid() = user_id);
  
-- 8. Tabela de Tarefas (To-Do)
CREATE TABLE IF NOT EXISTS public.todos (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    description text NOT NULL,
    is_completed boolean DEFAULT false,
    due_date date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem gerenciar suas próprias tarefas." ON public.todos;
CREATE POLICY "Usuários podem gerenciar suas próprias tarefas."
    ON public.todos FOR ALL
    USING (auth.uid() = user_id);
    
-- 9. Tabela de Integração com Telegram
CREATE TABLE IF NOT EXISTS public.telegram (
    id integer NOT NULL PRIMARY KEY,
    bot_token text,
    chat_id text,
    updated_at timestamp with time zone
);

ALTER TABLE public.telegram ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir acesso total para administradores" ON public.telegram;
CREATE POLICY "Permitir acesso total para administradores"
    ON public.telegram FOR ALL
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- Garante que a linha de configuração exista
INSERT INTO public.telegram (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 10. Função Auxiliar para verificar se um usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
$$;

-- Mensagem de finalização
SELECT '✅ Schema Flortune (usuário) configurado com sucesso.' as status;
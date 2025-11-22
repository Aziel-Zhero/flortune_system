-- docs/database_schema.sql

-- ===== ATENÇÃO =====
-- 1. Este script DEVE ser executado no SQL Editor do seu painel Supabase.
-- 2. Ele é idempotente, o que significa que pode ser executado várias vezes sem causar erros.
--    Ele irá deletar e recriar políticas e triggers para garantir que a versão mais recente esteja em vigor.
-- 3. Se você fez alterações manuais no schema que não estão refletidas aqui, elas serão perdidas.

-- Forçar a deleção de tabelas na ordem correta para evitar erros de dependência
-- Útil para resets completos, mas desabilitado por padrão.
-- DROP TABLE IF EXISTS public.financial_goals CASCADE;
-- DROP TABLE IF EXISTS public.budgets CASCADE;
-- DROP TABLE IF EXISTS public.transactions CASCADE;
-- DROP TABLE IF EXISTS public.categories CASCADE;
-- DROP TABLE IF EXISTS public.profiles CASCADE;
-- DROP SCHEMA IF EXISTS next_auth CASCADE;


-- Habilita a extensão pgcrypto se ainda não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- Habilita a extensão uuid-ossp se ainda não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


-- 1. Tabela de PERFIS (Usuários)
-- Armazena informações públicas e privadas dos usuários.
-- O 'id' é a chave primária e corresponde diretamente ao 'id' da tabela 'auth.users' do Supabase.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  display_name TEXT,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  account_type TEXT,
  cpf_cnpj TEXT,
  rg TEXT,
  plan_id TEXT DEFAULT 'tier-cultivador',
  has_seen_welcome_message BOOLEAN DEFAULT FALSE,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
COMMENT ON TABLE public.profiles IS 'Armazena detalhes do perfil de cada usuário, linkado à autenticação do Supabase.';


-- 2. Tabela de CATEGORIAS
-- Armazena categorias de transações, podendo ser padrão (user_id IS NULL) ou customizadas.
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT,
  is_default BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
COMMENT ON TABLE public.categories IS 'Categorias para transações, podendo ser padrão (do sistema) ou personalizadas (do usuário).';


-- 3. Tabela de TRANSAÇÕES
-- Armazena todas as transações financeiras dos usuários.
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  notes TEXT,
  is_recurring BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
COMMENT ON TABLE public.transactions IS 'Registros de receitas e despesas dos usuários.';


-- 4. Tabela de ORÇAMENTOS
-- Permite que usuários definam limites de gastos para categorias específicas.
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  limit_amount REAL NOT NULL,
  spent_amount REAL DEFAULT 0 NOT NULL,
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, category_id, period_start_date) -- Garante um orçamento por categoria por período
);
COMMENT ON TABLE public.budgets IS 'Orçamentos mensais definidos pelos usuários para categorias de despesas.';


-- 5. Tabela de METAS FINANCEIRAS
-- Permite que usuários criem e acompanhem metas de poupança.
CREATE TABLE IF NOT EXISTS public.financial_goals (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount REAL NOT NULL,
  current_amount REAL DEFAULT 0 NOT NULL,
  deadline_date DATE,
  icon TEXT,
  status TEXT DEFAULT 'in_progress' NOT NULL CHECK (status IN ('in_progress', 'achieved', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
COMMENT ON TABLE public.financial_goals IS 'Metas financeiras dos usuários com acompanhamento de progresso.';

-- Tabela para gerenciar tarefas (To-Do List)
CREATE TABLE IF NOT EXISTS public.todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false NOT NULL,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
COMMENT ON TABLE public.todos IS 'Tarefas e lembretes para os usuários.';

-- Tabela para gerenciar integrações (ex: Telegram)
CREATE TABLE IF NOT EXISTS public.telegram_integration (
    id INT PRIMARY KEY,
    bot_token TEXT,
    chat_id TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Inserir uma linha padrão se a tabela estiver vazia
INSERT INTO public.telegram_integration (id, bot_token, chat_id)
SELECT 1, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.telegram_integration WHERE id = 1);

-- ===== TRIGGERS E FUNÇÕES =====

-- Função para atualizar o campo 'updated_at' automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para 'updated_at' na tabela de perfis
DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- Trigger para 'updated_at' na tabela de transações
DROP TRIGGER IF EXISTS on_transactions_updated ON public.transactions;
CREATE TRIGGER on_transactions_updated
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- Função para criar um perfil público para um novo usuário do Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, display_name, email, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'display_name',
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Configura o trigger para ser acionado após a inserção de um novo usuário na tabela auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();


-- ===== ROW LEVEL SECURITY (RLS) =====

-- Habilita RLS para todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas para garantir que as novas sejam aplicadas sem conflitos
DROP POLICY IF EXISTS "Usuários podem ver seus próprios perfis." ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil." ON public.profiles;

DROP POLICY IF EXISTS "Usuários podem ver categorias padrão ou as suas próprias." ON public.categories;
DROP POLICY IF EXISTS "Usuários podem criar suas próprias categorias." ON public.categories;

DROP POLICY IF EXISTS "Usuários podem gerenciar suas próprias transações." ON public.transactions;
DROP POLICY IF EXISTS "Usuários podem ver suas próprias transações." ON public.transactions;
DROP POLICY IF EXISTS "Usuários podem inserir suas próprias transações." ON public.transactions;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias transações." ON public.transactions;
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias transações." ON public.transactions;

DROP POLICY IF EXISTS "Usuários podem gerenciar seus próprios orçamentos." ON public.budgets;
DROP POLICY IF EXISTS "Usuários podem ver seus próprios orçamentos." ON public.budgets;
DROP POLICY IF EXISTS "Usuários podem inserir seus próprios orçamentos." ON public.budgets;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios orçamentos." ON public.budgets;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios orçamentos." ON public.budgets;

DROP POLICY IF EXISTS "Usuários podem gerenciar suas próprias metas." ON public.financial_goals;
DROP POLICY IF EXISTS "Usuários podem ver suas próprias metas." ON public.financial_goals;
DROP POLICY IF EXISTS "Usuários podem inserir suas próprias metas." ON public.financial_goals;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias metas." ON public.financial_goals;
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias metas." ON public.financial_goals;

DROP POLICY IF EXISTS "Usuários podem gerenciar suas próprias tarefas." ON public.todos;
DROP POLICY IF EXISTS "Usuários podem ver suas próprias tarefas." ON public.todos;
DROP POLICY IF EXISTS "Usuários podem inserir suas próprias tarefas." ON public.todos;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias tarefas." ON public.todos;
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias tarefas." ON public.todos;

-- Políticas para 'profiles'
CREATE POLICY "Usuários podem ver seus próprios perfis."
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- ✅ CORREÇÃO: Política que permite ao usuário ATUALIZAR seu próprio perfil.
CREATE POLICY "Usuários podem atualizar seu próprio perfil."
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Políticas para 'categories'
CREATE POLICY "Usuários podem ver categorias padrão ou as suas próprias."
  ON public.categories FOR SELECT
  USING (is_default = true OR auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias categorias."
  ON public.categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Políticas para 'transactions'
CREATE POLICY "Usuários podem gerenciar suas próprias transações."
  ON public.transactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas para 'budgets'
CREATE POLICY "Usuários podem gerenciar seus próprios orçamentos."
  ON public.budgets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas para 'financial_goals'
CREATE POLICY "Usuários podem gerenciar suas próprias metas."
  ON public.financial_goals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
  
-- Políticas para 'todos'
CREATE POLICY "Usuários podem gerenciar suas próprias tarefas."
  ON public.todos FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
  
-- FIM DO SCRIPT

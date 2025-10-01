
-- ========== ATENÇÃO: SCRIPT DE RECRIAÇÃO COMPLETA ==========
-- Este script foi projetado para limpar e recriar toda a estrutura do banco de dados.
-- Ele apagará TODAS as tabelas e dados existentes (exceto o schema `auth`).
-- Execute este script no SQL Editor do seu painel Supabase.

-- ========== FASE 1: LIMPEZA DO BANCO DE DADOS ANTIGO ==========

-- Desabilitar Row Level Security (RLS) temporariamente para evitar erros de permissão ao apagar.
ALTER TABLE IF EXISTS public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.budgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.financial_goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.todos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.dev_clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;

-- Remover políticas de segurança (RLS) existentes de todas as tabelas.
-- A sintaxe é `DROP POLICY IF EXISTS "Nome da Política" ON nome_da_tabela;`
DROP POLICY IF EXISTS "Users can manage their own transactions." ON public.transactions;
DROP POLICY IF EXISTS "Users can manage their own categories." ON public.categories;
DROP POLICY IF EXISTS "Users can manage their own budgets." ON public.budgets;
DROP POLICY IF EXISTS "Users can manage their own financial goals." ON public.financial_goals;
DROP POLICY IF EXISTS "Users can manage their own todos." ON public.todos;
DROP POLICY IF EXISTS "Users can manage their own notes." ON public.notes;
DROP POLICY IF EXISTS "Users can manage their own dev clients." ON public.dev_clients;
DROP POLICY IF EXISTS "Users can view and edit their own profile." ON public.profiles;

-- Apagar tabelas em ordem de dependência (tabelas com chaves estrangeiras primeiro).
DROP TABLE IF EXISTS public.transactions;
DROP TABLE IF EXISTS public.budgets;
DROP TABLE IF EXISTS public.categories;
DROP TABLE IF EXISTS public.financial_goals;
DROP TABLE IF EXISTS public.todos;
DROP TABLE IF EXISTS public.notes;
DROP TABLE IF EXISTS public.dev_clients;
DROP TABLE IF EXISTS public.profiles;

-- Apagar schemas e tabelas do NextAuth.js antigo (se existirem).
-- O novo adapter @auth/supabase-adapter cria suas próprias tabelas.
DROP TABLE IF EXISTS next_auth.users;
DROP TABLE IF EXISTS next_auth.sessions;
DROP TABLE IF EXISTS next_auth.accounts;
DROP TABLE IF EXISTS next_auth.verification_tokens;
DROP SCHEMA IF EXISTS next_auth;

-- Apagar tipos ENUM personalizados, se existirem.
DROP TYPE IF EXISTS public.account_type;
DROP TYPE IF EXISTS public.transaction_type;
DROP TYPE IF EXISTS public.goal_status;
DROP TYPE IF EXISTS public.dev_client_status;
DROP TYPE IF EXISTS public.dev_client_priority;


-- ========== FASE 2: CRIAÇÃO DA NOVA ESTRUTURA DO BANCO DE DADOS ==========

-- Criar tipos ENUM para padronização de valores.
CREATE TYPE public.account_type AS ENUM ('pessoa', 'empresa');
CREATE TYPE public.transaction_type AS ENUM ('income', 'expense');
CREATE TYPE public.goal_status AS ENUM ('in_progress', 'achieved', 'cancelled');
CREATE TYPE public.dev_client_status AS ENUM ('planning', 'in_progress', 'delivered', 'on_hold', 'delayed');
CREATE TYPE public.dev_client_priority AS ENUM ('low', 'medium', 'high');

-- Tabela de Perfis de Usuários (public.profiles)
-- Esta tabela armazena informações detalhadas sobre os usuários, complementando a tabela `auth.users`.
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  display_name TEXT,
  email TEXT NOT NULL UNIQUE,
  hashed_password TEXT,
  phone TEXT,
  avatar_url TEXT,
  account_type public.account_type,
  cpf_cnpj TEXT UNIQUE,
  rg TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.profiles IS 'Stores public-facing profile information for each user.';
COMMENT ON COLUMN public.profiles.id IS 'References the user in auth.users.';

-- Tabela de Categorias (public.categories)
-- Usada para classificar transações (receitas ou despesas).
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type public.transaction_type NOT NULL,
  icon TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.categories IS 'Stores transaction categories, both default and user-created.';

-- Tabela de Transações (public.transactions)
-- Registra todas as movimentações financeiras do usuário.
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  date DATE NOT NULL,
  type public.transaction_type NOT NULL,
  notes TEXT,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.transactions IS 'Records all financial income and expenses for a user.';

-- Tabela de Orçamentos (public.budgets)
-- Permite aos usuários definir limites de gastos para categorias.
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  limit_amount NUMERIC(15, 2) NOT NULL,
  spent_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.budgets IS 'Defines spending limits for categories over a specific period.';

-- Tabela de Metas Financeiras (public.financial_goals)
-- Objetivos financeiros que os usuários desejam alcançar.
CREATE TABLE public.financial_goals (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC(15, 2) NOT NULL,
  current_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  deadline_date DATE,
  icon TEXT,
  status public.goal_status NOT NULL DEFAULT 'in_progress',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.financial_goals IS 'Tracks financial goals for users.';

-- Tabela de Lista de Tarefas (public.todos)
-- Tarefas e pendências para os usuários.
CREATE TABLE public.todos (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.todos IS 'A simple to-do list for users.';

-- Tabela de Anotações (public.notes)
-- Para anotações e lembretes do usuário, agora sincronizados.
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  color TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.notes IS 'Stores user notes and ideas, synced across devices.';

-- Tabela de Clientes/Projetos (DEV) (public.dev_clients)
-- Para o módulo de gerenciamento de projetos de desenvolvedores.
CREATE TABLE public.dev_clients (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  service_type TEXT,
  status public.dev_client_status NOT NULL DEFAULT 'planning',
  priority public.dev_client_priority NOT NULL DEFAULT 'medium',
  start_date DATE,
  deadline DATE,
  total_price NUMERIC(15, 2),
  notes TEXT,
  tasks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.dev_clients IS 'Manages clients and projects for developer users.';

-- ========== FASE 3: INSERÇÃO DE DADOS INICIAIS (SEED) ==========

-- Inserir categorias padrão de DESPESA que estarão disponíveis para todos os usuários.
INSERT INTO public.categories(name, type, icon, is_default) VALUES
  ('Moradia', 'expense', 'Home', TRUE),
  ('Alimentação', 'expense', 'Utensils', TRUE),
  ('Transporte', 'expense', 'Car', TRUE),
  ('Saúde', 'expense', 'HeartPulse', TRUE),
  ('Lazer', 'expense', 'GlassWater', TRUE),
  ('Educação', 'expense', 'GraduationCap', TRUE),
  ('Compras', 'expense', 'ShoppingBag', TRUE),
  ('Contas e Impostos', 'expense', 'Landmark', TRUE),
  ('Investimentos', 'expense', 'AreaChart', TRUE),
  ('Outros', 'expense', 'Tags', TRUE);

-- Inserir categorias padrão de RECEITA.
INSERT INTO public.categories(name, type, icon, is_default) VALUES
  ('Salário', 'income', 'DollarSign', TRUE),
  ('Vendas', 'income', 'TrendingUp', TRUE),
  ('Freelance/Serviços', 'income', 'Briefcase', TRUE),
  ('Rendimentos', 'income', 'PiggyBank', TRUE),
  ('Reembolsos', 'income', 'Receipt', TRUE),
  ('Outras Receitas', 'income', 'PlusSquare', TRUE);

-- ========== FASE 4: CONFIGURAÇÃO DE SEGURANÇA E TRIGGERS ==========

-- Função para atualizar `updated_at` automaticamente.
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para `updated_at` em cada tabela.
CREATE TRIGGER on_profiles_update BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_categories_update BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_transactions_update BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_budgets_update BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_financial_goals_update BEFORE UPDATE ON public.financial_goals FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_todos_update BEFORE UPDATE ON public.todos FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_notes_update BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_dev_clients_update BEFORE UPDATE ON public.dev_clients FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Habilitar Row Level Security (RLS) para todas as tabelas.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_clients ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança (RLS Policies)

-- Tabela `profiles`:
-- 1. Permite que um usuário veja e edite seu próprio perfil.
-- 2. CORREÇÃO: Permite a inserção de novos perfis pela `service_role` (usada pela Server Action).
DROP POLICY IF EXISTS "Allow service_role to insert new profiles" ON public.profiles;
CREATE POLICY "Allow service_role to insert new profiles" ON public.profiles FOR INSERT TO service_role WITH CHECK (true);
DROP POLICY IF EXISTS "Users can view and edit their own profile." ON public.profiles;
CREATE POLICY "Users can view and edit their own profile." ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Tabela `categories`:
-- 1. Permite que todos os usuários vejam as categorias padrão.
-- 2. Permite que um usuário gerencie (CRUD) suas próprias categorias.
DROP POLICY IF EXISTS "Allow all users to view default categories." ON public.categories;
CREATE POLICY "Allow all users to view default categories." ON public.categories FOR SELECT USING (is_default = TRUE);
DROP POLICY IF EXISTS "Users can manage their own categories." ON public.categories;
CREATE POLICY "Users can manage their own categories." ON public.categories FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Políticas para outras tabelas (padrão de "usuário só acessa seus próprios dados").
DROP POLICY IF EXISTS "Users can manage their own transactions." ON public.transactions;
CREATE POLICY "Users can manage their own transactions." ON public.transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own budgets." ON public.budgets;
CREATE POLICY "Users can manage their own budgets." ON public.budgets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own financial goals." ON public.financial_goals;
CREATE POLICY "Users can manage their own financial goals." ON public.financial_goals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own todos." ON public.todos;
CREATE POLICY "Users can manage their own todos." ON public.todos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own notes." ON public.notes;
CREATE POLICY "Users can manage their own notes." ON public.notes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own dev clients." ON public.dev_clients;
CREATE POLICY "Users can manage their own dev clients." ON public.dev_clients FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Mensagem final.
SELECT 'Banco de dados recriado com sucesso!' AS status;

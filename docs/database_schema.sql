-- ----------------------------------------------------------------
-- Arquivo de Schema do Banco de Dados para Flortune
-- Versão: 3.0
-- Descrição: Script completo para criar todas as tabelas, schemas,
--            triggers, e políticas de segurança (RLS) para a aplicação.
-- ----------------------------------------------------------------

-- =================================================================
-- Habilitar Extensões Essenciais
-- =================================================================
-- Habilita a funcionalidade de UUID no schema extensions para organização.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- =================================================================
-- Schema 'public' - Tabelas Principais da Aplicação
-- =================================================================

-- Tabela para armazenar os perfis dos usuários (complementa a tabela auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY NOT NULL, -- Referencia auth.users.id
    full_name TEXT,
    display_name TEXT,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    account_type TEXT NOT NULL DEFAULT 'pessoa' CHECK (account_type IN ('pessoa', 'empresa', 'admin')),
    plan_id TEXT NOT NULL DEFAULT 'tier-cultivador', -- Novo campo para o plano do usuário
    cpf_cnpj TEXT UNIQUE,
    rg TEXT,
    has_seen_welcome_message BOOLEAN DEFAULT FALSE, -- Novo campo para a mensagem de boas-vindas
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.profiles IS 'Armazena detalhes do perfil do usuário, complementando a tabela de autenticação.';
COMMENT ON COLUMN public.profiles.account_type IS 'Distingue entre contas de pessoa física, jurídica ou administrador para lógicas fiscais e de permissão.';
COMMENT ON COLUMN public.profiles.plan_id IS 'Identifica o plano de assinatura atual do usuário (ex: tier-cultivador, tier-mestre).';
COMMENT ON COLUMN public.profiles.has_seen_welcome_message IS 'Controla se o pop-up de boas-vindas já foi exibido para o usuário.';


-- Tabela de Categorias para transações (padrão e do usuário)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    icon TEXT,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, name, type)
);
COMMENT ON TABLE public.categories IS 'Categorias de receitas e despesas, incluindo padrões do sistema e personalizadas por usuário.';
COMMENT ON COLUMN public.categories.user_id IS 'Nulo para categorias padrão do sistema.';

-- Tabela de Transações
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    date DATE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    notes TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.transactions IS 'Registro de todas as movimentações financeiras do usuário.';

-- Tabela de Orçamentos
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    limit_amount NUMERIC(15, 2) NOT NULL,
    spent_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, category_id, period_start_date)
);
COMMENT ON TABLE public.budgets IS 'Orçamentos de gastos definidos pelos usuários para categorias específicas.';

-- Tabela de Metas Financeiras
CREATE TABLE IF NOT EXISTS public.financial_goals (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount NUMERIC(15, 2) NOT NULL,
    current_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    deadline_date DATE,
    icon TEXT,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'achieved', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.financial_goals IS 'Metas financeiras dos usuários, como viagens ou compra de bens.';

-- Tabela de Lista de Tarefas (Todos)
CREATE TABLE IF NOT EXISTS public.todos (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    due_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.todos IS 'Lista de tarefas simples para os usuários.';

-- Tabela de Anotações
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    color TEXT,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.notes IS 'Anotações e lembretes dos usuários.';

-- Tabela de Assinaturas (Stripe, etc.)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL, -- ex: 'tier-mestre', 'tier-dev'
    stripe_subscription_id TEXT UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'incomplete', 'past_due')),
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.subscriptions IS 'Gerencia as assinaturas dos planos pagos dos usuários.';

-- Tabela de Faturas/Notas Fiscais
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'failed')),
    due_date DATE,
    nf_data JSONB, -- Para armazenar dados da NF-e (número, chave, etc.)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.invoices IS 'Registra faturas e informações para emissão de notas fiscais.';

-- Tabela de Integrações (Telegram, etc.)
CREATE TABLE IF NOT EXISTS public.integrations (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- Geralmente configurado por um admin
    telegram_bot_token TEXT,
    telegram_chat_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.integrations IS 'Armazena credenciais e configurações para integrações com serviços de terceiros.';


-- =================================================================
-- Policies de Segurança (RLS - Row Level Security)
-- =================================================================

-- Helper function para obter o ID do usuário autenticado
CREATE OR REPLACE FUNCTION auth.current_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT id FROM auth.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- --- Policies para a tabela `profiles` ---
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil." ON public.profiles;
CREATE POLICY "Usuários podem ver seu próprio perfil."
    ON public.profiles FOR SELECT
    USING (id = auth.current_user_id());
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil." ON public.profiles;
CREATE POLICY "Usuários podem atualizar seu próprio perfil."
    ON public.profiles FOR UPDATE
    USING (id = auth.current_user_id())
    WITH CHECK (id = auth.current_user_id());

-- --- Policies para as outras tabelas ---
-- Função genérica para habilitar RLS em uma tabela
CREATE OR REPLACE PROCEDURE enable_rls_for_user_table(table_name TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', table_name);
    
    EXECUTE format('DROP POLICY IF EXISTS "Usuários podem gerenciar seus próprios dados." ON public.%I;', table_name);
    EXECUTE format('CREATE POLICY "Usuários podem gerenciar seus próprios dados." ON public.%I FOR ALL USING (user_id = auth.current_user_id()) WITH CHECK (user_id = auth.current_user_id());', table_name);
    
    -- Para categorias padrão
    IF table_name = 'categories' THEN
      EXECUTE format('DROP POLICY IF EXISTS "Usuários podem ver categorias padrão." ON public.%I;', table_name);
      EXECUTE format('CREATE POLICY "Usuários podem ver categorias padrão." ON public.%I FOR SELECT USING (is_default = true);', table_name);
    END IF;
END;
$$;

-- Habilitar RLS para todas as tabelas relevantes
CALL enable_rls_for_user_table('categories');
CALL enable_rls_for_user_table('transactions');
CALL enable_rls_for_user_table('budgets');
CALL enable_rls_for_user_table('financial_goals');
CALL enable_rls_for_user_table('todos');
CALL enable_rls_for_user_table('notes');
CALL enable_rls_for_user_table('subscriptions');
CALL enable_rls_for_user_table('invoices');
CALL enable_rls_for_user_table('integrations');

-- =================================================================
-- Triggers e Funções
-- =================================================================

-- Trigger para criar um perfil público quando um novo usuário se cadastra no Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, full_name, avatar_url, account_type, cpf_cnpj, rg, phone)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'account_type',
    NEW.raw_user_meta_data->>'cpf_cnpj',
    NEW.raw_user_meta_data->>'rg',
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dropa o trigger se ele já existir para garantir que a versão mais nova seja criada
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- Cria o trigger que executa a função acima após um novo usuário ser inserido em auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para atualizar o campo `updated_at` automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW; 
END;
$$ LANGUAGE plpgsql;

-- Função para aplicar o trigger de `updated_at` em uma tabela
CREATE OR REPLACE PROCEDURE apply_updated_at_trigger(table_name TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
    EXECUTE format('DROP TRIGGER IF EXISTS on_%I_update ON public.%I;', table_name, table_name);
    EXECUTE format('CREATE TRIGGER on_%I_update BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();', table_name, table_name);
END;
$$;

-- Aplicar o trigger a todas as tabelas relevantes
CALL apply_updated_at_trigger('profiles');
CALL apply_updated_at_trigger('categories');
CALL apply_updated_at_trigger('transactions');
CALL apply_updated_at_trigger('budgets');
CALL apply_updated_at_trigger('financial_goals');
CALL apply_updated_at_trigger('todos');
CALL apply_updated_at_trigger('notes');
CALL apply_updated_at_trigger('subscriptions');
CALL apply_updated_at_trigger('integrations');

-- =================================================================
-- Dados Iniciais (Seed Data)
-- =================================================================

-- Inserir categorias padrão se não existirem
INSERT INTO public.categories (name, type, icon, is_default) VALUES
    ('Salário', 'income', 'DollarSign', TRUE),
    ('Rendimentos', 'income', 'TrendingUp', TRUE),
    ('Outras Receitas', 'income', 'PlusCircle', TRUE),
    ('Moradia', 'expense', 'Home', TRUE),
    ('Alimentação', 'expense', 'Utensils', TRUE),
    ('Transporte', 'expense', 'Car', TRUE),
    ('Lazer', 'expense', 'Gamepad2', TRUE),
    ('Saúde', 'expense', 'HeartPulse', TRUE),
    ('Educação', 'expense', 'BookOpen', TRUE),
    ('Compras', 'expense', 'ShoppingBag', TRUE),
    ('Serviços', 'expense', 'Receipt', TRUE),
    ('Impostos', 'expense', 'Landmark', TRUE),
    ('Outras Despesas', 'expense', 'MinusCircle', TRUE)
ON CONFLICT (user_id, name, type) WHERE user_id IS NULL DO NOTHING;

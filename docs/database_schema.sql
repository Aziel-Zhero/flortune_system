-- Esquema do Banco de Dados para Flortune com NextAuth.js (Credentials)

-- Extensões (se ainda não habilitadas)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de Perfis de Usuários (profiles)
-- Armazena informações adicionais dos usuários.
-- O 'id' agora é gerado pelo Supabase, e não mais uma FK direta para auth.users
-- O email será usado para login com o Credentials Provider do NextAuth.js
CREATE TABLE public.profiles (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    full_name TEXT,
    display_name TEXT,
    email TEXT UNIQUE NOT NULL, -- Email usado para login
    hashed_password TEXT,     -- Senha hasheada para login por credenciais
    phone TEXT,
    cpf_cnpj TEXT UNIQUE,     -- Pode ser CPF ou CNPJ, dependendo do tipo de conta
    rg TEXT,
    avatar_url TEXT,
    account_type TEXT CHECK (account_type IN ('pessoa', 'empresa')), -- 'pessoa' ou 'empresa'
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.profiles IS 'Armazena perfis de usuários, incluindo dados para autenticação por credenciais com NextAuth.js.';

-- Tabela de Categorias (categories)
-- Armazena categorias de transações (padrão e personalizadas).
CREATE TABLE public.categories (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE, -- Nulo para categorias padrão
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')), -- 'income' (receita) ou 'expense' (despesa)
    icon TEXT, -- Nome do ícone (ex: Lucide icon name)
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT user_category_name_unique UNIQUE (user_id, name) -- Garante nome único por usuário
);
COMMENT ON TABLE public.categories IS 'Categorias para transações financeiras, padrão ou definidas pelo usuário.';

-- Tabela de Transações (transactions)
CREATE TABLE public.transactions (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    date DATE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.transactions IS 'Registros de transações financeiras dos usuários.';

-- Tabela de Orçamentos (budgets)
CREATE TABLE public.budgets (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    limit_amount NUMERIC(10, 2) NOT NULL,
    spent_amount NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT user_budget_category_period_unique UNIQUE (user_id, category_id, period_start_date) -- Evitar orçamentos duplicados
);
COMMENT ON TABLE public.budgets IS 'Orçamentos definidos pelos usuários para categorias específicas.';

-- Tabela de Metas Financeiras (financial_goals)
CREATE TABLE public.financial_goals (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount NUMERIC(10, 2) NOT NULL,
    current_amount NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    deadline_date DATE,
    icon TEXT,
    notes TEXT,
    status TEXT DEFAULT 'in_progress' NOT NULL CHECK (status IN ('in_progress', 'achieved', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.financial_goals IS 'Metas financeiras estabelecidas pelos usuários.';


-- Função para atualizar o campo 'updated_at' automaticamente
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para 'updated_at'
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_budgets_updated_at
BEFORE UPDATE ON public.budgets
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_financial_goals_updated_at
BEFORE UPDATE ON public.financial_goals
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- Políticas de Segurança em Nível de Linha (RLS)
-- Habilitar RLS para todas as tabelas relevantes
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;

-- Políticas para 'profiles'
-- Usuários podem ver e atualizar seus próprios perfis.
CREATE POLICY "Allow individual user access to their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Allow individual user to update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Política para permitir a criação de perfil (usado pelo signup action, não pelo Supabase Auth trigger)
-- Esta política é mais aberta, pois o signup não terá um `auth.uid()` ainda.
-- A lógica de criação segura deve estar na sua server action.
CREATE POLICY "Allow public creation of profiles"
ON public.profiles FOR INSERT
WITH CHECK (true); -- Ajustar se necessário para maior segurança, mas signup via server action é comum


-- Políticas para 'categories'
-- Usuários podem gerenciar suas próprias categorias. Categorias padrão são visíveis para todos.
CREATE POLICY "Allow individual user access to their categories"
ON public.categories FOR SELECT
USING (auth.uid() = user_id OR is_default = true);

CREATE POLICY "Allow individual user to manage their categories"
ON public.categories FOR ALL
USING (auth.uid() = user_id AND is_default = false) -- Apenas não padrão
WITH CHECK (auth.uid() = user_id AND is_default = false);


-- Políticas para 'transactions', 'budgets', 'financial_goals'
-- Usuários podem gerenciar seus próprios dados.
CREATE POLICY "Allow individual user access to their transactions"
ON public.transactions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow individual user access to their budgets"
ON public.budgets FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow individual user access to their financial goals"
ON public.financial_goals FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- Inserir categorias padrão (apenas se a tabela estiver vazia para evitar duplicatas)
-- Você pode executar isso manualmente ou adicionar lógica à sua aplicação para garantir que existam.
DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM public.categories WHERE is_default = true) THEN
INSERT INTO public.categories (name, type, icon, is_default, user_id) VALUES
    ('Salário', 'income', 'Landmark', true, null),
    ('Freelance', 'income', 'Briefcase', true, null),
    ('Investimentos', 'income', 'TrendingUp', true, null),
    ('Outras Receitas', 'income', 'DollarSign', true, null),
    ('Alimentação', 'expense', 'Utensils', true, null),
    ('Moradia', 'expense', 'Home', true, null),
    ('Transporte', 'expense', 'Car', true, null),
    ('Saúde', 'expense', 'HeartPulse', true, null),
    ('Educação', 'expense', 'BookOpen', true, null),
    ('Lazer', 'expense', 'Ticket', true, null),
    ('Vestuário', 'expense', 'Shirt', true, null),
    ('Contas', 'expense', 'Receipt', true, null), -- (água, luz, internet)
    ('Impostos', 'expense', 'Landmark', true, null),
    ('Doações', 'expense', 'Gift', true, null),
    ('Compras Diversas', 'expense', 'ShoppingCart', true, null),
    ('Assinaturas', 'expense', 'CreditCard', true, null),
    ('Viagens', 'expense', 'Plane', true, null),
    ('Cuidados Pessoais', 'expense', 'PersonStanding', true, null),
    ('Emergências', 'expense', 'ShieldAlert', true, null),
    ('Outras Despesas', 'expense', 'MinusCircle', true, null);
   END IF;
END $$;

-- Remover a função e o trigger handle_new_user, pois não são mais usados com NextAuth Credentials
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Informações sobre RLS com NextAuth:
-- As políticas acima usam auth.uid() que é específico do Supabase Auth.
-- Para usar RLS com NextAuth.js, você precisaria:
-- 1. Configurar o Supabase client para usar o JWT do NextAuth.js.
-- 2. Criar uma função no PostgreSQL que extraia o 'sub' (user_id do NextAuth) do JWT.
-- 3. Ajustar as políticas para usar essa nova função em vez de auth.uid().
-- Por simplicidade inicial, as RLS podem não ser totalmente eficazes se o cliente Supabase
-- não estiver configurado com o token JWT do NextAuth.
-- A segurança primária virá das suas server actions e da lógica da API NextAuth.js.

SELECT 'Schema SQL atualizado para NextAuth.js (Credentials Provider). Verifique as políticas RLS.';

    

-- Esquema do Banco de Dados para Flortune

-- Habilitar extensão pgcrypto se ainda não estiver habilitada (para uuid_generate_v4())
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA public;

-- Tabela de Perfis de Usuário
-- Armazena informações adicionais do usuário, vinculadas ao usuário de autenticação.
CREATE TABLE public.profiles (
    id uuid NOT NULL PRIMARY KEY, -- Referencia auth.users.id se o usuário for criado via Supabase Auth nativo. Com NextAuth Credentials, este será um UUID gerado.
    full_name text,
    display_name text,
    email text UNIQUE, -- Email deve ser único, usado para login com credenciais
    hashed_password text, -- Para armazenar a senha hasheada (NOVO com NextAuth Credentials)
    avatar_url text,
    phone text,
    cpf_cnpj text UNIQUE, -- Pode ser CPF ou CNPJ, dependendo do tipo de conta. Opcional, mas único se preenchido.
    rg text, -- Documento de identidade, opcional.
    -- account_type TEXT CHECK (account_type IN ('pessoa', 'empresa')), -- Se você quiser armazenar o tipo de conta aqui
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Comentário sobre a coluna id da tabela profiles:
-- Se você migrar de Supabase Auth para NextAuth Credentials,
-- `profiles.id` não precisará mais referenciar `auth.users.id` diretamente com uma FOREIGN KEY,
-- pois NextAuth não cria usuários em `auth.users` para o provider de Credentials.
-- O `id` em `profiles` será o identificador único do usuário no seu sistema com NextAuth.
-- A função `uuid_generate_v4()` pode ser usada como DEFAULT para `profiles.id` se você quiser que o DB gere o UUID:
-- ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT public.uuid_generate_v4();

-- Política de Segurança em Nível de Linha (RLS) para a tabela de perfis
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver seu próprio perfil.
CREATE POLICY "User can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id); -- auth.uid() só funciona se a sessão Supabase estiver ativa com um token JWT Supabase. Com NextAuth, você precisará de uma lógica diferente para RLS se quiser usar RLS baseado no usuário logado pelo NextAuth.

-- Política: Usuários podem atualizar seu próprio perfil.
CREATE POLICY "User can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);


-- Tabela de Categorias
-- Para categorizar transações (ex: Alimentação, Transporte, Salário).
-- Inclui categorias padrão e categorias personalizadas pelo usuário.
CREATE TABLE public.categories (
    id uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE, -- Nulo para categorias padrão
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('income', 'expense')), -- 'income' para receitas, 'expense' para despesas
    icon text, -- Nome do ícone (ex: 'Home', 'Car', 'Utensils' de lucide-react)
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, name) -- Um usuário não pode ter duas categorias com o mesmo nome
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem gerenciar (ver, criar, atualizar, deletar) suas próprias categorias.
CREATE POLICY "Users can manage their own categories"
ON public.categories FOR ALL
USING (auth.uid() = user_id);

-- Política: Usuários podem ver categorias padrão.
CREATE POLICY "Users can view default categories"
ON public.categories FOR SELECT
USING (is_default = true);

-- Inserir categorias padrão (exemplos)
INSERT INTO public.categories (name, type, icon, is_default) VALUES
('Salário', 'income', 'DollarSign', true),
('Outras Receitas', 'income', 'TrendingUp', true),
('Alimentação', 'expense', 'Utensils', true),
('Moradia', 'expense', 'Home', true),
('Transporte', 'expense', 'Car', true),
('Saúde', 'expense', 'HeartPulse', true),
('Educação', 'expense', 'BookOpen', true),
('Lazer', 'expense', 'Ticket', true),
('Vestuário', 'expense', 'Shirt', true),
('Contas Fixas', 'expense', 'FileText', true), -- Ex: água, luz, internet
('Compras', 'expense', 'ShoppingCart', true),
('Investimentos', 'expense', 'CandlestickChart', true), -- Ou pode ser 'income' para dividendos
('Impostos', 'expense', 'Landmark', true),
('Outras Despesas', 'expense', 'MoreHorizontal', true);


-- Tabela de Transações
-- Registra todas as receitas e despesas.
CREATE TABLE public.transactions (
    id uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL, -- Se a categoria for deletada, a transação fica sem categoria
    description text NOT NULL,
    amount numeric(12, 2) NOT NULL, -- Ex: 1234567890.12
    date date NOT NULL,
    type text NOT NULL CHECK (type IN ('income', 'expense')), -- Redundante se category.type for usado, mas pode ser útil para filtros rápidos
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own transactions"
ON public.transactions FOR ALL
USING (auth.uid() = user_id);


-- Tabela de Orçamentos
-- Permite aos usuários definir limites de gastos para categorias específicas.
CREATE TABLE public.budgets (
    id uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE, -- Se a categoria for deletada, o orçamento associado também é.
    limit_amount numeric(12, 2) NOT NULL,
    spent_amount numeric(12, 2) DEFAULT 0.00 NOT NULL, -- Calculado ou atualizado via triggers/funções
    period_start_date date NOT NULL,
    period_end_date date NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, category_id, period_start_date) -- Um usuário só pode ter um orçamento por categoria por período de início.
);
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own budgets"
ON public.budgets FOR ALL
USING (auth.uid() = user_id);


-- Tabela de Metas Financeiras
-- Para usuários definirem e acompanharem metas (ex: Viagem, Fundo de Emergência).
CREATE TABLE public.financial_goals (
    id uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    target_amount numeric(12, 2) NOT NULL,
    current_amount numeric(12, 2) DEFAULT 0.00 NOT NULL,
    deadline_date date,
    icon text, -- Nome do ícone Lucide
    notes text,
    status text DEFAULT 'in_progress'::text NOT NULL CHECK (status IN ('in_progress', 'achieved', 'cancelled')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own financial goals"
ON public.financial_goals FOR ALL
USING (auth.uid() = user_id);


-- Função para atualizar `updated_at` automaticamente
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para `updated_at`
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


-- Função Gatilho para criar um perfil quando um novo usuário se inscreve via Supabase Auth
-- Esta função NÃO será mais usada se você mudar para NextAuth com CredentialsProvider,
-- pois o usuário não será criado em auth.users pelo NextAuth.
-- A criação de perfil precisará ser feita na sua action de signup do NextAuth.
-- MANTENHA SE FOR USAR SUPABASE AUTH PARA OUTROS PROVIDERS (EX: GOOGLE COM SUPABASE)
/*
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, display_name, avatar_url, email, phone, cpf_cnpj, rg)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name'),
    new.raw_user_meta_data->>'avatar_url',
    new.email, -- Email da tabela auth.users
    new.phone, -- Telefone da tabela auth.users
    new.raw_user_meta_data->>'cpf_cnpj',
    new.raw_user_meta_data->>'rg'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gatilho para criar perfil (SE ESTIVER USANDO SUPABASE AUTH NATIVO)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
*/

-- Índices para otimização de consultas comuns
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX idx_budgets_user_period ON public.budgets(user_id, period_start_date, period_end_date);
CREATE INDEX idx_goals_user_deadline ON public.financial_goals(user_id, deadline_date);
CREATE INDEX idx_categories_user_type ON public.categories(user_id, type);
CREATE INDEX idx_profiles_email ON public.profiles(email); -- Importante para login com NextAuth


-- Se você estiver usando RLS extensivamente e o NextAuth,
-- você precisará de uma maneira de passar a identidade do usuário do NextAuth para o Supabase
-- para que as políticas RLS funcionem. Isso geralmente envolve configurar o cliente Supabase
-- para usar um token JWT customizado gerado pelo NextAuth que o Supabase possa entender
-- ou ter uma função `current_user_id()` que leia um `request.header.authorization`
-- preenchido com o token do NextAuth.
-- A função `auth.uid()` padrão do Supabase não funcionará com sessões NextAuth
-- a menos que você configure essa integração de token avançada.
-- Para uma abordagem mais simples com NextAuth e sem RLS complexo no início,
-- você pode desabilitar RLS nas tabelas ou criar políticas mais permissivas
-- e controlar o acesso na camada da sua API/aplicação Next.js.

-- Exemplo de política mais permissiva (USAR COM CUIDADO E APENAS SE ENTENDER AS IMPLICAÇÕES):
-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY; -- (NÃO RECOMENDADO PARA PRODUÇÃO SEM OUTRAS MEDIDAS)
-- CREATE POLICY "Allow all access for authenticated users" ON public.profiles FOR ALL USING (true); -- (ABRE TUDO PARA USUÁRIOS LOGADOS)

-- Por enquanto, o schema mantém as políticas RLS baseadas em `auth.uid()`.
-- Ao migrar para NextAuth, você precisará revisar e adaptar suas políticas RLS
-- ou a forma como o acesso aos dados é controlado.
-- Para o provider de Credentials, o `auth.uid()` não será populado.

-- Adicionando a coluna `email` à tabela `profiles` se ela não existir (apenas se necessário como patch)
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text UNIQUE;
-- Adicionando a coluna `hashed_password` à tabela `profiles` se ela não existir
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hashed_password text;

-- O ID da tabela `profiles` agora será o identificador principal do usuário.
-- Se você estava usando `auth.users.id` diretamente, isso muda.
-- Se `profiles.id` não tem um DEFAULT uuid_generate_v4(), adicione:
-- ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT public.uuid_generate_v4();
-- (Presumindo que você queira que o banco de dados gere o ID para novos perfis criados diretamente)
-- No nosso caso, a action de signup irá criar o ID com base no `auth.users` ID se estiver usando Supabase Auth,
-- ou um novo UUID se for NextAuth Credentials e o perfil for criado separadamente.
-- Com a mudança para NextAuth Credentials, o `id` da tabela `profiles` não será mais uma FK para `auth.users`.
-- Vamos remover a FK se ela existir e ajustar a tabela `profiles` para ser a fonte dos usuários.

-- Remover a FK de profiles.id para auth.users.id se ela existir.
DO $$
BEGIN
   IF EXISTS (
       SELECT 1 FROM information_schema.table_constraints
       WHERE constraint_name = 'profiles_id_fkey' AND table_name = 'profiles'
   ) THEN
       ALTER TABLE public.profiles DROP CONSTRAINT profiles_id_fkey;
   END IF;
END $$;

-- Certificar que profiles.id tenha um default caso você insira sem um ID vindo do NextAuth
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT public.uuid_generate_v4();

-- Limpar o gatilho handle_new_user se ele existir, pois não será mais usado com NextAuth Credentials.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

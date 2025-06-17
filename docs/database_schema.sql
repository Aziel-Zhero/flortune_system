
-- Remover RLS policies antigas da tabela profiles, se existirem.
DROP POLICY IF EXISTS "Allow authenticated users to read their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Allow users to insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for anon and authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for anon users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.profiles;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.profiles;

-- Habilitar a extensão pgcrypto se ainda não estiver habilitada (para uuid_generate_v4())
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

-- Tabela de Perfis de Usuário
-- Removida a dependência de auth.users e adicionado hashed_password.
DROP TABLE IF EXISTS profiles CASCADE;
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT,
  display_name TEXT,
  email TEXT NOT NULL UNIQUE,
  hashed_password TEXT NOT NULL, -- Campo para senha hasheada
  phone TEXT,
  cpf_cnpj TEXT UNIQUE, -- CPF para pessoa, CNPJ para empresa
  rg TEXT, -- RG apenas para pessoa
  avatar_url TEXT,
  account_type TEXT CHECK (account_type IN ('pessoa', 'empresa')), -- 'pessoa' ou 'empresa'
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Categorias
DROP TABLE IF EXISTS categories CASCADE;
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- Pode ser NULL para categorias padrão
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')), -- 'income' ou 'expense'
  icon TEXT, -- Nome do ícone (ex: 'Home', 'Car')
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, name) -- Um usuário não pode ter categorias com o mesmo nome
);

-- Tabela de Transações
DROP TABLE IF EXISTS transactions CASCADE;
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL, -- Se a categoria for deletada, manter a transação
  description TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')), -- Redundante com category.type mas útil para queries diretas
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Orçamentos
DROP TABLE IF EXISTS budgets CASCADE;
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  limit_amount NUMERIC(10, 2) NOT NULL,
  spent_amount NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, category_id, period_start_date) -- Evitar orçamentos duplicados para mesma categoria e período
);

-- Tabela de Metas Financeiras
DROP TABLE IF EXISTS financial_goals CASCADE;
CREATE TABLE financial_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC(10, 2) NOT NULL,
  current_amount NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
  deadline_date DATE,
  icon TEXT, -- Nome do ícone
  notes TEXT,
  status TEXT DEFAULT 'in_progress' NOT NULL CHECK (status IN ('in_progress', 'achieved', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Políticas de RLS (Row Level Security)
-- Simplificadas para permitir leitura e escrita para anon (para NextAuth/Server Actions)
-- **AVISO: Estas políticas são permissivas e devem ser revisadas para produção.**

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Allow users to insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (true); -- Simplificado para cadastro NextAuth

CREATE POLICY "Allow users to update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() IS NOT NULL AND id = auth.uid()) -- Se quiser que o usuário logado só altere o seu
  WITH CHECK (auth.uid() IS NOT NULL AND id = auth.uid());
  -- Para NextAuth, a verificação de ID será feita na Server Action, aqui podemos ser mais permissivos se necessário para anon
  -- OU, manter mais restrito e as Server Actions precisariam rodar com privilégios de service_role ou impersonate.
  -- Por agora, para o update via NextAuth, a lógica da action que fará a validação de `session.user.id === profile_id`.
  -- A RLS aqui poderia ser (true) se a action sempre validar. Mas para UserNav e outros, auth.uid() é mais seguro.
  -- Temporariamente para resolver o problema do usuário, vamos ser mais permissivos no UPDATE também:
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
CREATE POLICY "Allow authenticated users to update their own profile" ON public.profiles
  FOR UPDATE USING (true); -- Simplificado; a lógica da action DEVE verificar o user_id

-- Categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage their own categories" ON public.categories
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid()) -- Usuário logado pode ver suas categorias
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid()); -- Usuário logado pode criar/modificar suas categorias
CREATE POLICY "Allow read access to default categories" ON public.categories
  FOR SELECT USING (is_default = TRUE);
-- Para anon e NextAuth (se necessário para criação de transação com categoria):
DROP POLICY IF EXISTS "Allow users to manage their own categories" ON public.categories;
DROP POLICY IF EXISTS "Allow read access to default categories" ON public.categories;
CREATE POLICY "Allow public read access to categories" ON public.categories
  FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to insert categories" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());


-- Transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage their own transactions" ON public.transactions
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid())
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
-- Para anon e NextAuth:
DROP POLICY IF EXISTS "Allow users to manage their own transactions" ON public.transactions;
CREATE POLICY "Allow users to manage their own transactions (NextAuth)" ON public.transactions
  FOR ALL USING (true); -- Simplificado; a lógica da action DEVE verificar o user_id


-- Budgets
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage their own budgets" ON public.budgets
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid())
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
-- Para anon e NextAuth:
DROP POLICY IF EXISTS "Allow users to manage their own budgets" ON public.budgets;
CREATE POLICY "Allow users to manage their own budgets (NextAuth)" ON public.budgets
  FOR ALL USING (true); -- Simplificado; a lógica da action DEVE verificar o user_id


-- Financial Goals
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage their own financial_goals" ON public.financial_goals
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid())
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
-- Para anon e NextAuth:
DROP POLICY IF EXISTS "Allow users to manage their own financial_goals" ON public.financial_goals;
CREATE POLICY "Allow users to manage their own financial_goals (NextAuth)" ON public.financial_goals
  FOR ALL USING (true); -- Simplificado; a lógica da action DEVE verificar o user_id


-- Função para atualizar 'updated_at' automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para 'updated_at'
CREATE TRIGGER on_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_budgets_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_financial_goals_updated_at BEFORE UPDATE ON public.financial_goals FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Inserir categorias padrão (apenas se não existirem)
-- As RLS precisam permitir que o usuário que roda isso (provavelmente o `postgres` ou `anon` se for por script client-side no setup) insira.
-- Ou, se for rodar manualmente no painel Supabase, estará como superusuário.
DO $$
DECLARE
  default_categories TEXT[] := ARRAY[
    'Alimentação', 'Supermercado', 'Restaurantes', 'Transporte', 'Moradia', 'Aluguel', 'Contas', 'Saúde', 
    'Educação', 'Lazer', 'Entretenimento', 'Compras', 'Vestuário', 'Salário', 'Investimentos', 'Outras Receitas', 'Outras Despesas'
  ];
  category_name TEXT;
  category_type TEXT;
BEGIN
  FOREACH category_name IN ARRAY default_categories
  LOOP
    IF category_name IN ('Salário', 'Investimentos', 'Outras Receitas') THEN
      category_type := 'income';
    ELSE
      category_type := 'expense';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.categories WHERE name = category_name AND is_default = TRUE) THEN
      INSERT INTO public.categories (name, type, icon, is_default, user_id)
      VALUES (category_name, category_type, 
        CASE category_name 
          WHEN 'Alimentação' THEN 'UtensilsCrossed'
          WHEN 'Supermercado' THEN 'ShoppingCart'
          WHEN 'Restaurantes' THEN 'CupSoda'
          WHEN 'Transporte' THEN 'Car'
          WHEN 'Moradia' THEN 'Home'
          WHEN 'Aluguel' THEN 'KeyRound'
          WHEN 'Contas' THEN 'ReceiptText'
          WHEN 'Saúde' THEN 'Stethoscope'
          WHEN 'Educação' THEN 'GraduationCap'
          WHEN 'Lazer' THEN 'PartyPopper'
          WHEN 'Entretenimento' THEN 'Ticket'
          WHEN 'Compras' THEN 'ShoppingBag'
          WHEN 'Vestuário' THEN 'Shirt'
          WHEN 'Salário' THEN 'Landmark'
          WHEN 'Investimentos' THEN 'TrendingUp'
          ELSE 'Landmark' 
        END, 
        TRUE, NULL);
    END IF;
  END LOOP;
END $$;

-- Grant usage on schema public to anon, authenticated if not already granted
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant all privileges on all tables in public schema to anon, authenticated roles
-- **AVISO: Isso é muito permissivo e geralmente não é recomendado para produção sem RLS mais estritas.**
-- **Para desenvolvimento e para garantir que NextAuth/Server Actions funcionem sem problemas de RLS inicialmente, pode ser usado.**
-- **Posteriormente, as RLS devem ser revisadas para serem mais específicas.**
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Re-enable RLS that might have been disabled by blanket grants (Supabase might do this automatically)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;

-- Re-apply simplified RLS policies (AFTER blanket grants which might remove them)
-- Profiles
CREATE POLICY "Profiles are publicly viewable." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (true); -- For NextAuth sign up
CREATE POLICY "Users can update their own profile." ON profiles FOR UPDATE USING (true) WITH CHECK (true); -- For NextAuth profile update

-- Categories
CREATE POLICY "Categories are publicly viewable." ON categories FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert categories." ON categories FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
CREATE POLICY "Users can update their own non-default categories." ON categories FOR UPDATE USING (auth.uid() IS NOT NULL AND user_id = auth.uid() AND is_default = FALSE) WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid() AND is_default = FALSE);
CREATE POLICY "Users can delete their own non-default categories." ON categories FOR DELETE USING (auth.uid() IS NOT NULL AND user_id = auth.uid() AND is_default = FALSE);

-- Transactions
CREATE POLICY "Users can manage their own transactions." ON transactions FOR ALL USING (auth.uid() IS NOT NULL AND user_id = auth.uid()) WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
-- Para NextAuth e Server Actions que podem rodar como anon ou service_role dependendo da config:
DROP POLICY IF EXISTS "Users can manage their own transactions." ON public.transactions;
CREATE POLICY "Allow full access to transactions (to be refined by app logic)" ON public.transactions FOR ALL USING (true) WITH CHECK (true);


-- Budgets
CREATE POLICY "Users can manage their own budgets." ON budgets FOR ALL USING (auth.uid() IS NOT NULL AND user_id = auth.uid()) WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
DROP POLICY IF EXISTS "Users can manage their own budgets." ON public.budgets;
CREATE POLICY "Allow full access to budgets (to be refined by app logic)" ON public.budgets FOR ALL USING (true) WITH CHECK (true);

-- Financial Goals
CREATE POLICY "Users can manage their own financial goals." ON financial_goals FOR ALL USING (auth.uid() IS NOT NULL AND user_id = auth.uid()) WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
DROP POLICY IF EXISTS "Users can manage their own financial goals." ON public.financial_goals;
CREATE POLICY "Allow full access to financial_goals (to be refined by app logic)" ON public.financial_goals FOR ALL USING (true) WITH CHECK (true);

-- Grant select on specific tables to anon and authenticated roles if specific grants are preferred over blanket
-- GRANT SELECT ON public.profiles TO anon;
-- GRANT SELECT ON public.profiles TO authenticated;
-- GRANT SELECT ON public.categories TO anon;
-- GRANT SELECT ON public.categories TO authenticated;
-- etc. for other tables and operations.


-- Adicionar a coluna 'provider' à tabela 'profiles' para OAuth futuro
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS provider TEXT;
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS provider_id TEXT;
-- CREATE UNIQUE INDEX IF NOT EXISTS provider_provider_id_idx ON public.profiles (provider, provider_id);

-- Comentário final: A segurança de RLS é crucial. As políticas acima
-- foram simplificadas para facilitar o desenvolvimento inicial com NextAuth (server-side).
-- Para produção, revise CADA política para garantir o princípio do menor privilégio.
-- A lógica nas suas Server Actions e API routes DEVE SEMPRE validar a propriedade dos dados
-- usando o ID do usuário da sessão NextAuth.

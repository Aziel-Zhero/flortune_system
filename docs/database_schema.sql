-- docs/database_schema.sql

-- Habilitar a extensão pgcrypto se ainda não estiver habilitada (para uuid_generate_v4())
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

-- Tabela de Perfis de Usuário
-- Armazena informações públicas e privadas do perfil.
DROP TABLE IF EXISTS public.profiles CASCADE;
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Chave primária usando UUID gerado automaticamente
  full_name TEXT,
  display_name TEXT,
  email TEXT NOT NULL UNIQUE,
  hashed_password TEXT NOT NULL, -- Senha hasheada para NextAuth Credentials
  phone TEXT,
  cpf_cnpj TEXT UNIQUE, -- CPF ou CNPJ, dependendo do tipo de conta
  rg TEXT,              -- RG, para pessoa física
  avatar_url TEXT,
  account_type TEXT CHECK (account_type IN ('pessoa', 'empresa')), -- Tipo de conta
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.profiles IS 'Stores user profile information, including data for NextAuth.js authentication.';
COMMENT ON COLUMN public.profiles.id IS 'Unique identifier for the user profile.';
COMMENT ON COLUMN public.profiles.email IS 'User''s email, must be unique. Used for login.';
COMMENT ON COLUMN public.profiles.hashed_password IS 'Hashed password for credential-based authentication.';
COMMENT ON COLUMN public.profiles.account_type IS 'Type of account: ''pessoa'' (individual) or ''empresa'' (company).';

-- Habilitar Row Level Security (RLS) para a tabela de perfis
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para a tabela de perfis:
-- ATENÇÃO: As políticas abaixo são MUITO PERMISSIVAS e destinam-se APENAS
-- para fins de desenvolvimento e avaliação para contornar rapidamente problemas de RLS.
-- EM UM AMBIENTE DE PRODUÇÃO, VOCÊ DEVE CRIAR POLÍTICAS MAIS RESTRITIVAS.
DROP POLICY IF EXISTS "Allow all access for anon (TEMPORARY DEV/EVAL)" ON public.profiles;
CREATE POLICY "Allow all access for anon (TEMPORARY DEV/EVAL)"
  ON public.profiles FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access for authenticated (TEMPORARY DEV/EVAL)" ON public.profiles;
CREATE POLICY "Allow all access for authenticated (TEMPORARY DEV/EVAL)"
  ON public.profiles FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Função para atualizar o campo 'updated_at' automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar 'updated_at' na tabela 'profiles'
DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Tabela de Categorias
-- Armazena categorias de transações (padrão e definidas pelo usuário).
DROP TABLE IF EXISTS public.categories CASCADE;
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- Nulo para categorias padrão
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')), -- 'income' ou 'expense'
  icon TEXT, -- Nome do ícone (ex: Lucide icon name)
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.categories IS 'Stores transaction categories, including default and user-defined ones.';
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
-- Políticas RLS para categories (Exemplo - AJUSTAR CONFORME NECESSÁRIO)
CREATE POLICY "Allow public read access to default categories" ON public.categories FOR SELECT USING (is_default = TRUE);
CREATE POLICY "Allow individual access to their own categories" ON public.categories FOR ALL USING (user_id = (SELECT auth.uid())); -- auth.uid() é específico do Supabase Auth. Ajustar se necessário para NextAuth.
CREATE POLICY "Allow anon all for dev (TEMPORARY CATEGORIES)" ON public.categories FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated all for dev (TEMPORARY CATEGORIES)" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- Tabela de Transações
DROP TABLE IF EXISTS public.transactions CASCADE;
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL, -- Ex: 12 dígitos no total, 2 casas decimais
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.transactions IS 'Stores individual financial transactions.';
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
-- Políticas RLS para transactions (Exemplo - AJUSTAR CONFORME NECESSÁRIO)
CREATE POLICY "Allow individual access to their own transactions" ON public.transactions FOR ALL USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Allow anon all for dev (TEMPORARY TRANSACTIONS)" ON public.transactions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated all for dev (TEMPORARY TRANSACTIONS)" ON public.transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- Tabela de Orçamentos
DROP TABLE IF EXISTS public.budgets CASCADE;
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  limit_amount NUMERIC(12, 2) NOT NULL,
  spent_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_budget_period_category UNIQUE (user_id, category_id, period_start_date, period_end_date)
);
COMMENT ON TABLE public.budgets IS 'Stores user-defined budgets for specific categories and periods.';
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
-- Políticas RLS para budgets (Exemplo - AJUSTAR CONFORME NECESSÁRIO)
CREATE POLICY "Allow individual access to their own budgets" ON public.budgets FOR ALL USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Allow anon all for dev (TEMPORARY BUDGETS)" ON public.budgets FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated all for dev (TEMPORARY BUDGETS)" ON public.budgets FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- Tabela de Metas Financeiras
DROP TABLE IF EXISTS public.financial_goals CASCADE;
CREATE TABLE public.financial_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC(12, 2) NOT NULL,
  current_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  deadline_date DATE,
  icon TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'achieved', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.financial_goals IS 'Stores user''s financial goals and tracks their progress.';
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
-- Políticas RLS para financial_goals (Exemplo - AJUSTAR CONFORME NECESSÁRIO)
CREATE POLICY "Allow individual access to their own financial goals" ON public.financial_goals FOR ALL USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Allow anon all for dev (TEMPORARY GOALS)" ON public.financial_goals FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated all for dev (TEMPORARY GOALS)" ON public.financial_goals FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- Triggers para 'updated_at'
DROP TRIGGER IF EXISTS on_categories_updated ON public.categories;
CREATE TRIGGER on_categories_updated BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
DROP TRIGGER IF EXISTS on_transactions_updated ON public.transactions;
CREATE TRIGGER on_transactions_updated BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
DROP TRIGGER IF EXISTS on_budgets_updated ON public.budgets;
CREATE TRIGGER on_budgets_updated BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
DROP TRIGGER IF EXISTS on_financial_goals_updated ON public.financial_goals;
CREATE TRIGGER on_financial_goals_updated BEFORE UPDATE ON public.financial_goals FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Inserir categorias padrão (se aplicável, e se user_id pode ser nulo para padrão)
-- Certifique-se que a FK para user_id em categories permite nulos se for o caso.
-- INSERT INTO public.categories (name, type, icon, is_default) VALUES
-- ('Salário', 'income', 'Landmark', TRUE),
-- ('Alimentação', 'expense', 'Utensils', TRUE),
-- ('Transporte', 'expense', 'Car', TRUE),
-- ('Moradia', 'expense', 'Home', TRUE),
-- ('Lazer', 'expense', 'Gamepad2', TRUE),
-- ('Saúde', 'expense', 'HeartPulse', TRUE),
-- ('Educação', 'expense', 'BookOpen', TRUE),
-- ('Outras Receitas', 'income', 'DollarSign', TRUE),
-- ('Outras Despesas', 'expense', 'Receipt', TRUE);

-- Nota: As políticas RLS acima que usam `(SELECT auth.uid())` são específicas do Supabase Auth.
-- Se estiver usando NextAuth como o único provedor de identidade, você precisará
-- ajustar essas políticas ou gerenciar o acesso no nível da aplicação/API,
-- especialmente para operações de escrita, baseando-se no ID do usuário obtido da sessão NextAuth.
-- As políticas temporárias "Allow anon all for dev" são para facilitar o desenvolvimento inicial.

INSERT INTO public.categories (name, type, icon, is_default, user_id) VALUES
('Salário', 'income', 'Landmark', TRUE, NULL),
('Alimentação', 'expense', 'Utensils', TRUE, NULL),
('Transporte', 'expense', 'Car', TRUE, NULL),
('Moradia', 'expense', 'Home', TRUE, NULL),
('Lazer', 'expense', 'Gamepad2', TRUE, NULL),
('Saúde', 'expense', 'HeartPulse', TRUE, NULL),
('Educação', 'expense', 'BookOpen', TRUE, NULL),
('Investimentos', 'income', 'TrendingUp', TRUE, NULL),
('Presentes', 'expense', 'Gift', TRUE, NULL),
('Assinaturas', 'expense', 'Youtube', TRUE, NULL),
('Cuidados Pessoais', 'expense', 'PersonStanding', TRUE, NULL),
('Impostos', 'expense', 'Landmark', TRUE, NULL), -- Reutilizando Landmark para impostos
('Empréstimos', 'expense', 'BadgePercent', TRUE, NULL),
('Seguros', 'expense', 'ShieldCheck', TRUE, NULL),
('Doações', 'expense', 'HeartHandshake', TRUE, NULL),
('Animais de Estimação', 'expense', 'Dog', TRUE, NULL),
('Viagens', 'expense', 'Plane', TRUE, NULL),
('Outras Receitas', 'income', 'DollarSign', TRUE, NULL),
('Outras Despesas', 'expense', 'Receipt', TRUE, NULL);
SELECT COUNT(*) FROM public.categories WHERE is_default = TRUE;
SELECT * FROM public.categories WHERE is_default = TRUE;

-- Verificar se a função de atualização de timestamp existe
SELECT routine_name FROM information_schema.routines
WHERE routine_type = 'FUNCTION' AND specific_schema = 'public' AND routine_name = 'handle_updated_at';

-- Verificar se os triggers existem
SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'profiles' AND trigger_name = 'on_profiles_updated';
-- Adicione verificações para outros triggers de forma similar


-- Grant usage on schema public to postgres and anon, authenticated
GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant all privileges on all tables in schema public to postgres
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;

-- Grant select, insert, update, delete on all tables in schema public to anon and authenticated (temporarily for dev)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant all privileges on all sequences in schema public to postgres
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;


SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Example of how you might want to restrict SELECT for anon in production for profiles:
-- This is commented out because the temporary broad policy is active.
-- DROP POLICY IF EXISTS "Allow anon email check for signup" ON public.profiles;
-- CREATE POLICY "Allow anon email check for signup"
--   ON public.profiles FOR SELECT TO anon
--   USING (true); -- Still broad, but better than ALL. Ideally, you'd use an RPC function.

-- Example of how you might restrict INSERT for anon in production for profiles:
-- DROP POLICY IF EXISTS "Allow anon profile creation for signup" ON public.profiles;
-- CREATE POLICY "Allow anon profile creation for signup"
--   ON public.profiles FOR INSERT TO anon
--   WITH CHECK (
--     -- Add validation checks here, e.g., for email format, password strength (if passed to DB), etc.
--     -- For example, ensure account_type is valid if it's passed directly.
--     account_type IN ('pessoa', 'empresa')
--   );

-- Example of RLS for authenticated users (using Supabase JWT `sub` claim as user ID)
-- These are illustrative and assume your NextAuth JWT `sub` claim matches `profiles.id`
-- OR you configure Supabase to accept NextAuth JWTs.
-- For a simpler NextAuth-only setup, access control is often done more in application logic
-- based on the user ID from the NextAuth session.

-- DROP POLICY IF EXISTS "Allow individual read access" ON public.profiles;
-- CREATE POLICY "Allow individual read access"
--   ON public.profiles FOR SELECT
--   TO authenticated
--   USING (id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid);

-- DROP POLICY IF EXISTS "Allow individual update access" ON public.profiles;
-- CREATE POLICY "Allow individual update access"
--   ON public.profiles FOR UPDATE
--   TO authenticated
--   USING (id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid)
--   WITH CHECK (id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid);

-- For other tables (categories, transactions, budgets, financial_goals), similar specific policies
-- would be needed in production, e.g.:
-- CREATE POLICY "Users can CRUD their own categories" ON public.categories
--   FOR ALL TO authenticated
--   USING (user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid)
--   WITH CHECK (user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid);
-- And so on for other tables.
-- Default categories might have a SELECT policy for all authenticated users:
-- CREATE POLICY "Authenticated users can read default categories" ON public.categories
--   FOR SELECT TO authenticated
--   USING (is_default = TRUE);
```

-- ### SCHEMA: next_auth ###
-- Este schema é gerenciado pelo SupabaseAdapter do NextAuth.js.
-- As tabelas (users, accounts, sessions, verification_token) são criadas automaticamente pelo adapter.
-- É crucial expor este schema na API do Supabase.
-- Vá para Project Settings > API > Exposed schemas e adicione "next_auth".

-- ### EXTENSIONS ###
-- Habilita a geração de UUIDs.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- ### SCHEMA: public ###

-- Tabela de Perfis de Usuário
-- Armazena dados públicos e privados do perfil, complementando a tabela `next_auth.users`.
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY, -- FK para next_auth.users.id
  full_name text,
  display_name text,
  email text NOT NULL UNIQUE,
  hashed_password text, -- Para login com credenciais
  phone text,
  cpf_cnpj text UNIQUE,
  rg text,
  avatar_url text,
  account_type text, -- 'pessoa' ou 'empresa'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES next_auth.users(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.profiles IS 'Stores user profile data, extending the main user table from next_auth.';

-- Tabela de Categorias
-- Armazena categorias de transações, com opções padrão e personalizadas pelo usuário.
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL, -- 'income' ou 'expense'
  icon text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.categories IS 'Stores transaction categories, including default and user-defined ones.';

-- Inserindo categorias padrão (se não existirem)
INSERT INTO public.categories (name, type, icon, is_default) VALUES
  ('Salário', 'income', 'DollarSign', true),
  ('Vendas', 'income', 'Briefcase', true),
  ('Freelance', 'income', 'Laptop', true),
  ('Investimentos', 'income', 'TrendingUp', true),
  ('Outras Receitas', 'income', 'PlusCircle', true),
  ('Alimentação', 'expense', 'Utensils', true),
  ('Moradia', 'expense', 'Home', true),
  ('Transporte', 'expense', 'Car', true),
  ('Lazer', 'expense', 'Gamepad2', true),
  ('Saúde', 'expense', 'Heart', true),
  ('Educação', 'expense', 'BookOpen', true),
  ('Compras', 'expense', 'ShoppingBag', true),
  ('Serviços', 'expense', 'Cog', true),
  ('Impostos', 'expense', 'Landmark', true),
  ('Outras Despesas', 'expense', 'MinusCircle', true)
ON CONFLICT (name) DO NOTHING;

-- Tabela de Transações
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  description text NOT NULL,
  amount numeric(12, 2) NOT NULL,
  date date NOT NULL,
  type text NOT NULL, -- 'income' ou 'expense'
  notes text,
  is_recurring boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.transactions IS 'Records all financial transactions for users.';

-- Tabela de Orçamentos
CREATE TABLE IF NOT EXISTS public.budgets (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  limit_amount numeric(12, 2) NOT NULL,
  spent_amount numeric(12, 2) NOT NULL DEFAULT 0,
  period_start_date date NOT NULL,
  period_end_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.budgets IS 'Defines spending limits for categories over specific periods.';

-- Tabela de Metas Financeiras
CREATE TABLE IF NOT EXISTS public.financial_goals (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  target_amount numeric(12, 2) NOT NULL,
  current_amount numeric(12, 2) NOT NULL DEFAULT 0,
  deadline_date date,
  icon text,
  notes text,
  status text NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'achieved', 'cancelled'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.financial_goals IS 'Tracks user''s financial saving goals.';

-- Tabela de Tarefas (To-Dos)
CREATE TABLE IF NOT EXISTS public.todos (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  description text NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  due_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.todos IS 'A simple to-do list for users.';


-- ### TRIGGERS E FUNÇÕES ###

-- Função para criar um perfil público quando um novo usuário é criado no `next_auth.users`.
-- Isso garante que, se um usuário se inscrever via OAuth (que cria direto no next_auth),
-- seu perfil correspondente seja criado em `public.profiles`.
CREATE OR REPLACE FUNCTION public.handle_new_user_from_next_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com os privilégios de quem definiu a função (geralmente superusuário)
AS $$
BEGIN
  -- Tenta inserir. Se o ID já existir (criado pela action de signup), atualiza os dados.
  INSERT INTO public.profiles (id, email, full_name, display_name, avatar_url, account_type)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.name, -- Usa o 'name' do NextAuth como um fallback para full_name e display_name
    NEW.name,
    NEW.image,
    'pessoa' -- Assume 'pessoa' como padrão para contas OAuth. Pode ser ajustado.
  )
  ON CONFLICT (id) DO UPDATE SET
    -- Apenas atualiza campos se eles estiverem vazios no perfil existente,
    -- para não sobrescrever dados inseridos no signup manual.
    email = COALESCE(public.profiles.email, NEW.email),
    full_name = COALESCE(public.profiles.full_name, NEW.name),
    display_name = COALESCE(public.profiles.display_name, NEW.name),
    avatar_url = COALESCE(public.profiles.avatar_url, NEW.image);
  RETURN NEW;
END;
$$;

-- Trigger que chama a função acima sempre que um novo usuário é adicionado à tabela do NextAuth.
DROP TRIGGER IF EXISTS on_next_auth_user_created ON next_auth.users;
CREATE TRIGGER on_next_auth_user_created
  AFTER INSERT ON next_auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_from_next_auth();


-- Função para atualizar o timestamp 'updated_at' automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para 'updated_at' em cada tabela
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_categories_updated_at ON public.categories;
CREATE TRIGGER set_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_transactions_updated_at ON public.transactions;
CREATE TRIGGER set_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_budgets_updated_at ON public.budgets;
CREATE TRIGGER set_budgets_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_goals_updated_at ON public.financial_goals;
CREATE TRIGGER set_goals_updated_at BEFORE UPDATE ON public.financial_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_todos_updated_at ON public.todos;
CREATE TRIGGER set_todos_updated_at BEFORE UPDATE ON public.todos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ### POLÍTICAS DE ROW LEVEL SECURITY (RLS) ###

-- --- Tabela: profiles ---
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Permite que a action de signup (usando anon key) insira um novo perfil.
-- A verificação de email duplicado já é feita na server action.
DROP POLICY IF EXISTS "Allow anon to insert their own profile on signup" ON public.profiles;
CREATE POLICY "Allow anon to insert their own profile on signup"
  ON public.profiles FOR INSERT
  TO anon
  WITH CHECK (true);

-- Permite ler o e-mail de outros perfis para a verificação de e-mail duplicado durante o signup
DROP POLICY IF EXISTS "Allow anon to read emails for signup check" ON public.profiles;
CREATE POLICY "Allow anon to read emails for signup check"
  ON public.profiles FOR SELECT
  TO anon
  USING (true);


-- --- Tabela: categories ---
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own categories" ON public.categories;
CREATE POLICY "Users can manage their own categories" ON public.categories
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow authenticated users to read default categories" ON public.categories;
CREATE POLICY "Allow authenticated users to read default categories" ON public.categories
  FOR SELECT TO authenticated USING (is_default = true);

-- --- Tabela: transactions ---
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own transactions" ON public.transactions;
CREATE POLICY "Users can manage their own transactions" ON public.transactions
  FOR ALL USING (auth.uid() = user_id);

-- --- Tabela: budgets ---
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own budgets" ON public.budgets;
CREATE POLICY "Users can manage their own budgets" ON public.budgets
  FOR ALL USING (auth.uid() = user_id);

-- --- Tabela: financial_goals ---
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own financial goals" ON public.financial_goals;
CREATE POLICY "Users can manage their own financial goals" ON public.financial_goals
  FOR ALL USING (auth.uid() = user_id);

-- --- Tabela: todos ---
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own todos" ON public.todos;
CREATE POLICY "Users can manage their own todos" ON public.todos
  FOR ALL USING (auth.uid() = user_id);

-- --- VIEW para atualizar o spent_amount dos orçamentos ---
CREATE OR REPLACE VIEW public.budget_spent_view AS
SELECT
  b.id AS budget_id,
  b.user_id,
  COALESCE(SUM(t.amount), 0) AS total_spent
FROM
  public.budgets b
LEFT JOIN
  public.transactions t
ON
  b.user_id = t.user_id
  AND b.category_id = t.category_id
  AND t.type = 'expense'
  AND t.date >= b.period_start_date
  AND t.date <= b.period_end_date
GROUP BY
  b.id;

-- Função para atualizar spent_amount na tabela de budgets
CREATE OR REPLACE FUNCTION public.update_budget_spent_amount()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.budgets b
  SET spent_amount = v.total_spent
  FROM public.budget_spent_view v
  WHERE b.id = v.budget_id;
  RETURN NULL; -- Retorno nulo porque é um trigger AFTER
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar orçamentos após inserções/atualizações/deleções em transações
DROP TRIGGER IF EXISTS on_transaction_change_update_budgets ON public.transactions;
CREATE TRIGGER on_transaction_change_update_budgets
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.update_budget_spent_amount();

-- Função para atualizar current_amount na tabela de metas financeiras
-- Assumindo que TODAS as transações do tipo 'income' contribuem para TODAS as metas 'in_progress'
-- Isso é uma simplificação. Um modelo mais complexo poderia ter uma tabela de ligação.
CREATE OR REPLACE FUNCTION public.update_goal_current_amount()
RETURNS TRIGGER AS $$
DECLARE
  total_income numeric;
BEGIN
  -- Este é um modelo muito simples. Recomenda-se uma lógica mais específica.
  -- Por exemplo, poderia recalcular o total de receitas do usuário e aplicar a alguma meta.
  -- A implementação atual é um placeholder e pode não ser performática ou correta para todos os casos de uso.
  
  -- Para ser seguro e evitar lógica complexa no trigger, a atualização do current_amount
  -- deve ser feita pela aplicação quando uma contribuição para a meta é feita.
  -- Mantemos o trigger como um exemplo, mas a lógica real seria na aplicação.
  
  RETURN NULL; -- Não faz nada por padrão para evitar comportamento inesperado.
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_transaction_change_update_goals ON public.transactions;
-- CREATE TRIGGER on_transaction_change_update_goals
--   AFTER INSERT OR UPDATE ON public.transactions
--   FOR EACH ROW
--   WHEN (NEW.type = 'income')
--   EXECUTE FUNCTION public.update_goal_current_amount();

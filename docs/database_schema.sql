-- ### PROFILES TABLE ### (Assuming this was created previously as per user instructions)
-- CREATE TABLE public.profiles (
--   id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
--   full_name TEXT,
--   display_name TEXT,
--   phone TEXT,
--   avatar_url TEXT,
--   cpf_cnpj TEXT,
--   rg TEXT,
--   updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
-- );
-- CREATE OR REPLACE FUNCTION public.handle_new_user() ...
-- CREATE TRIGGER on_auth_user_created ...
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view their own profile." ...
-- CREATE POLICY "Users can update their own profile." ...

-- ### CATEGORIES TABLE ###
-- Stores transaction categories. Users can have custom categories.
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Nulo para categorias padrão/globais
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')), -- 'income' or 'expense'
  icon TEXT, -- Nome do ícone (ex: 'Home', 'Car', 'Utensils')
  is_default BOOLEAN DEFAULT FALSE, -- True para categorias padrão, False para criadas pelo usuário
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT categories_name_user_id_key UNIQUE (name, user_id) -- Added unique constraint
);

COMMENT ON COLUMN public.categories.user_id IS 'Null for default categories, user_id for user-specific ones.';
COMMENT ON COLUMN public.categories.type IS 'Type of category: income or expense.';
COMMENT ON COLUMN public.categories.icon IS 'Lucide icon name or similar identifier for the category icon.';
COMMENT ON COLUMN public.categories.is_default IS 'Indicates if this is a system-default category.';

-- RLS for categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view default categories and their own."
  ON public.categories FOR SELECT
  USING (is_default = TRUE OR auth.uid() = user_id);

CREATE POLICY "Users can manage their own categories."
  ON public.categories FOR ALL
  USING (auth.uid() = user_id AND is_default = FALSE)
  WITH CHECK (auth.uid() = user_id AND is_default = FALSE);


-- ### TRANSACTIONS TABLE ###
-- Stores all financial transactions for users.
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL, -- Opcional, pode ser nulo se a categoria for deletada
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL, -- Ex: 1234567890.12
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')), -- 'income' or 'expense'
  notes TEXT, -- Opcional, para detalhes adicionais
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON COLUMN public.transactions.amount IS 'Transaction amount, positive for income, can be stored as absolute and type defines flow.';
COMMENT ON COLUMN public.transactions.type IS 'Type of transaction: income or expense.';

-- RLS for transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own transactions."
  ON public.transactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ### BUDGETS TABLE ###
-- Stores user-defined budgets for specific categories and periods.
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  limit_amount NUMERIC(12, 2) NOT NULL,
  spent_amount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL, -- This might be calculated or updated regularly
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL, -- Example: For a monthly budget, start_date = '2024-08-01', end_date = '2024-08-31'
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, category_id, period_start_date) -- Ensure unique budget per user, category, and period
);

COMMENT ON COLUMN public.budgets.spent_amount IS 'Amount spent against this budget. Could be updated by triggers or app logic.';
COMMENT ON COLUMN public.budgets.period_start_date IS 'Start date of the budget period (e.g., first day of the month).';
COMMENT ON COLUMN public.budgets.period_end_date IS 'End date of the budget period (e.g., last day of the month).';


-- RLS for budgets
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own budgets."
  ON public.budgets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ### FINANCIAL_GOALS TABLE ###
-- Stores user's financial goals.
CREATE TABLE public.financial_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC(12, 2) NOT NULL,
  current_amount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
  deadline_date DATE, -- Optional deadline
  icon TEXT, -- Nome do ícone (ex: 'Car', 'Home', 'GraduationCap')
  notes TEXT, -- Opcional, para detalhes adicionais
  status TEXT DEFAULT 'in_progress' NOT NULL CHECK (status IN ('in_progress', 'achieved', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON COLUMN public.financial_goals.icon IS 'Lucide icon name or similar identifier for the goal icon.';
COMMENT ON COLUMN public.financial_goals.status IS 'Status of the goal.';

-- RLS for financial_goals
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own financial goals."
  ON public.financial_goals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Seed some default categories (run this only once, or adapt with ON CONFLICT DO NOTHING)
-- Ensure these are marked as is_default = TRUE and user_id = NULL
INSERT INTO public.categories (name, type, icon, is_default, user_id) VALUES
('Salário', 'income', 'Landmark', TRUE, NULL),
('Outras Receitas', 'income', 'DollarSign', TRUE, NULL),
('Alimentação', 'expense', 'Utensils', TRUE, NULL),
('Transporte', 'expense', 'Car', TRUE, NULL),
('Moradia', 'expense', 'Home', TRUE, NULL),
('Contas', 'expense', 'Receipt', TRUE, NULL),
('Lazer', 'expense', 'Ticket', TRUE, NULL),
('Saúde', 'expense', 'HeartPulse', TRUE, NULL),
('Educação', 'expense', 'BookOpen', TRUE, NULL),
('Compras', 'expense', 'ShoppingCart', TRUE, NULL),
('Investimentos', 'expense', 'TrendingUp', TRUE, NULL), 
('Outras Despesas', 'expense', 'PlusCircle', TRUE, NULL)
ON CONFLICT (name, user_id) DO NOTHING; -- This should now work with the unique constraint on (name, user_id)

-- (Optional) Function to update `updated_at` timestamp automatically
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- (Optional) Apply the trigger to tables
CREATE TRIGGER set_timestamp_categories
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_timestamp_transactions
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_timestamp_budgets
BEFORE UPDATE ON public.budgets
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_timestamp_financial_goals
BEFORE UPDATE ON public.financial_goals
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

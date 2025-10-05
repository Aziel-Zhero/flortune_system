-- FLORTUNE - SCRIPT DE LIMPEZA DE BANCO DE DADOS (v3)
-- Este script remove as tabelas de aplicação, mantendo apenas as tabelas relacionadas a APIs.
-- Utiliza CASCADE para remover dependências automaticamente.

-- Apagar Triggers e Funções primeiro, se existirem
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.log_changes() CASCADE;

-- Apagar as tabelas em ordem de dependência ou usando CASCADE
-- Tabelas de aplicação principal
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.budgets CASCADE;
DROP TABLE IF EXISTS public.financial_goals CASCADE;
DROP TABLE IF EXISTS public.todos CASCADE;
DROP TABLE IF EXISTS public.notes CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;

-- Tabelas de DEV
DROP TABLE IF EXISTS public.dev_clients CASCADE;

-- Tabela de perfis
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Tabelas de log associadas (se existirem)
DROP TABLE IF EXISTS public.transactions_log CASCADE;
DROP TABLE IF EXISTS public.budgets_log CASCADE;
DROP TABLE IF EXISTS public.financial_goals_log CASCADE;
DROP TABLE IF EXISTS public.todos_log CASCADE;
DROP TABLE IF EXISTS public.notes_log CASCADE;
DROP TABLE IF EXISTS public.categories_log CASCADE;
DROP TABLE IF EXISTS public.dev_clients_log CASCADE;
DROP TABLE IF EXISTS public.profiles_log CASCADE;

-- Tabela de ativos financeiros que será removida
DROP TABLE IF EXISTS public.financial_assets CASCADE;

-- Apagar Tipos ENUM, se não estiverem mais em uso por nenhuma tabela restante
DROP TYPE IF EXISTS public.account_type_enum;
DROP TYPE IF EXISTS public.transaction_type;
DROP TYPE IF EXISTS public.goal_status_enum;
DROP TYPE IF EXISTS public.dev_client_status;
DROP TYPE IF EXISTS public.dev_client_priority;


-- Mensagem de sucesso no log do Supabase
SELECT 'Script de limpeza concluído com sucesso. Tabelas da aplicação foram removidas.' as status;

-- As tabelas public.api_cities, public.quote_logs, e public.weather_logs permanecem no banco de dados.

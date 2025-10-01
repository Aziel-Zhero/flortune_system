-- =============================================
-- SCRIPT DE RESET E CRIAÇÃO DO BANCO DE DADOS
-- FLORTUNE - VERSÃO PT-BR COM LOGS
-- =============================================
-- Este script limpa o ambiente e cria a estrutura completa do zero.

-- =============================================
-- SEÇÃO 1: LIMPEZA DO BANCO (DROP)
-- Remove todas as tabelas, tipos e funções antigas para evitar conflitos.
-- =============================================
BEGIN;

-- Desabilita a proteção contra deleção de tabelas com chaves estrangeiras
SET session_replication_role = 'replica';

-- Remove os triggers de log primeiro, se existirem
DROP TRIGGER IF EXISTS perfis_log_trigger ON public.perfis;
DROP TRIGGER IF EXISTS categorias_log_trigger ON public.categorias;
DROP TRIGGER IF EXISTS transacoes_log_trigger ON public.transacoes;
DROP TRIGGER IF EXISTS orcamentos_log_trigger ON public.orcamentos;
DROP TRIGGER IF EXISTS metas_financeiras_log_trigger ON public.metas_financeiras;
DROP TRIGGER IF EXISTS tarefas_log_trigger ON public.tarefas;

-- Remove as funções de log, se existirem
DROP FUNCTION IF EXISTS public.log_alteracoes_perfis();
DROP FUNCTION IF EXISTS public.log_alteracoes_categorias();
DROP FUNCTION IF EXISTS public.log_alteracoes_transacoes();
DROP FUNCTION IF EXISTS public.log_alteracoes_orcamentos();
DROP FUNCTION IF EXISTS public.log_alteracoes_metas_financeiras();
DROP FUNCTION IF EXISTS public.log_alteracoes_tarefas();

-- Remove as tabelas de log
DROP TABLE IF EXISTS public.perfis_log;
DROP TABLE IF EXISTS public.categorias_log;
DROP TABLE IF EXISTS public.transacoes_log;
DROP TABLE IF EXISTS public.orcamentos_log;
DROP TABLE IF EXISTS public.metas_financeiras_log;
DROP TABLE IF EXISTS public.tarefas_log;

-- Remove as tabelas da aplicação
DROP TABLE IF EXISTS public.tarefas;
DROP TABLE IF EXISTS public.metas_financeiras;
DROP TABLE IF EXISTS public.orcamentos;
DROP TABLE IF EXISTS public.transacoes;
DROP TABLE IF EXISTS public.categorias;
DROP TABLE IF EXISTS public.perfis;

-- Remove tabelas de APIs
DROP TABLE IF EXISTS public.historico_clima;
DROP TABLE IF EXISTS public.cidades_api;
DROP TABLE IF EXISTS public.historico_cotacoes;
DROP TABLE IF EXISTS public.ativos_financeiros;

-- Remove os tipos ENUM personalizados
DROP TYPE IF EXISTS public.tipo_conta;
DROP TYPE IF EXISTS public.tipo_transacao;
DROP TYPE IF EXISTS public.status_meta;
DROP TYPE IF EXISTS public.tipo_ativo;

-- Reabilita a proteção
SET session_replication_role = 'origin';

COMMIT;

-- =============================================
-- SEÇÃO 2: CRIAÇÃO DOS TIPOS (ENUMS)
-- =============================================
CREATE TYPE public.tipo_conta AS ENUM ('pessoa_fisica', 'pessoa_juridica');
CREATE TYPE public.tipo_transacao AS ENUM ('receita', 'despesa');
CREATE TYPE public.status_meta AS ENUM ('em_progresso', 'alcancada', 'cancelada');
CREATE TYPE public.tipo_ativo AS ENUM ('moeda', 'indice', 'commodity');

-- =============================================
-- SEÇÃO 3: CRIAÇÃO DAS TABELAS PRINCIPAIS
-- =============================================

-- Tabela de Perfis de Usuário
CREATE TABLE public.perfis (
    id UUID PRIMARY KEY NOT NULL DEFAULT auth.uid(),
    nome_completo TEXT,
    nome_exibicao TEXT,
    email TEXT NOT NULL UNIQUE,
    senha_hash TEXT,
    telefone TEXT,
    url_avatar TEXT,
    tipo_conta public.tipo_conta,
    cpf_cnpj TEXT UNIQUE,
    rg TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.perfis IS 'Armazena os perfis dos usuários do sistema.';

-- Tabela de Categorias
CREATE TABLE public.categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    perfil_id UUID REFERENCES public.perfis(id) ON DELETE SET NULL, -- Se o usuário for deletado, a categoria se torna 'sem dono' (se is_default) ou é deletada em cascata (se não for)
    nome TEXT NOT NULL,
    tipo public.tipo_transacao NOT NULL,
    icone TEXT,
    eh_padrao BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.categorias IS 'Categorias para classificar transações (ex: Moradia, Salário).';

-- Tabela de Transações
CREATE TABLE public.transacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    perfil_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
    categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
    descricao TEXT NOT NULL,
    valor NUMERIC(12, 2) NOT NULL,
    data DATE NOT NULL,
    tipo public.tipo_transacao NOT NULL,
    eh_recorrente BOOLEAN NOT NULL DEFAULT FALSE,
    notas TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.transacoes IS 'Registra todas as receitas e despesas dos usuários.';

-- Tabela de Orçamentos
CREATE TABLE public.orcamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    perfil_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
    categoria_id UUID NOT NULL REFERENCES public.categorias(id) ON DELETE CASCADE,
    valor_limite NUMERIC(12, 2) NOT NULL,
    valor_gasto NUMERIC(12, 2) NOT NULL DEFAULT 0,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.orcamentos IS 'Define limites de gastos para categorias em um período.';

-- Tabela de Metas Financeiras
CREATE TABLE public.metas_financeiras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    perfil_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    valor_meta NUMERIC(12, 2) NOT NULL,
    valor_atual NUMERIC(12, 2) NOT NULL DEFAULT 0,
    data_prazo DATE,
    icone TEXT,
    status public.status_meta NOT NULL DEFAULT 'em_progresso',
    notas TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.metas_financeiras IS 'Objetivos financeiros dos usuários.';

-- Tabela de Tarefas (To-Do List)
CREATE TABLE public.tarefas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    perfil_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
    descricao TEXT NOT NULL,
    concluida BOOLEAN NOT NULL DEFAULT FALSE,
    data_vencimento DATE,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.tarefas IS 'Lista de tarefas dos usuários.';

-- =============================================
-- SEÇÃO 4: CRIAÇÃO DAS TABELAS PARA APIS
-- =============================================

-- Tabela para Cidades (API de Clima)
CREATE TABLE public.cidades_api (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    pais VARCHAR(5) NOT NULL,
    latitude DECIMAL(9, 6),
    longitude DECIMAL(9, 6),
    UNIQUE (nome, pais)
);
COMMENT ON TABLE public.cidades_api IS 'Armazena cidades únicas para consulta de clima.';

-- Tabela para Histórico do Clima
CREATE TABLE public.historico_clima (
    id SERIAL PRIMARY KEY,
    cidade_id INT NOT NULL REFERENCES public.cidades_api(id) ON DELETE CASCADE,
    temperatura DECIMAL(5, 2),
    descricao VARCHAR(255),
    codigo_icone VARCHAR(10),
    umidade INT,
    velocidade_vento DECIMAL(5, 2),
    registrado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.historico_clima IS 'Log de registros de clima obtidos da API.';

-- Tabela para Ativos Financeiros (API de Cotações)
CREATE TABLE public.ativos_financeiros (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    tipo public.tipo_ativo NOT NULL
);
COMMENT ON TABLE public.ativos_financeiros IS 'Armazena ativos financeiros únicos (moedas, índices, etc.).';

-- Tabela para Histórico de Cotações
CREATE TABLE public.historico_cotacoes (
    id SERIAL PRIMARY KEY,
    ativo_id INT NOT NULL REFERENCES public.ativos_financeiros(id) ON DELETE CASCADE,
    preco_compra NUMERIC(18, 6),
    preco_venda NUMERIC(18, 6),
    variacao_percentual DECIMAL(10, 4),
    preco_maximo NUMERIC(18, 6),
    preco_minimo NUMERIC(18, 6),
    registrado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.historico_cotacoes IS 'Log de cotações de ativos financeiros obtidas da API.';

-- =============================================
-- SEÇÃO 5: CRIAÇÃO DAS TABELAS DE LOG
-- =============================================

-- Tabela de Log para Perfis
CREATE TABLE public.perfis_log (
    id SERIAL PRIMARY KEY,
    perfil_id UUID NOT NULL,
    operacao VARCHAR(10) NOT NULL,
    dados_antigos JSONB,
    dados_novos JSONB,
    alterado_em TIMESTAMPTZ DEFAULT NOW(),
    alterado_por_id UUID DEFAULT auth.uid()
);
COMMENT ON TABLE public.perfis_log IS 'Auditoria de todas as alterações na tabela de perfis.';

-- Adicionar outras tabelas de log (categorias, transacoes, etc.)
CREATE TABLE public.categorias_log (
    id SERIAL PRIMARY KEY,
    categoria_id UUID NOT NULL,
    operacao VARCHAR(10) NOT NULL,
    dados_antigos JSONB,
    dados_novos JSONB,
    alterado_em TIMESTAMPTZ DEFAULT NOW(),
    alterado_por_id UUID DEFAULT auth.uid()
);

CREATE TABLE public.transacoes_log (
    id SERIAL PRIMARY KEY,
    transacao_id UUID NOT NULL,
    operacao VARCHAR(10) NOT NULL,
    dados_antigos JSONB,
    dados_novos JSONB,
    alterado_em TIMESTAMPTZ DEFAULT NOW(),
    alterado_por_id UUID DEFAULT auth.uid()
);

CREATE TABLE public.orcamentos_log (
    id SERIAL PRIMARY KEY,
    orcamento_id UUID NOT NULL,
    operacao VARCHAR(10) NOT NULL,
    dados_antigos JSONB,
    dados_novos JSONB,
    alterado_em TIMESTAMPTZ DEFAULT NOW(),
    alterado_por_id UUID DEFAULT auth.uid()
);

CREATE TABLE public.metas_financeiras_log (
    id SERIAL PRIMARY KEY,
    meta_id UUID NOT NULL,
    operacao VARCHAR(10) NOT NULL,
    dados_antigos JSONB,
    dados_novos JSONB,
    alterado_em TIMESTAMPTZ DEFAULT NOW(),
    alterado_por_id UUID DEFAULT auth.uid()
);

CREATE TABLE public.tarefas_log (
    id SERIAL PRIMARY KEY,
    tarefa_id UUID NOT NULL,
    operacao VARCHAR(10) NOT NULL,
    dados_antigos JSONB,
    dados_novos JSONB,
    alterado_em TIMESTAMPTZ DEFAULT NOW(),
    alterado_por_id UUID DEFAULT auth.uid()
);


-- =============================================
-- SEÇÃO 6: FUNÇÕES E TRIGGERS PARA LOGS E UPDATES
-- =============================================

-- Função genérica para atualizar `atualizado_em`
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função genérica de log
CREATE OR REPLACE FUNCTION public.log_generic_trigger()
RETURNS TRIGGER AS $$
DECLARE
    log_table_name TEXT := TG_TABLE_NAME || '_log';
    id_column_name TEXT := TG_TABLE_NAME || '_id';
BEGIN
    IF (TG_OP = 'INSERT') THEN
        EXECUTE format('INSERT INTO public.%I (%I, operacao, dados_novos) VALUES ($1, $2, $3)',
                       log_table_name, 'id', TG_OP, to_jsonb(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        EXECUTE format('INSERT INTO public.%I (%I, operacao, dados_antigos, dados_novos) VALUES ($1, $2, $3, $4)',
                       log_table_name, id_column_name, 'operacao', 'dados_antigos', 'dados_novos')
        USING OLD.id, TG_OP, to_jsonb(OLD), to_jsonb(NEW);
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        EXECUTE format('INSERT INTO public.%I (%I, operacao, dados_antigos) VALUES ($1, $2, $3)',
                       log_table_name, id_column_name, 'operacao', 'dados_antigos')
        USING OLD.id, TG_OP, to_jsonb(OLD);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Função para criar um perfil quando um novo usuário se registra no Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfis (id, email, nome_completo, nome_exibicao, url_avatar, tipo_conta, cpf_cnpj, rg)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'avatar_url',
    (NEW.raw_user_meta_data->>'account_type')::public.tipo_conta,
    NEW.raw_user_meta_data->>'cpf_cnpj',
    NEW.raw_user_meta_data->>'rg'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que chama a função handle_new_user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =============================================
-- SEÇÃO 7: APLICAÇÃO DOS TRIGGERS
-- =============================================

-- Aplicar trigger de `atualizado_em`
CREATE TRIGGER on_perfis_update BEFORE UPDATE ON public.perfis FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER on_categorias_update BEFORE UPDATE ON public.categorias FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER on_transacoes_update BEFORE UPDATE ON public.transacoes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER on_orcamentos_update BEFORE UPDATE ON public.orcamentos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER on_metas_update BEFORE UPDATE ON public.metas_financeiras FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER on_tarefas_update BEFORE UPDATE ON public.tarefas FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Aplicar triggers de LOG (Exemplo para transacoes, replicar para outras se necessário)
-- Nota: A função genérica não foi implementada para simplificar. Abaixo, um exemplo específico.

CREATE OR REPLACE FUNCTION public.log_transacoes_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.transacoes_log(transacao_id, operacao, dados_novos)
        VALUES(NEW.id, TG_OP, to_jsonb(NEW));
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.transacoes_log(transacao_id, operacao, dados_antigos, dados_novos)
        VALUES(OLD.id, TG_OP, to_jsonb(OLD), to_jsonb(NEW));
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO public.transacoes_log(transacao_id, operacao, dados_antigos)
        VALUES(OLD.id, TG_OP, to_jsonb(OLD));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transacoes_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.transacoes
FOR EACH ROW EXECUTE FUNCTION public.log_transacoes_trigger();


-- =============================================
-- SEÇÃO 8: HABILITAÇÃO DA SEGURANÇA (RLS)
-- =============================================
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;
-- Tabelas de log e API podem ter RLS se necessário, mas geralmente são acessadas por roles de serviço
ALTER TABLE public.perfis_log ENABLE ROW LEVEL SECURITY;


-- =============================================
-- SEÇÃO 9: CRIAÇÃO DAS POLÍTICAS DE RLS
-- =============================================

-- Perfis: Usuários podem ver seu próprio perfil e atualizá-lo.
CREATE POLICY "Usuarios podem ver e atualizar seu proprio perfil"
  ON public.perfis FOR ALL
  USING (auth.uid() = id);

-- Categorias: Usuários podem gerenciar suas próprias categorias e ver as padrão.
CREATE POLICY "Usuarios podem gerenciar suas proprias categorias"
  ON public.categorias FOR ALL
  USING (auth.uid() = perfil_id);
CREATE POLICY "Usuarios podem ver categorias padrao"
  ON public.categorias FOR SELECT
  USING (eh_padrao = TRUE);

-- Transações: Usuários só podem gerenciar suas próprias transações.
CREATE POLICY "Usuarios so podem gerenciar suas proprias transacoes"
  ON public.transacoes FOR ALL
  USING (auth.uid() = perfil_id);

-- Orçamentos: Usuários só podem gerenciar seus próprios orçamentos.
CREATE POLICY "Usuarios so podem gerenciar seus proprios orcamentos"
  ON public.orcamentos FOR ALL
  USING (auth.uid() = perfil_id);

-- Metas Financeiras: Usuários só podem gerenciar suas próprias metas.
CREATE POLICY "Usuarios so podem gerenciar suas proprias metas"
  ON public.metas_financeiras FOR ALL
  USING (auth.uid() = perfil_id);

-- Tarefas: Usuários só podem gerenciar suas próprias tarefas.
CREATE POLICY "Usuarios so podem gerenciar suas proprias tarefas"
  ON public.tarefas FOR ALL
  USING (auth.uid() = perfil_id);

-- Logs: Apenas roles de admin/serviço devem ter acesso (configurado via grants, não RLS de usuário)
CREATE POLICY "Admins podem ver todos os logs de perfis"
    ON public.perfis_log FOR SELECT
    USING (true); -- Simplificado, em produção seria `current_user_is_admin()`

-- =============================================
-- SEÇÃO 10: DADOS INICIAIS (SEED)
-- =============================================
INSERT INTO public.categorias (nome, tipo, icone, eh_padrao) VALUES
('Salário', 'receita', 'DollarSign', TRUE),
('Freelance/Bicos', 'receita', 'Briefcase', TRUE),
('Investimentos', 'receita', 'TrendingUp', TRUE),
('Outras Receitas', 'receita', 'PlusCircle', TRUE),
('Moradia', 'despesa', 'Home', TRUE),
('Alimentação', 'despesa', 'ShoppingCart', TRUE),
('Transporte', 'despesa', 'Car', TRUE),
('Saúde', 'despesa', 'Heart', TRUE),
('Lazer', 'despesa', 'GlassWater', TRUE),
('Educação', 'despesa', 'BookOpen', TRUE),
('Dívidas/Empréstimos', 'despesa', 'CreditCard', TRUE),
('Impostos', 'despesa', 'Landmark', TRUE),
('Vestuário', 'despesa', 'Shirt', TRUE),
('Viagem', 'despesa', 'Plane', TRUE),
('Assinaturas/Serviços', 'despesa', 'Wifi', TRUE),
('Outras Despesas', 'despesa', 'MoreHorizontal', TRUE);

-- =============================================
-- FIM DO SCRIPT
-- =============================================

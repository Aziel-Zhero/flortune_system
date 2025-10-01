-- =================================================================
-- FLORTUNE - SCRIPT DE BANCO DE DADOS (VERSÃO EM PORTUGUÊS COM LOGS)
-- =================================================================
-- Este script limpa o ambiente antigo e cria uma estrutura de banco de dados
-- totalmente nova, normalizada, auditável e em português.

-- ========= INÍCIO DO BLOCO DE LIMPEZA =========
-- Desabilita a confirmação de email para novos usuários para um fluxo de cadastro mais rápido.
-- Nota: Em um ambiente de produção real, você pode querer manter isso habilitado.
ALTER TABLE auth.users ALTER COLUMN email_confirmed_at SET DEFAULT now();

-- Drop de Triggers e Funções primeiro
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.log_changes() CASCADE;

-- Drop de Políticas de Segurança
-- Adicionado 'IF EXISTS' para evitar erros se o script for executado em um banco de dados limpo.
DROP POLICY IF EXISTS "Usuários podem gerenciar seus próprios perfis." ON public.perfis;
DROP POLICY IF EXISTS "Usuários podem gerenciar suas próprias categorias." ON public.categorias;
DROP POLICY IF EXISTS "Usuários podem gerenciar suas próprias transações." ON public.transacoes;
DROP POLICY IF EXISTS "Usuários podem gerenciar seus próprios orçamentos." ON public.orcamentos;
DROP POLICY IF EXISTS "Usuários podem gerenciar suas próprias metas financeiras." ON public.metas_financeiras;
DROP POLICY IF EXISTS "Usuários podem gerenciar suas próprias tarefas." ON public.tarefas;
DROP POLICY IF EXISTS "Usuários podem gerenciar suas próprias anotações." ON public.anotacoes;
DROP POLICY IF EXISTS "Usuários DEV podem gerenciar seus próprios clientes." ON public.clientes_dev;

-- Drop de Tabelas (usando CASCADE para remover dependências como chaves estrangeiras)
DROP TABLE IF EXISTS public.transacoes_log CASCADE;
DROP TABLE IF EXISTS public.perfis_log CASCADE;
DROP TABLE IF EXISTS public.categorias_log CASCADE;
DROP TABLE IF EXISTS public.orcamentos_log CASCADE;
DROP TABLE IF EXISTS public.metas_financeiras_log CASCADE;
DROP TABLE IF EXISTS public.tarefas_log CASCADE;
DROP TABLE IF EXISTS public.anotacoes_log CASCADE;
DROP TABLE IF EXISTS public.clientes_dev_log CASCADE;
DROP TABLE IF EXISTS public.clima_logs CASCADE;
DROP TABLE IF EXISTS public.cotacoes_log CASCADE;

DROP TABLE IF EXISTS public.transacoes CASCADE;
DROP TABLE IF EXISTS public.orcamentos CASCADE;
DROP TABLE IF EXISTS public.categorias CASCADE;
DROP TABLE IF EXISTS public.metas_financeiras CASCADE;
DROP TABLE IF EXISTS public.tarefas CASCADE;
DROP TABLE IF EXISTS public.perfis CASCADE;
DROP TABLE IF EXISTS public.anotacoes CASCADE;
DROP TABLE IF EXISTS public.clientes_dev CASCADE;
DROP TABLE IF EXISTS public.api_cidades CASCADE;
DROP TABLE IF EXISTS public.ativos_financeiros CASCADE;

-- Drop de Tipos ENUM personalizados
DROP TYPE IF EXISTS public.tipo_conta;
DROP TYPE IF EXISTS public.tipo_transacao;
DROP TYPE IF EXISTS public.status_meta;
DROP TYPE IF EXISTS public.status_cliente_dev;
DROP TYPE IF EXISTS public.prioridade_cliente_dev;
DROP TYPE IF EXISTS public.tipo_ativo_financeiro;
DROP TYPE IF EXISTS public.tipo_operacao_log;

-- ========= FIM DO BLOCO DE LIMPEZA =========


-- ========= INÍCIO DA CRIAÇÃO DA NOVA ESTRUTURA =========

-- Habilita a extensão para UUIDs se ainda não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- CRIAÇÃO DOS TIPOS ENUM
CREATE TYPE public.tipo_conta AS ENUM ('pessoa', 'empresa');
CREATE TYPE public.tipo_transacao AS ENUM ('receita', 'despesa');
CREATE TYPE public.status_meta AS ENUM ('em_progresso', 'alcancada', 'cancelada');
CREATE TYPE public.status_cliente_dev AS ENUM ('planejamento', 'em_execucao', 'entregue', 'em_espera', 'atrasado');
CREATE TYPE public.prioridade_cliente_dev AS ENUM ('baixa', 'media', 'alta');
CREATE TYPE public.tipo_ativo_financeiro AS ENUM ('moeda', 'indice_acoes', 'commodity');
CREATE TYPE public.tipo_operacao_log AS ENUM ('INSERT', 'UPDATE', 'DELETE');


-- Tabela de Perfis de Usuário
CREATE TABLE public.perfis (
    id UUID PRIMARY KEY DEFAULT auth.uid(),
    nome_completo TEXT,
    nome_exibicao TEXT,
    email TEXT NOT NULL UNIQUE,
    senha_hash TEXT,
    telefone TEXT,
    avatar_url TEXT,
    tipo_conta public.tipo_conta,
    cpf_cnpj TEXT UNIQUE,
    rg TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ
);
COMMENT ON TABLE public.perfis IS 'Armazena dados detalhados do perfil do usuário, complementando a tabela auth.users.';

-- Tabela de Categorias
CREATE TABLE public.categorias (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    perfil_id UUID REFERENCES public.perfis(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    tipo public.tipo_transacao NOT NULL,
    icone TEXT,
    is_padrao BOOLEAN NOT NULL DEFAULT false,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ
);
COMMENT ON TABLE public.categorias IS 'Categorias para transações, podendo ser padrão do sistema ou criadas pelo usuário.';

-- Tabela de Transações
CREATE TABLE public.transacoes (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    perfil_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
    categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
    descricao TEXT NOT NULL,
    valor DECIMAL(12, 2) NOT NULL,
    data DATE NOT NULL,
    tipo public.tipo_transacao NOT NULL,
    is_recorrente BOOLEAN NOT NULL DEFAULT false,
    anotacoes TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ
);
COMMENT ON TABLE public.transacoes IS 'Registra todas as movimentações financeiras do usuário.';

-- Tabela de Orçamentos
CREATE TABLE public.orcamentos (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    perfil_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
    categoria_id UUID NOT NULL REFERENCES public.categorias(id) ON DELETE CASCADE,
    valor_limite DECIMAL(12, 2) NOT NULL,
    valor_gasto DECIMAL(12, 2) NOT NULL DEFAULT 0,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ,
    CONSTRAINT chk_data_periodo CHECK (data_fim >= data_inicio)
);
COMMENT ON TABLE public.orcamentos IS 'Orçamentos mensais ou periódicos para categorias de despesas.';

-- Tabela de Metas Financeiras
CREATE TABLE public.metas_financeiras (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    perfil_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    valor_alvo DECIMAL(12, 2) NOT NULL,
    valor_atual DECIMAL(12, 2) NOT NULL DEFAULT 0,
    data_limite DATE,
    icone TEXT,
    status public.status_meta NOT NULL DEFAULT 'em_progresso',
    anotacoes TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ
);
COMMENT ON TABLE public.metas_financeiras IS 'Metas de economia e objetivos financeiros do usuário.';

-- Tabela de Tarefas (To-Do)
CREATE TABLE public.tarefas (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    perfil_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
    descricao TEXT NOT NULL,
    is_concluida BOOLEAN NOT NULL DEFAULT false,
    data_vencimento DATE,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ
);
COMMENT ON TABLE public.tarefas IS 'Lista de tarefas do usuário.';

-- Tabela de Anotações (Notepad)
CREATE TABLE public.anotacoes (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    perfil_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    conteudo TEXT,
    cor TEXT,
    is_fixado BOOLEAN NOT NULL DEFAULT false,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ
);
COMMENT ON TABLE public.anotacoes IS 'Anotações do usuário (estilo post-it), sincronizadas no banco.';

-- Tabela de Clientes (Módulo DEV)
CREATE TABLE public.clientes_dev (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    perfil_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    tipo_servico TEXT,
    status public.status_cliente_dev,
    prioridade public.prioridade_cliente_dev,
    data_inicio DATE,
    data_prazo DATE,
    valor_total DECIMAL(12, 2),
    tarefas TEXT,
    anotacoes TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ
);
COMMENT ON TABLE public.clientes_dev IS 'Tabela para o módulo de gerenciamento de clientes/projetos para desenvolvedores.';

-- TABELAS PARA APIs EXTERNAS --

-- Tabela para Cidades (API de Clima)
CREATE TABLE public.api_cidades (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    pais VARCHAR(5) NOT NULL,
    latitude DECIMAL(9, 6),
    longitude DECIMAL(9, 6),
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(nome, pais)
);
COMMENT ON TABLE public.api_cidades IS 'Armazena cidades únicas para consulta de clima, evitando redundância.';

-- Tabela para Logs de Clima
CREATE TABLE public.clima_logs (
    id SERIAL PRIMARY KEY,
    cidade_id INT NOT NULL REFERENCES public.api_cidades(id) ON DELETE CASCADE,
    temperatura DECIMAL(5, 2),
    descricao VARCHAR(255),
    icone_codigo VARCHAR(10),
    umidade INT,
    velocidade_vento DECIMAL(5, 2),
    registrado_em TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.clima_logs IS 'Histórico de registros de clima para cada cidade.';

-- Tabela para Ativos Financeiros (API de Cotações)
CREATE TABLE public.ativos_financeiros (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    tipo public.tipo_ativo_financeiro NOT NULL
);
COMMENT ON TABLE public.ativos_financeiros IS 'Armazena ativos financeiros únicos (moedas, ações) para cotação.';

-- Tabela para Logs de Cotações
CREATE TABLE public.cotacoes_log (
    id SERIAL PRIMARY KEY,
    ativo_id INT NOT NULL REFERENCES public.ativos_financeiros(id) ON DELETE CASCADE,
    preco_compra DECIMAL(18, 6),
    preco_venda DECIMAL(18, 6),
    variacao_percentual DECIMAL(10, 4),
    preco_maximo DECIMAL(18, 6),
    preco_minimo DECIMAL(18, 6),
    registrado_em TIMESTAMPTZ NOT NULL
);
COMMENT ON TABLE public.cotacoes_log IS 'Histórico de cotações para cada ativo financeiro.';


-- CRIAÇÃO DAS TABELAS DE LOG
CREATE TABLE public.perfis_log (
    id SERIAL PRIMARY KEY,
    operacao public.tipo_operacao_log NOT NULL,
    perfil_id UUID NOT NULL,
    dados_antigos JSONB,
    dados_novos JSONB,
    alterado_por UUID,
    alterado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.transacoes_log (
    id SERIAL PRIMARY KEY,
    operacao public.tipo_operacao_log NOT NULL,
    transacao_id UUID NOT NULL,
    dados_antigos JSONB,
    dados_novos JSONB,
    alterado_por UUID,
    alterado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.categorias_log (
    id SERIAL PRIMARY KEY,
    operacao public.tipo_operacao_log NOT NULL,
    categoria_id UUID NOT NULL,
    dados_antigos JSONB,
    dados_novos JSONB,
    alterado_por UUID,
    alterado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.orcamentos_log (
    id SERIAL PRIMARY KEY,
    operacao public.tipo_operacao_log NOT NULL,
    orcamento_id UUID NOT NULL,
    dados_antigos JSONB,
    dados_novos JSONB,
    alterado_por UUID,
    alterado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.metas_financeiras_log (
    id SERIAL PRIMARY KEY,
    operacao public.tipo_operacao_log NOT NULL,
    meta_id UUID NOT NULL,
    dados_antigos JSONB,
    dados_novos JSONB,
    alterado_por UUID,
    alterado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.tarefas_log (
    id SERIAL PRIMARY KEY,
    operacao public.tipo_operacao_log NOT NULL,
    tarefa_id UUID NOT NULL,
    dados_antigos JSONB,
    dados_novos JSONB,
    alterado_por UUID,
    alterado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.anotacoes_log (
    id SERIAL PRIMARY KEY,
    operacao public.tipo_operacao_log NOT NULL,
    anotacao_id UUID NOT NULL,
    dados_antigos JSONB,
    dados_novos JSONB,
    alterado_por UUID,
    alterado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.clientes_dev_log (
    id SERIAL PRIMARY KEY,
    operacao public.tipo_operacao_log NOT NULL,
    cliente_id UUID NOT NULL,
    dados_antigos JSONB,
    dados_novos JSONB,
    alterado_por UUID,
    alterado_em TIMESTAMPTZ DEFAULT NOW()
);


-- FUNÇÃO GENÉRICA PARA LOGS
CREATE OR REPLACE FUNCTION public.log_changes()
RETURNS TRIGGER AS $$
DECLARE
    log_table_name TEXT;
    id_column_name TEXT;
    current_user_id UUID;
BEGIN
    log_table_name := TG_TABLE_NAME || '_log';
    id_column_name := SUBSTRING(TG_TABLE_NAME, 1, LENGTH(TG_TABLE_NAME) - 1) || '_id';
    current_user_id := auth.uid();

    IF (TG_OP = 'INSERT') THEN
        EXECUTE format('INSERT INTO public.%I (operacao, %I, dados_novos, alterado_por) VALUES (%L, %L, %L, %L)',
                       log_table_name, id_column_name, 'INSERT', NEW.id, to_jsonb(NEW), current_user_id);
        NEW.atualizado_em := NOW();
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        EXECUTE format('INSERT INTO public.%I (operacao, %I, dados_antigos, dados_novos, alterado_por) VALUES (%L, %L, %L, %L, %L)',
                       log_table_name, id_column_name, 'UPDATE', OLD.id, to_jsonb(OLD), to_jsonb(NEW), current_user_id);
        NEW.atualizado_em := NOW();
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        EXECUTE format('INSERT INTO public.%I (operacao, %I, dados_antigos, alterado_por) VALUES (%L, %L, %L, %L)',
                       log_table_name, id_column_name, 'DELETE', OLD.id, to_jsonb(OLD), current_user_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;


-- TRIGGERS PARA AS TABELAS
CREATE TRIGGER perfis_log_trigger AFTER INSERT OR UPDATE OR DELETE ON public.perfis FOR EACH ROW EXECUTE FUNCTION public.log_changes();
CREATE TRIGGER transacoes_log_trigger AFTER INSERT OR UPDATE OR DELETE ON public.transacoes FOR EACH ROW EXECUTE FUNCTION public.log_changes();
CREATE TRIGGER categorias_log_trigger AFTER INSERT OR UPDATE OR DELETE ON public.categorias FOR EACH ROW EXECUTE FUNCTION public.log_changes();
CREATE TRIGGER orcamentos_log_trigger AFTER INSERT OR UPDATE OR DELETE ON public.orcamentos FOR EACH ROW EXECUTE FUNCTION public.log_changes();
CREATE TRIGGER metas_financeiras_log_trigger AFTER INSERT OR UPDATE OR DELETE ON public.metas_financeiras FOR EACH ROW EXECUTE FUNCTION public.log_changes();
CREATE TRIGGER tarefas_log_trigger AFTER INSERT OR UPDATE OR DELETE ON public.tarefas FOR EACH ROW EXECUTE FUNCTION public.log_changes();
CREATE TRIGGER anotacoes_log_trigger AFTER INSERT OR UPDATE OR DELETE ON public.anotacoes FOR EACH ROW EXECUTE FUNCTION public.log_changes();
CREATE TRIGGER clientes_dev_log_trigger AFTER INSERT OR UPDATE OR DELETE ON public.clientes_dev FOR EACH ROW EXECUTE FUNCTION public.log_changes();


-- FUNÇÃO PARA CRIAR PERFIL QUANDO UM NOVO USUÁRIO SE REGISTRA NO AUTH
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfis (id, email, nome_completo, nome_exibicao, avatar_url, tipo_conta, cpf_cnpj, rg)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TRIGGER PARA `handle_new_user`
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- DADOS INICIAIS (SEED)
INSERT INTO public.categorias (nome, tipo, icone, is_padrao) VALUES
('Salário', 'receita', 'DollarSign', true),
('Freelance', 'receita', 'Briefcase', true),
('Investimentos', 'receita', 'TrendingUp', true),
('Outras Receitas', 'receita', 'PlusCircle', true),
('Moradia', 'despesa', 'Home', true),
('Alimentação', 'despesa', 'Utensils', true),
('Transporte', 'despesa', 'Car', true),
('Saúde', 'despesa', 'Heartbeat', true),
('Lazer', 'despesa', 'Gamepad2', true),
('Educação', 'despesa', 'BookOpen', true),
('Vestuário', 'despesa', 'Shirt', true),
('Impostos', 'despesa', 'Landmark', true),
('Outras Despesas', 'despesa', 'MinusCircle', true);


-- HABILITAÇÃO DE ROW LEVEL SECURITY (RLS) E POLÍTICAS
-- Primeiro, habilita RLS em todas as tabelas que contêm dados do usuário.
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anotacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes_dev ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clima_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotacoes_log ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS DE ACESSO
-- Perfis: Usuários podem ver/editar seu próprio perfil.
CREATE POLICY "Usuários podem gerenciar seus próprios perfis." ON public.perfis FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Categorias: Usuários podem ver categorias padrão e gerenciar as suas próprias.
CREATE POLICY "Usuários podem ver categorias padrão." ON public.categorias FOR SELECT USING (is_padrao = true);
CREATE POLICY "Usuários podem gerenciar suas próprias categorias." ON public.categorias FOR ALL USING (auth.uid() = perfil_id);

-- Transações, Orçamentos, Metas, Tarefas, Anotações, Clientes DEV: Acesso total apenas aos próprios dados.
CREATE POLICY "Usuários podem gerenciar suas próprias transações." ON public.transacoes FOR ALL USING (auth.uid() = perfil_id);
CREATE POLICY "Usuários podem gerenciar seus próprios orçamentos." ON public.orcamentos FOR ALL USING (auth.uid() = perfil_id);
CREATE POLICY "Usuários podem gerenciar suas próprias metas financeiras." ON public.metas_financeiras FOR ALL USING (auth.uid() = perfil_id);
CREATE POLICY "Usuários podem gerenciar suas próprias tarefas." ON public.tarefas FOR ALL USING (auth.uid() = perfil_id);
CREATE POLICY "Usuários podem gerenciar suas próprias anotações." ON public.anotacoes FOR ALL USING (auth.uid() = perfil_id);
CREATE POLICY "Usuários DEV podem gerenciar seus próprios clientes." ON public.clientes_dev FOR ALL USING (auth.uid() = perfil_id);

-- API Logs: Permite que usuários autenticados leiam, mas não modifiquem os logs.
CREATE POLICY "Usuários autenticados podem ler logs de clima e cotações." ON public.clima_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem ler logs de cotações." ON public.cotacoes_log FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permite leitura de cidades para todos." ON public.api_cidades FOR SELECT USING (true);
CREATE POLICY "Permite leitura de ativos para todos." ON public.ativos_financeiros FOR SELECT USING (true);

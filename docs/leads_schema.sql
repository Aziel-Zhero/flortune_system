-- /---------------------------------------------------------------------------------------\
-- |                                                                                       |
-- |     ██╗     ███████╗ █████╗ ██████╗ ███████╗    (LEADS SCHEMA)                        |
-- |     ██║     ██╔════╝██╔══██╗██╔══██╗██╔════╝                                          |
-- |     ██║     █████╗  ███████║██║  ██║███████╗                                          |
-- |     ██║     ██╔══╝  ██╔══██║██║  ██║╚════██║                                          |
-- |     ███████╗███████╗██║  ██║██████╔╝███████║                                          |
-- |     ╚══════╝╚══════╝╚═╝  ╚═╝╚═════╝ ╚══════╝                                          |
-- |                                                                                       |
-- |  ✅ Script para a Tabela de Propostas de Leads e Políticas de Admin                   |
-- |  Este script é IDEMPOTENTE e focado apenas na criação e gerenciamento de leads/ofertas. |
-- |                                                                                       |
-- \---------------------------------------------------------------------------------------/

-- 1. Tabela de Propostas Personalizadas para Leads
CREATE TABLE IF NOT EXISTS public.lead_proposals (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    lead_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id text NOT NULL,
    offer_title text NOT NULL,
    price numeric(10, 2) NOT NULL,
    duration_months integer NOT NULL,
    message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL
);

-- Habilitar RLS para a tabela de propostas
ALTER TABLE public.lead_proposals ENABLE ROW LEVEL SECURITY;

-- 2. Políticas de RLS para a Tabela de Propostas
DROP POLICY IF EXISTS "Permitir leitura de propostas para admins" ON public.lead_proposals;
CREATE POLICY "Permitir leitura de propostas para admins"
  ON public.lead_proposals FOR SELECT
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Permitir inserção de propostas para admins" ON public.lead_proposals;
CREATE POLICY "Permitir inserção de propostas para admins"
  ON public.lead_proposals FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Permitir exclusão de propostas para admins" ON public.lead_proposals;
CREATE POLICY "Permitir exclusão de propostas para admins"
  ON public.lead_proposals FOR DELETE
  USING (public.is_admin(auth.uid()));

-- 3. Atualização das Políticas RLS na Tabela public.profiles para Administradores
-- Permite que administradores possam ver todos os perfis cadastrados no banco
DROP POLICY IF EXISTS "Admins podem ver todos os perfis" ON public.profiles;
CREATE POLICY "Admins podem ver todos os perfis"
  ON public.profiles FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Permite que administradores possam atualizar qualquer perfil cadastrado
DROP POLICY IF EXISTS "Admins podem atualizar todos os perfis" ON public.profiles;
CREATE POLICY "Admins podem atualizar todos os perfis"
  ON public.profiles FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Mensagem de finalização
SELECT '✅ Tabela lead_proposals e políticas administrativas configuradas com sucesso.' as status;

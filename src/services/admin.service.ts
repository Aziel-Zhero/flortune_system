// src/services/admin.service.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Profile, LeadProposal, ServiceResponse, ServiceListResponse } from "@/types/database.types";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Helper interno privado para verificar de forma segura no servidor se o usuário chamador
 * está autenticado e possui a role 'admin' no banco de dados.
 */
async function isAdminCaller(): Promise<boolean> {
  if (!supabaseAdmin) return false;
  try {
    const supabaseServer = await createClient();
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();
    if (authError || !user) return false;

    // Busca a role diretamente na tabela profiles usando o cliente admin (bypassing RLS)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) return false;
    return profile.role === 'admin';
  } catch (err) {
    console.error("Erro ao verificar autenticação de admin:", err);
    return false;
  }
}

/**
 * Retorna as estatísticas consolidadas reais de usuários cadastrados por plano
 * para o painel inicial do administrador.
 */
export async function getAdminStats(): Promise<ServiceResponse<{
  total: number;
  cultivador: number;
  mestre: number;
  dev: number;
  corp: number;
}>> {
  const isAuthorized = await isAdminCaller();
  if (!isAuthorized) {
    return { data: null, error: "Acesso não autorizado. Apenas administradores podem visualizar estes dados." };
  }

  try {
    const { data: profiles, error } = await supabaseAdmin!
      .from('profiles')
      .select('plan_id');

    if (error) throw error;

    const total = profiles?.length || 0;
    const cultivador = profiles?.filter(p => p.plan_id === 'tier-cultivador' || !p.plan_id).length || 0;
    const mestre = profiles?.filter(p => p.plan_id === 'tier-mestre').length || 0;
    const dev = profiles?.filter(p => p.plan_id === 'tier-dev').length || 0;
    const corp = profiles?.filter(p => p.plan_id === 'tier-corporativo').length || 0;

    return {
      data: { total, cultivador, mestre, dev, corp },
      error: null
    };
  } catch (err: any) {
    console.error("Erro em getAdminStats:", err.message);
    return { data: null, error: err.message };
  }
}

/**
 * Retorna os dados analíticos reais, incluindo a taxa de conversão real
 * e dados históricos de crescimento (últimos 6 meses).
 */
export async function getAdminAnalytics(): Promise<ServiceResponse<{
  conversionRate: number;
  freeUsers: number;
  paidUsers: number;
  growthData: { month: string; fullMonth: string; count: number }[];
}>> {
  const isAuthorized = await isAdminCaller();
  if (!isAuthorized) {
    return { data: null, error: "Acesso não autorizado." };
  }

  try {
    const { data: profiles, error } = await supabaseAdmin!
      .from('profiles')
      .select('plan_id, created_at');

    if (error) throw error;

    const total = profiles?.length || 0;
    const free = profiles?.filter(p => p.plan_id === 'tier-cultivador' || !p.plan_id).length || 0;
    const paid = total - free;
    const conversionRate = total > 0 ? (paid / total) * 100 : 0;

    const growthData = Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), 5 - i);
      const filtered = profiles?.filter(p => {
        if (!p.created_at) return false;
        const created = new Date(p.created_at);
        return created.getMonth() === d.getMonth() && created.getFullYear() === d.getFullYear();
      });
      return {
        month: format(d, 'MMM', { locale: ptBR }),
        fullMonth: format(d, 'MM/yyyy'),
        count: filtered?.length || 0
      };
    });

    return {
      data: { conversionRate, freeUsers: free, paidUsers: paid, growthData },
      error: null
    };
  } catch (err: any) {
    console.error("Erro em getAdminAnalytics:", err.message);
    return { data: null, error: err.message };
  }
}

/**
 * Busca todos os perfis reais com plano gratuito (leads potenciais).
 */
export async function getLeads(): Promise<ServiceListResponse<Profile>> {
  const isAuthorized = await isAdminCaller();
  if (!isAuthorized) {
    return { data: null, error: "Acesso não autorizado." };
  }

  try {
    const { data: profiles, error } = await supabaseAdmin!
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const freeProfiles = (profiles || []).filter(
      p => p.plan_id === 'tier-cultivador' || !p.plan_id
    );

    return { data: freeProfiles, error: null };
  } catch (err: any) {
    console.error("Erro em getLeads:", err.message);
    return { data: null, error: err.message };
  }
}

/**
 * Busca propostas enviadas ativas salvas no banco de dados.
 */
export async function getProposedLeads(): Promise<ServiceListResponse<LeadProposal>> {
  const isAuthorized = await isAdminCaller();
  if (!isAuthorized) {
    return { data: null, error: "Acesso não autorizado." };
  }

  try {
    const { data, error } = await supabaseAdmin!
      .from('lead_proposals')
      .select('*, profiles:lead_id(*)');

    if (error) {
      if (error.message.includes("relation") && error.message.includes("does not exist")) {
        console.warn("Tabela 'lead_proposals' ainda não foi criada. Retornando array vazio.");
        return { data: [], error: null, isMock: true };
      }
      throw error;
    }

    return { data: data as LeadProposal[], error: null };
  } catch (err: any) {
    console.error("Erro em getProposedLeads:", err.message);
    return { data: null, error: err.message };
  }
}

/**
 * Cria e persiste uma nova proposta/oferta personalizada no banco.
 */
export async function sendLeadOffer(
  leadId: string,
  planId: string,
  offerTitle: string,
  price: number,
  durationMonths: number,
  message: string
): Promise<ServiceResponse<LeadProposal>> {
  const isAuthorized = await isAdminCaller();
  if (!isAuthorized) {
    return { data: null, error: "Acesso não autorizado." };
  }

  try {
    const expiresAt = new Date();
    // A proposta expira em 5 minutos para fins de teste e verificação de expiração rápida
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    const { data, error } = await supabaseAdmin!
      .from('lead_proposals')
      .insert({
        lead_id: leadId,
        plan_id: planId,
        offer_title: offerTitle,
        price: price,
        duration_months: durationMonths,
        message: message,
        expires_at: expiresAt.toISOString()
      })
      .select('*, profiles:lead_id(*)')
      .single();

    if (error) {
      if (error.message.includes("relation") && error.message.includes("does not exist")) {
        throw new Error("A tabela 'lead_proposals' ainda não foi criada no banco de dados. Por favor, execute o script SQL 'docs/leads_schema.sql' no seu SQL Editor do Supabase.");
      }
      throw error;
    }

    return { data: data as LeadProposal, error: null };
  } catch (err: any) {
    console.error("Erro em sendLeadOffer:", err.message);
    return { data: null, error: err.message };
  }
}

/**
 * Remove uma proposta de lead (por exemplo, quando ela expira ou é devolvida).
 */
export async function deleteProposedLead(proposalId: string): Promise<ServiceResponse<boolean>> {
  const isAuthorized = await isAdminCaller();
  if (!isAuthorized) {
    return { data: null, error: "Acesso não autorizado." };
  }

  try {
    const { error } = await supabaseAdmin!
      .from('lead_proposals')
      .delete()
      .eq('id', proposalId);

    if (error) throw error;
    return { data: true, error: null };
  } catch (err: any) {
    console.error("Erro em deleteProposedLead:", err.message);
    return { data: null, error: err.message };
  }
}


// src/services/campaign.service.ts
"use server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { ServiceResponse } from "@/types/database.types";

export interface CampaignData {
    theme: string | null;
    start_date: string | null;
    end_date: string | null;
    discounts: Record<string, number>;
}

export async function getActiveCampaign(): Promise<ServiceResponse<CampaignData | null>> {
    if (!supabaseAdmin) return { data: null, error: "Conexão administrativa indisponível." };
    try {
        const { data, error } = await supabaseAdmin.from('campaign_settings').select('*').eq('id', 1).single();
        if (error) {
            if (error.code === 'PGRST116') return { data: null, error: null };
            if (error.message.includes("relation") && error.message.includes("does not exist")) {
                console.warn("Table 'campaign_settings' missing. Run the database schema.");
                return { data: null, error: "Tabela de campanhas não encontrada no banco de dados." };
            }
            throw error;
        }
        return { data: data as CampaignData | null, error: null };
    } catch (e: any) {
        console.error("Error fetching campaign:", e.message);
        return { data: null, error: e.message };
    }
}

export async function updateCampaign(data: CampaignData): Promise<ServiceResponse<CampaignData>> {
    if (!supabaseAdmin) return { data: null, error: "Conexão administrativa indisponível." };
    try {
        const { data: updated, error } = await supabaseAdmin.from('campaign_settings').upsert({ 
            id: 1, 
            ...data, 
            updated_at: new Date().toISOString() 
        }).select().single();
        
        if (error) {
            if (error.message.includes("relation") && error.message.includes("does not exist")) {
                throw new Error("Erro: A tabela 'campaign_settings' não existe no banco de dados. Execute o script SQL da documentação.");
            }
            throw error;
        }
        return { data: updated as CampaignData, error: null };
    } catch (e: any) {
        console.error("Error updating campaign:", e.message);
        return { data: null, error: e.message };
    }
}

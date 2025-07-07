// src/app/actions/conversion.actions.ts
"use server";

import { z } from "zod";

const currencyConversionSchema = z.object({
  amount: z.number().positive(),
  fromCurrency: z.string().length(3),
  toCurrency: z.string().length(3),
});

interface V6ApiResponse {
  result: 'success' | 'error';
  conversion_result?: number;
  conversion_rate?: number;
  time_last_update_utc?: string;
  'error-type'?: string;
}


interface ConversionResult {
    convertedAmount: number;
    rate: number;
    date: string; 
}


export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<{ data: ConversionResult | null; error: string | null }> {
  const validation = currencyConversionSchema.safeParse({ amount, fromCurrency, toCurrency });
  if (!validation.success) {
    console.error("Validation error in convertCurrency action:", validation.error.flatten().fieldErrors);
    return { data: null, error: "Dados de entrada inválidos." };
  }

  const { amount: validAmount, fromCurrency: validFrom, toCurrency: validTo } = validation.data;
  const apiKey = process.env.EXCHANGERATE_API_KEY;

  if (!apiKey) {
    const errorMsg = "A chave da API de conversão de moeda não está configurada no servidor.";
    console.error(errorMsg);
    return { data: null, error: "Serviço de conversão indisponível." };
  }
  
  const apiUrl = `https://v6.exchangerate-api.com/v6/${apiKey}/pair/${validFrom}/${validTo}/${validAmount}`;

  try {
    const response = await fetch(apiUrl, { next: { revalidate: 3600 } }); // Cache de 1 hora
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`API error (${response.status}): ${errorBody}`);
      return { data: null, error: `Falha ao obter cotação da API (status: ${response.status}). Tente novamente mais tarde.` };
    }

    const data: V6ApiResponse = await response.json();

    if (data.result === 'success' && data.conversion_result && data.conversion_rate && data.time_last_update_utc) {
      return { 
          data: { 
              convertedAmount: data.conversion_result, 
              rate: data.conversion_rate, 
              date: data.time_last_update_utc 
          }, 
          error: null 
      };
    } else {
      const errorMessage = data['error-type'] || "Resposta da API inválida ou incompleta.";
      console.error("API response error:", data);
      return { data: null, error: `Erro da API de conversão: ${errorMessage}` };
    }
  } catch (error: any) {
    console.error("Network or other error in convertCurrency action:", error);
    return { data: null, error: error.message || "Erro de rede ou ao processar a solicitação." };
  }
}

// src/app/actions/conversion.actions.ts
"use server";

import { z } from "zod";
import axios from 'axios';

const currencyConversionSchema = z.object({
  amount: z.number().positive(),
  fromCurrency: z.string().length(3),
  toCurrency: z.string().length(3),
});

// Estrutura de resposta da ExchangeRate-API para o endpoint /pair
interface ExchangeRatePairResponse {
  result: string; // "success" or "error"
  base_code: string;
  target_code: string;
  conversion_rate: number;
  conversion_result?: number; // Opcional, mas útil se a API o fornecer
  time_last_update_utc: string;
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
    const errorMsg = "A chave da API de conversão de moeda (EXCHANGERATE_API_KEY) não está configurada no servidor.";
    console.error(errorMsg);
    return { data: null, error: "Serviço de conversão indisponível." };
  }
  
  // Endpoint da ExchangeRate-API para conversão de par
  const apiUrl = `https://v6.exchangerate-api.com/v6/${apiKey}/pair/${validFrom}/${validTo}/${validAmount}`;

  try {
    const response = await axios.get<ExchangeRatePairResponse>(apiUrl);
    const data = response.data;

    if (data.result === 'success' && data.conversion_result !== undefined) {
      return { 
          data: { 
              convertedAmount: data.conversion_result, 
              rate: data.conversion_rate, 
              date: data.time_last_update_utc,
          }, 
          error: null 
      };
    } else {
      const errorMessage = data['error-type'] || "Resposta da API inválida.";
      console.error("API response error:", data);
      return { data: null, error: `Erro da API de conversão: ${errorMessage}` };
    }
  } catch (error: any) {
    console.error("Network or other error in convertCurrency action:", error);
    if (axios.isAxiosError(error) && error.response) {
      return { data: null, error: `Erro da API: ${error.response.data?.['error-type'] || error.message}` };
    }
    return { data: null, error: error.message || "Erro de rede ou ao processar a solicitação." };
  }
}

// src/app/actions/conversion.actions.ts
"use server";

import { z } from "zod";
import axios from 'axios';

const currencyConversionSchema = z.object({
  amount: z.number().positive(),
  fromCurrency: z.string().length(3),
  toCurrency: z.string().length(3),
});

// Estrutura de resposta da API APILayer
interface APILayerResponse {
  success: boolean;
  query: {
    from: string;
    to: string;
    amount: number;
  };
  info: {
    timestamp: number;
    rate: number;
  };
  date: string; // "YYYY-MM-DD"
  result: number;
  error?: {
    code: string;
    message: string;
  };
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
  
  // Endpoint da APILayer para conversão
  const apiUrl = `https://api.apilayer.com/exchangerates_data/convert?to=${validTo}&from=${validFrom}&amount=${validAmount}`;

  try {
    const response = await axios.get<APILayerResponse>(apiUrl, {
      headers: {
        'apikey': apiKey,
        'Accept': 'application/json'
      },
      // Revalidação de cache (específico do Next.js/Fetch, axios não usa diretamente, mas a lógica se mantém)
    });
    
    const data = response.data;

    if (data.success && data.result) {
      return { 
          data: { 
              convertedAmount: data.result, 
              rate: data.info.rate, 
              date: new Date(data.info.timestamp * 1000).toUTCString(),
          }, 
          error: null 
      };
    } else {
      const errorMessage = data.error?.message || "Resposta da API inválida ou incompleta.";
      console.error("API response error:", data);
      return { data: null, error: `Erro da API de conversão: ${errorMessage}` };
    }
  } catch (error: any) {
    console.error("Network or other error in convertCurrency action:", error);
    if (axios.isAxiosError(error) && error.response) {
      return { data: null, error: `Erro da API: ${error.response.data?.message || error.message}` };
    }
    return { data: null, error: error.message || "Erro de rede ou ao processar a solicitação." };
  }
}

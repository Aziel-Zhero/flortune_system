// src/app/actions/conversion.actions.ts
"use server";

import { z } from "zod";

const currencyConversionSchema = z.object({
  amount: z.number().positive(),
  fromCurrency: z.string().length(3),
  toCurrency: z.string().length(3),
});

interface ConversionApiResponse {
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
  historical: boolean;
  date: string; // YYYY-MM-DD
  result: number;
  error?: {
    code: number;
    type: string;
    info: string;
  }
}

interface ConversionResult {
    convertedAmount: number;
    rate: number;
    date: string; // YYYY-MM-DD
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

  const apiUrl = `https://api.exchangerate.host/convert?from=${validFrom}&to=${validTo}&amount=${validAmount}&source=ecb`;

  try {
    const response = await fetch(apiUrl, { cache: 'no-store' }); 
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`API error (${response.status}): ${errorBody}`);
      return { data: null, error: `Falha ao obter cotação da API (status: ${response.status}). Tente novamente mais tarde.` };
    }

    const data: ConversionApiResponse = await response.json();

    if (data.success && data.result !== undefined && data.info?.rate !== undefined && data.date) {
      return { data: { convertedAmount: data.result, rate: data.info.rate, date: data.date }, error: null };
    } else {
      const errorMessage = data.error?.info || "Resposta da API inválida ou incompleta.";
      console.error("API response missing expected fields or not successful:", data);
      return { data: null, error: errorMessage };
    }
  } catch (error: any) {
    console.error("Network or other error in convertCurrency action:", error);
    return { data: null, error: error.message || "Erro de rede ou ao processar a solicitação." };
  }
}

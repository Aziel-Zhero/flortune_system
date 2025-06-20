
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
  // Adicionado source=ecb para tentar melhorar a confiabilidade, mas pode não ser sempre necessário ou o melhor.

  try {
    // console.log(`Fetching conversion: ${apiUrl}`);
    const response = await fetch(apiUrl, { cache: 'no-store' }); // No-store para obter a cotação mais recente
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`API error (${response.status}): ${errorBody}`);
      return { data: null, error: `Falha ao obter cotação da API (status: ${response.status}). Tente novamente mais tarde.` };
    }

    const data: ConversionApiResponse = await response.json();
    // console.log("API Response Data:", data);

    if (data.success && data.result !== undefined && data.info?.rate !== undefined && data.date) {
      return { data: { convertedAmount: data.result, rate: data.info.rate, date: data.date }, error: null };
    } else {
      console.error("API response missing expected fields or not successful:", data);
      return { data: null, error: data.success === false && (data as any).error?.info ? (data as any).error.info : "Resposta da API inválida ou incompleta." };
    }
  } catch (error: any) {
    console.error("Network or other error in convertCurrency action:", error);
    return { data: null, error: error.message || "Erro de rede ou ao processar a solicitação." };
  }
}

    
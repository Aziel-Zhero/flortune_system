// src/services/quote.service.ts
"use server";

import type { QuoteData, ServiceListResponse } from "@/types/database.types";
import axios from 'axios';

/**
 * Busca cotações diretamente da AwesomeAPI no servidor.
 * Utiliza o endpoint JSON autenticado com token.
 */
export async function getQuotes(codes: string[]): Promise<ServiceListResponse<QuoteData>> {
  if (!codes || codes.length === 0) {
    return { data: [], error: null };
  }

  const query = codes.join(',');
  const token = process.env.AWESOMEAPI_API_KEY;
  
  // Endpoint autenticado: https://economia.awesomeapi.com.br/json/last/{moedas}?token=...
  const apiUrl = `https://economia.awesomeapi.com.br/json/last/${query}${token ? `?token=${token}` : ''}`;
  
  try {
    const response = await axios.get(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });

    const responseData = response.data;
    const dataArray: QuoteData[] = Object.values(responseData);

    if (!dataArray || dataArray.length === 0) {
      return { data: null, error: `Nenhuma cotação encontrada para: ${query}` };
    }

    return { data: dataArray, error: null };

  } catch (error: any) {
    console.error('Erro ao buscar cotações na API externa:', error.message);
    if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
            return { data: null, error: `Uma ou mais cotações (${query}) não foram encontradas na API externa.` };
        }
        if (error.response?.status === 429) {
            return { data: null, error: "Limite de requisições para a API de cotações foi atingido. Tente novamente mais tarde." };
        }
        return { data: null, error: `Erro da API de cotações: ${error.response?.statusText || error.message}` };
    }
    return { data: null, error: "Falha ao buscar dados das cotações na API externa." };
  }
}

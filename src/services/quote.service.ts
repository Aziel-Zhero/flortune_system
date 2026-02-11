// src/services/quote.service.ts
"use server";

import type { QuoteData, ServiceListResponse } from "@/types/database.types";
import axios from 'axios';

// A API interna `/api/quotes` foi removida em favor de uma chamada direta
// do servidor para a API externa, para maior simplicidade e robustez.

export async function getQuotes(codes: string[]): Promise<ServiceListResponse<QuoteData>> {
  if (!codes || codes.length === 0) {
    return { data: [], error: null };
  }

  const query = codes.join(',');
  const apiUrl = `https://economia.awesomeapi.com.br/last/${query}`;
  
  try {
    const response = await axios.get(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
      }
    });

    const responseData = response.data;
    
    // A API retorna os dados em um objeto onde as chaves são os códigos das moedas
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

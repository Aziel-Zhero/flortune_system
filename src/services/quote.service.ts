// src/services/quote.service.ts
"use server";
import axios from 'axios';

export interface QuoteData {
  code: string;
  codein: string;
  name: string;
  high: string;
  low: string;
  varBid: string;
  pctChange: string;
  bid: string;
  ask: string;
  timestamp: string;
  create_date: string;
}

interface ApiResponse {
  [key: string]: QuoteData;
}

export async function getQuotes(
  quotes: string[]
): Promise<{ data: QuoteData[] | null; error: string | null }> {
  if (!quotes || quotes.length === 0) {
    return { data: [], error: null };
  }

  const uniqueQuotes = [...new Set(quotes)];
  const query = uniqueQuotes.join(',');
  const apiUrl = `https://economia.awesomeapi.com.br/last/${query}`;

  try {
    const response = await axios.get<ApiResponse>(apiUrl);
    
    // A API pode retornar 200 OK mesmo que algumas cotações não sejam encontradas.
    // Precisamos filtrar a resposta para incluir apenas as cotações que realmente foram retornadas.
    const responseData = response.data;
    const dataArray: QuoteData[] = [];

    uniqueQuotes.forEach(quoteCode => {
      // A API retorna a chave sem o hífen, ex: "USDBRL" para a query "USD-BRL"
      const responseKey = quoteCode.replace('-', ''); 
      if (responseData && responseData[responseKey]) {
        dataArray.push(responseData[responseKey]);
      }
    });

    if (dataArray.length === 0 && uniqueQuotes.length > 0) {
        return { data: null, error: `Nenhuma das cotações solicitadas (${query}) foi encontrada.` };
    }
    
    return { data: dataArray, error: null };
  } catch (error: any) {
    console.error('Erro ao buscar cotações na API (AwesomeAPI):', error.message);
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return { data: null, error: `Uma ou mais cotações (${query}) não foram encontradas. Verifique os códigos.` };
    }
    return { data: null, error: 'Falha ao buscar dados das cotações na API externa.' };
  }
}

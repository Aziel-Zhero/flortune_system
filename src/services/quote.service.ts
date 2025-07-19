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
  
  const apiKey = process.env.AWESOMEAPI_API_KEY;
  const uniqueQuotes = [...new Set(quotes)];
  const query = uniqueQuotes.join(',');
  let apiUrl = `https://economia.awesomeapi.com.br/last/${query}`;
  
  // Anexa a chave da API à URL se ela estiver disponível
  if (apiKey) {
    apiUrl += `?token=${apiKey}`;
  }

  try {
    const response = await axios.get<ApiResponse>(apiUrl);
    
    const responseData = response.data;
    const dataArray: QuoteData[] = [];

    // Itera sobre as cotações solicitadas para construir o array de resposta na ordem correta
    // e para lidar com respostas de API que podem não incluir todas as cotações solicitadas (ex: IBOV)
    uniqueQuotes.forEach(quoteCode => {
      const responseKey = quoteCode.replace('-', ''); // A API retorna "USDBRL" para a query "USD-BRL"
      if (responseData && responseData[responseKey]) {
        dataArray.push(responseData[responseKey]);
      }
    });

    if (dataArray.length === 0 && uniqueQuotes.length > 0) {
        return { data: null, error: `Nenhuma das cotações solicitadas (${query}) foi encontrada.` };
    }
    
    return { data: dataArray, error: null };
  } catch (error: any) {
    console.error('Erro ao buscar cotações na API:', error.message);
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return { data: null, error: `Uma ou mais cotações (${query}) não foram encontradas. Verifique os códigos.` };
    }
    return { data: null, error: 'Falha ao buscar dados das cotações na API externa.' };
  }
}

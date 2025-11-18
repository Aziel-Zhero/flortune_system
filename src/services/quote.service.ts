// src/services/quote.service.ts
"use server";
import axios from 'axios';
import type { QuoteData } from '@/types/database.types';

interface AwesomeApiResponse {
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
    const response = await axios.get<AwesomeApiResponse>(apiUrl);
    
    // The API might return 200 OK even if some quotes are not found.
    // We need to filter the response to include only the quotes that were actually returned.
    const responseData = response.data;
    const dataArray: QuoteData[] = [];

    uniqueQuotes.forEach(quoteCode => {
      // The response key from the API removes the hyphen, e.g., "USD-BRL" becomes "USDBRL"
      const responseKey = quoteCode.replace('-', ''); 
      if (responseData && responseData[responseKey]) {
        dataArray.push(responseData[responseKey]);
      }
    });

    if (dataArray.length === 0 && uniqueQuotes.length > 0) {
        // This case handles when none of the requested quotes were found in the response.
        return { data: null, error: `Nenhuma das cotações solicitadas (${query}) foi encontrada.` };
    }
    
    return { data: dataArray, error: null };
  } catch (error: any) {
    console.error('Erro ao buscar cotações na API externa:', error.message);
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return { data: null, error: `Uma ou mais cotações (${query}) não foram encontradas. Verifique os códigos.` };
    }
    return { data: null, error: 'Falha ao buscar dados das cotações na API externa.' };
  }
}

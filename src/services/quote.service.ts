
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
    const response = await axios.get<ApiResponse | QuoteData>(apiUrl);
    
    // A API tem um comportamento diferente para uma vs. múltiplas cotações.
    // Se for apenas uma, ela não retorna um objeto com a chave, mas o objeto direto.
    // Se forem múltiplas, retorna um objeto com chaves.
    let dataArray: QuoteData[];
    
    if (uniqueQuotes.length === 1) {
      // Se pedimos apenas uma, a API pode retornar o objeto diretamente.
      const singleQuoteKey = uniqueQuotes[0].replace('-', '');
      dataArray = [response.data[singleQuoteKey as keyof typeof response.data] as QuoteData];
    } else {
      // Se pedimos múltiplas, a API retorna um objeto com as chaves
      dataArray = Object.values(response.data);
    }

    if (!dataArray || dataArray.some(item => item === undefined)) {
        // Isso pode acontecer se uma das cotações for inválida.
        // O `Object.values` retornaria undefined para essa chave.
        console.error('Erro: Uma ou mais cotações resultaram em "undefined". Resposta da API:', response.data);
        return { data: null, error: `Uma ou mais cotações (${query}) não foram encontradas.` };
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

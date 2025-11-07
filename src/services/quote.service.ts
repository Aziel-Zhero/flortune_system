// src/services/quote.service.ts
"use server";
import axios from 'axios';

// A resposta da APILayer para o endpoint /latest
// não retorna todos esses campos. Ajustamos a interface para
// corresponder ao que é realmente retornado.
export interface QuoteData {
  code: string;       // ex: "USD"
  codein: string;     // ex: "BRL"
  name: string;       // ex: "Dólar Americano/Real Brasileiro"
  bid: string;        // A taxa de conversão
  pctChange?: string; // Não fornecido por esta API
  varBid?: string;    // Não fornecido por esta API
}

interface APILayerLatestResponse {
  success: boolean;
  timestamp: number;
  base: string;
  date: string; // "YYYY-MM-DD"
  rates: {
    [key: string]: number; // ex: { "BRL": 5.45, "EUR": 0.92 }
  };
  error?: {
    code: number;
    message: string;
  };
}

export async function getQuotes(
  symbols: string[],
  base: string = 'BRL'
): Promise<{ data: QuoteData[] | null; error: string | null }> {
  if (!symbols || symbols.length === 0) {
    return { data: [], error: null };
  }

  const uniqueSymbols = [...new Set(symbols)];
  const querySymbols = uniqueSymbols.join(',');
  const apiKey = process.env.EXCHANGERATE_API_KEY;

  if (!apiKey) {
    const errorMsg = "A chave da API de conversão de moeda (EXCHANGERATE_API_KEY) não está configurada no servidor.";
    console.error(errorMsg);
    return { data: null, error: "Serviço de cotações indisponível." };
  }

  const apiUrl = `https://api.apilayer.com/exchangerates_data/latest?symbols=${querySymbols}&base=${base}`;

  try {
    const response = await axios.get<APILayerLatestResponse>(apiUrl, {
      headers: {
        'apikey': apiKey,
        'Accept': 'application/json'
      }
    });

    const apiData = response.data;
    if (!apiData.success || !apiData.rates) {
      throw new Error(apiData.error?.message || 'Resposta inválida da API de cotações.');
    }

    const dataArray: QuoteData[] = Object.entries(apiData.rates).map(([code, rate]) => {
        // A API retorna a cotação em relação à base. Para exibir, precisamos inverter.
        // Se a base é BRL e queremos USD, a API dá BRL->USD. O usuário espera USD->BRL.
        const inverseRate = 1 / rate;
        
        return {
            code: code,
            codein: base,
            name: `${code}/${base}`,
            bid: inverseRate.toFixed(4), // O valor de 1 Unidade da Moeda em BRL
        };
    });

    return { data: dataArray, error: null };
  } catch (error: any) {
    console.error('Erro ao buscar cotações na API (APILayer):', error.message);
    if (axios.isAxiosError(error) && error.response) {
      return { data: null, error: `Erro da API: ${error.response.data?.message || error.message}` };
    }
    return { data: null, error: 'Falha ao buscar dados das cotações na API externa.' };
  }
}

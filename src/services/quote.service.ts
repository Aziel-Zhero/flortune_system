// src/services/quote.service.ts
"use server";
import axios from 'axios';

// A resposta da exchangerate-api.com para o endpoint /latest
export interface QuoteData {
  code: string;       // ex: "USD"
  codein: string;     // ex: "BRL"
  name: string;       // ex: "USD/BRL"
  bid: string;        // A taxa de conversão
  pctChange?: string; // Não fornecido por esta API
  varBid?: string;    // Não fornecido por esta API
}

interface ExchangeRateApiResponse {
  result: string; // "success" or "error"
  base_code: string;
  conversion_rates: {
    [key: string]: number; // ex: { "USD": 0.18, "EUR": 0.17 }
  };
  time_last_update_utc: string;
  'error-type'?: string;
}

export async function getQuotes(
  symbols: string[],
  base: string = 'BRL'
): Promise<{ data: QuoteData[] | null; error: string | null }> {
  if (!symbols || symbols.length === 0) {
    return { data: [], error: null };
  }

  const apiKey = process.env.EXCHANGERATE_API_KEY;

  if (!apiKey) {
    const errorMsg = "A chave da API de conversão (EXCHANGERATE_API_KEY) não está configurada no servidor.";
    console.error(errorMsg);
    return { data: null, error: "Serviço de cotações indisponível." };
  }
  
  // A API gratuita da ExchangeRate-API não permite mudar a base em um único request para múltiplos símbolos.
  // A estratégia é pegar as cotações em relação ao USD (base comum) e depois converter para BRL.
  // No entanto, para simplificar e usar a chave gratuita, vamos buscar a cotação de BRL para as outras moedas.
  const apiUrl = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${base}`;

  try {
    const response = await axios.get<ExchangeRateApiResponse>(apiUrl);
    const apiData = response.data;

    if (apiData.result !== 'success' || !apiData.conversion_rates) {
      throw new Error(apiData['error-type'] || 'Resposta inválida da API de cotações.');
    }
    
    // Filtramos apenas os símbolos que pedimos
    const requestedRates = symbols
      .map(symbol => {
          if (apiData.conversion_rates[symbol]) {
              return {
                  code: symbol,
                  codein: base,
                  name: `${symbol}/${base}`,
                  // A API nos dá quanto 1 BRL vale em USD. O usuário quer o contrário.
                  bid: (1 / apiData.conversion_rates[symbol]).toFixed(4), 
              };
          }
          return null;
      })
      .filter((q): q is QuoteData => !!q);
      
    return { data: requestedRates, error: null };

  } catch (error: any) {
    console.error('Erro ao buscar cotações na API (ExchangeRate-API):', error.message);
    if (axios.isAxiosError(error) && error.response) {
       const apiError = error.response.data['error-type'];
       if (apiError === 'unsupported-code') return { data: null, error: `Moeda de base (${base}) não suportada no plano atual.`};
       return { data: null, error: `Erro da API: ${apiError || error.message}` };
    }
    return { data: null, error: 'Falha ao buscar dados das cotações na API externa.' };
  }
}

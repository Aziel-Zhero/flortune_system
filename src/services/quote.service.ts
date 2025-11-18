// src/services/quote.service.ts
import type { QuoteData, ServiceListResponse } from "@/types/database.types";

/**
 * Fetches quote data from the internal API route.
 * This function is meant to be called from the client-side.
 * @param quotes - An array of quote codes to fetch (e.g., ['USD-BRL', 'EUR-BRL']).
 */
export async function getQuotes(
  quotes: string[]
): Promise<ServiceListResponse<QuoteData>> {
  if (!quotes || quotes.length === 0) {
    return { data: [], error: null };
  }

  const queryString = quotes.join(',');
  const internalApiUrl = `/api/quotes?codes=${encodeURIComponent(queryString)}`;

  try {
    const response = await fetch(internalApiUrl);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.isMock) {
       console.warn('⚠️ Usando dados simulados de cotações - API externa pode estar indisponível.');
    }
    
    return { data: result.data, error: result.error || null };

  } catch (error: any) {
    console.error('Falha ao buscar cotações do serviço interno:', error.message);
    return { data: null, error: "Não foi possível conectar ao nosso serviço de cotações." };
  }
}

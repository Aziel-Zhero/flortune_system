// src/services/quote.service.ts
"use server";
import type { QuoteData } from '@/types/database.types';

// This function now calls our own API route, which acts as a proxy.
export async function getQuotes(
  quotes: string[]
): Promise<{ data: QuoteData[] | null; error: string | null }> {
  if (!quotes || quotes.length === 0) {
    return { data: [], error: null };
  }

  const uniqueQuotes = [...new Set(quotes)];
  const query = uniqueQuotes.join(',');
  
  try {
    // Construct the URL to our internal API route.
    // This should work reliably in both server and client environments.
    const internalApiUrl = `/api/quotes?codes=${query}`;
    
    // We assume fetch is available in this environment (Next.js server actions / client)
    const response = await fetch(internalApiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Cache the response to avoid hitting the API too often
      next: { revalidate: 600 } // 10-minute cache
    });

    const result = await response.json();

    if (!response.ok) {
      // If the response is not OK, our API route should have sent an error message.
      throw new Error(result.error || `Falha na requisição com status ${response.status}`);
    }
    
    return { data: result.data, error: null };

  } catch (error: any) {
    console.error('Erro ao buscar cotações do serviço interno:', error);
    return { data: null, error: 'Não foi possível conectar ao nosso serviço de cotações.' };
  }
}

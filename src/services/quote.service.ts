// src/services/quote.service.ts
"use server";

import type { QuoteData } from '@/types/database.types';

export async function getQuotes(
  quotes: string[]
): Promise<{ data: QuoteData[] | null; error: string | null }> {
  if (!quotes || quotes.length === 0) {
    return { data: [], error: null };
  }

  const uniqueQuotes = [...new Set(quotes)];
  const query = uniqueQuotes.join(',');

  try {
    // A chamada agora é para a nossa própria API route, que lida com a API externa.
    // Usamos uma URL absoluta para garantir que funcione tanto no lado do servidor quanto no cliente.
    const internalApiUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/quotes?codes=${query}`;
    
    const response = await fetch(internalApiUrl, {
        next: { revalidate: 600 } // Cache de 10 minutos
    });
    
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Falha ao buscar cotações no servidor interno.');
    }
    
    return { data: data.data, error: null };
    
  } catch (error: any) {
    console.error('Erro ao buscar cotações no serviço interno:', error.message);
    return { data: null, error: 'Não foi possível conectar ao nosso serviço de cotações.' };
  }
}

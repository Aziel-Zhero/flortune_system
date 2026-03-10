
// src/app/api/quotes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import type { QuoteData } from '@/types/database.types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const codes = searchParams.get('codes');
  
  if (!codes) {
    return NextResponse.json(
      { error: 'Parâmetro "codes" é obrigatório.' },
      { status: 400 }
    );
  }

  const uniqueQuotes = [...new Set(codes.split(','))];
  const query = uniqueQuotes.join(',');
  const apiUrl = `https://economia.awesomeapi.com.br/last/${query}`;

  try {
    const response = await axios.get(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 8000
    });

    const responseData = response.data;
    
    if (!responseData || Object.keys(responseData).length === 0) {
        return NextResponse.json({ data: [], error: 'Nenhum dado retornado da API externa.' });
    }

    const dataArray: QuoteData[] = Object.values(responseData);
    
    const res = NextResponse.json({ data: dataArray, error: null });
    // Cache severo de borda para mitigar 429
    res.headers.set('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res;

  } catch (error: any) {
    console.error('Erro na API route de cotações:', error.message);
    
    if (axios.isAxiosError(error)) {
        const status = error.response?.status || 500;
        if (status === 429) {
            return NextResponse.json({ error: "Erro da API externa: Too Many Requests" }, { status: 429 });
        }
        return NextResponse.json({ error: `Erro da API externa: ${error.message}` }, { status });
    }
    
    return NextResponse.json({ 
      error: `Falha ao buscar dados das cotações. Detalhes: ${error.message}`
    }, { status: 500 });
  }
}

// src/app/api/quotes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import type { QuoteData } from '@/types/database.types';

// Interface para a resposta da AwesomeAPI
interface AwesomeApiResponse {
  [key: string]: any;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const codes = searchParams.get('codes');
  
  if (!codes) {
    return NextResponse.json(
      { error: 'Parâmetro "codes" é obrigatório' },
      { status: 400 }
    );
  }

  const quoteArray = codes.split(',');
  const uniqueQuotes = [...new Set(quoteArray)];
  const query = uniqueQuotes.join(',');
  const apiUrl = `https://economia.awesomeapi.com.br/last/${query}`;

  try {
    // Use Next.js's extended fetch to cache the result for 10 minutes (600 seconds)
    const response = await fetch(apiUrl, {
      next: { revalidate: 600 },
      headers: {
        'User-Agent': 'FlortuneApp/1.0',
      }
    });

    if (!response.ok) {
       // A API pode retornar 404 se nenhuma cotação for encontrada, tratamos isso como um erro.
       const errorData = await response.json();
       const errorMessage = errorData.message || `API externa retornou status: ${response.status}`;
       console.error("External API error:", errorMessage);
       return NextResponse.json({ error: errorMessage }, { status: response.status });
    }
    
    const responseData: AwesomeApiResponse = await response.json();
    const dataArray: QuoteData[] = [];

    uniqueQuotes.forEach(quoteCode => {
      const responseKey = quoteCode.replace('-', '');
      if (responseData && responseData[responseKey]) {
        const quoteData = Array.isArray(responseData[responseKey]) ? responseData[responseKey][0] : responseData[responseKey];
        dataArray.push(quoteData);
      }
    });

    if (dataArray.length === 0) {
       return NextResponse.json({ 
        error: `Nenhuma das cotações solicitadas (${query}) foi encontrada na API externa.` 
      }, { status: 404 });
    }

    return NextResponse.json({ data: dataArray, error: null });

  } catch (error: any) {
    console.error('❌ Erro na rota da API de cotações:', error.message);
    
    return NextResponse.json({ 
      error: `Falha ao processar a solicitação para a API externa. Detalhes: ${error.message}`
    }, { status: 500 });
  }
}

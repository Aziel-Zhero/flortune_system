// src/app/api/quotes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import type { QuoteData } from '@/types/database.types';

// Interface para a resposta da AwesomeAPI, que pode ser um objeto ou um array
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
    const response = await axios.get<AwesomeApiResponse>(apiUrl, {
      timeout: 5000, // Timeout de 5 segundos
    });
    
    const responseData = response.data;
    const dataArray: QuoteData[] = [];

    uniqueQuotes.forEach(quoteCode => {
      const responseKey = quoteCode.replace('-', '');
      if (responseData && responseData[responseKey]) {
        // A API pode retornar um objeto ou um array de objetos
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
      error: `Falha ao buscar dados das cotações na API externa. Detalhes: ${error.message}`
    }, { status: 500 });
  }
}

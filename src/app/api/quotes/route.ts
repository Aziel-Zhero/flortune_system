// src/app/api/quotes/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import axios from 'axios';
import type { QuoteData } from '@/types/database.types';

interface AwesomeApiResponse {
  [key: string]: QuoteData;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const codes = searchParams.get('codes');

  if (!codes) {
    return NextResponse.json({ error: 'O parâmetro "codes" é obrigatório.' }, { status: 400 });
  }

  const uniqueQuotes = [...new Set(codes.split(','))];
  const query = uniqueQuotes.join(',');
  const apiUrl = `https://economia.awesomeapi.com.br/last/${query}`;

  try {
    const response = await axios.get<AwesomeApiResponse>(apiUrl);
    
    const responseData = response.data;
    const dataArray: QuoteData[] = [];

    uniqueQuotes.forEach(quoteCode => {
      const responseKey = quoteCode.replace('-', ''); 
      if (responseData && responseData[responseKey]) {
        dataArray.push(responseData[responseKey]);
      }
    });

    if (dataArray.length === 0) {
      return NextResponse.json({ error: `Nenhuma das cotações solicitadas (${query}) foi encontrada.` }, { status: 404 });
    }
    
    return NextResponse.json({ data: dataArray });

  } catch (error: any) {
    console.error('Erro na API route de cotações ao chamar a API externa:', error.message);
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return NextResponse.json({ error: `Uma ou mais cotações não foram encontradas na API externa.` }, { status: 404 });
    }
    return NextResponse.json({ error: 'Falha ao buscar dados das cotações no serviço externo.' }, { status: 500 });
  }
}

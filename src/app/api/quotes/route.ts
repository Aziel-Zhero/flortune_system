// src/app/api/quotes/route.ts
import { NextResponse } from 'next/server';
import axios from 'axios';
import type { QuoteData } from '@/types/database.types';

// Estrutura de resposta da AwesomeAPI
interface AwesomeApiResponse {
  [key: string]: QuoteData;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const codes = searchParams.get('codes');

  if (!codes) {
    return NextResponse.json({ error: 'Parâmetro "codes" é obrigatório.' }, { status: 400 });
  }

  const uniqueQuotes = [...new Set(codes.split(','))];
  const query = uniqueQuotes.join(',');
  const apiUrl = `https://economia.awesomeapi.com.br/last/${query}`;

  try {
    const response = await axios.get<AwesomeApiResponse>(apiUrl);
    const responseData = response.data;

    // A API pode retornar 200 OK mesmo que algumas cotações não sejam encontradas.
    // Filtramos para garantir que retornamos apenas os dados válidos.
    const dataArray: QuoteData[] = [];
    uniqueQuotes.forEach(quoteCode => {
      // A chave da resposta remove o hífen (ex: USD-BRL -> USDBRL)
      const responseKey = quoteCode.replace('-', ''); 
      if (responseData && responseData[responseKey]) {
        dataArray.push(responseData[responseKey]);
      }
    });

    if (dataArray.length === 0) {
      return NextResponse.json({ error: `Nenhuma das cotações solicitadas (${query}) foi encontrada na API externa.` }, { status: 404 });
    }
    
    return NextResponse.json({ data: dataArray });

  } catch (error: any) {
    console.error('Erro ao buscar dados na API externa (AwesomeAPI):', error.message);
    if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
            return NextResponse.json({ error: `Recurso não encontrado na API de cotações para: ${query}` }, { status: 404 });
        }
        return NextResponse.json({ error: `Erro da API externa: ${error.response?.statusText || error.message}` }, { status: error.response?.status || 500 });
    }
    return NextResponse.json({ error: 'Erro interno do servidor ao processar a solicitação de cotações.' }, { status: 500 });
  }
}

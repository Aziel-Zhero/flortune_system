// src/app/api/quotes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import type { QuoteData } from '@/types/database.types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const codes = searchParams.get('codes');
  const token = process.env.AWESOMEAPI_API_KEY;
  
  if (!codes) {
    return NextResponse.json(
      { error: 'Parâmetro "codes" é obrigatório.' },
      { status: 400 }
    );
  }

  // Limpa os códigos e remove duplicatas
  const uniqueQuotes = [...new Set(codes.split(',').map(c => c.trim()).filter(c => c))];
  const query = uniqueQuotes.join(',');
  
  // Endpoint oficial conforme documentação: https://economia.awesomeapi.com.br/json/last/{moedas}
  // Se houver token, adiciona como query param
  const apiUrl = `https://economia.awesomeapi.com.br/json/last/${query}${token ? `?token=${token}` : ''}`;

  try {
    const response = await axios.get(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 15000 // Aumentado para 15s para maior estabilidade
    });

    const responseData = response.data;
    
    if (!responseData || Object.keys(responseData).length === 0) {
        return NextResponse.json({ data: [], error: 'Nenhum dado retornado da API externa.' });
    }

    // A API retorna um objeto onde as chaves são os pares colados (ex: USDBRL)
    // Convertemos para um array para facilitar o consumo no front-end
    const dataArray: QuoteData[] = Object.values(responseData);
    
    const res = NextResponse.json({ data: dataArray, error: null });
    
    // Cache de borda por 5 minutos para evitar excesso de requisições
    res.headers.set('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    
    return res;

  } catch (error: any) {
    console.error('Erro na API route de cotações:', error.message);
    
    if (axios.isAxiosError(error)) {
        const status = error.response?.status || 500;
        if (status === 429) {
            return NextResponse.json(
                { error: "Limite de requisições atingido na AwesomeAPI. Tente novamente em instantes." }, 
                { status: 429 }
            );
        }
        return NextResponse.json(
            { error: `Erro na comunicação com AwesomeAPI: ${error.message}` }, 
            { status }
        );
    }
    
    return NextResponse.json({ 
      error: `Falha ao buscar dados das cotações. Detalhes: ${error.message}`
    }, { status: 500 });
  }
}

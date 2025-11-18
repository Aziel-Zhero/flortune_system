// src/app/api/quotes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

interface AwesomeApiResponse {
  [key: string]: {
    code: string;
    codein: string;
    name: string;
    high: string;
    low: string;
    varBid: string;
    pctChange: string;
    bid: string;
    ask: string;
    timestamp: string;
    create_date: string;
  };
}

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
    const response = await fetch(apiUrl, {
      next: { revalidate: 600 }, // Cache de 10 minutos
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`API externa respondeu com status: ${response.status}`);
    }

    const responseData = await response.json();
    
    const dataArray = Object.values(responseData);

    if (dataArray.length === 0) {
      return NextResponse.json(
        { error: `Nenhuma cotação encontrada para: ${query}` },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ data: dataArray, error: null });

  } catch (error: any) {
    console.error('Erro na API route de cotações:', error.message);
    return NextResponse.json({ 
      error: `Falha ao buscar dados das cotações na API externa. Detalhes: ${error.message}`
    }, { status: 500 });
  }
}

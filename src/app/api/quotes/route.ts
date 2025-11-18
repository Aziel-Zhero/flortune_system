// src/app/api/quotes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import type { QuoteData } from '@/types/database.types';

// Interface para a resposta da AwesomeAPI, que pode ser um objeto ou um array
interface AwesomeApiResponse {
  [key: string]: any;
}

// Gera dados mock para fallback em caso de erro da API externa
function generateMockQuotes(quotes: string[]): QuoteData[] {
  const mockRates: { [key: string]: { bid: number; ask: number; name: string } } = {
    'USD-BRL': { bid: 5.25, ask: 5.26, name: 'Dólar Americano/Real Brasileiro' },
    'EUR-BRL': { bid: 5.65, ask: 5.66, name: 'Euro/Real Brasileiro' },
    'GBP-BRL': { bid: 6.70, ask: 6.71, name: 'Libra Esterlina/Real Brasileiro' },
    'BTC-BRL': { bid: 320000, ask: 321000, name: 'Bitcoin/Real Brasileiro' },
    'JPY-BRL': { bid: 0.033, ask: 0.034, name: 'Iene Japonês/Real Brasileiro' },
    'IBOV': { bid: 120000, ask: 120000, name: 'Ibovespa' },
  };

  return quotes.map(quoteCode => {
    const defaultRate = { bid: 1.0, ask: 1.0, name: quoteCode };
    const rate = mockRates[quoteCode] || defaultRate;
    
    return {
      code: quoteCode.split('-')[0],
      codein: quoteCode.split('-')[1] || 'BRL',
      name: rate.name,
      bid: String(rate.bid),
      ask: String(rate.ask),
      timestamp: new Date().getTime().toString(),
      high: String(rate.bid * 1.02),
      low: String(rate.bid * 0.98),
      pctChange: String(Math.random() * 2 - 1), // Variação aleatória entre -1 e 1
      varBid: String(rate.bid * (Math.random() * 0.01 - 0.005)),
      create_date: new Date().toISOString(),
      isMock: true
    };
  });
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
      timeout: 10000, // Timeout de 10 segundos
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
      // Se a API respondeu mas não encontrou nenhuma cotação
       return NextResponse.json({ 
        data: generateMockQuotes(uniqueQuotes), 
        error: `API externa não retornou dados para ${query}, usando dados simulados.`,
        isMock: true 
      });
    }

    return NextResponse.json({ data: dataArray, error: null });

  } catch (error: any) {
    console.error('❌ Erro na rota da API de cotações:', error.message);
    
    // Retorna dados mock em caso de erro de rede ou timeout
    const mockData = generateMockQuotes(uniqueQuotes);
    return NextResponse.json({ 
      data: mockData, 
      error: 'API externa indisponível, usando dados simulados.',
      isMock: true 
    });
  }
}

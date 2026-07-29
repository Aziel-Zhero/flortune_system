// src/app/api/quotes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const codes = searchParams.get('codes');
  const token = process.env.AWESOMEAPI_API_KEY;
  
  if (!codes) {
    return NextResponse.json({ error: 'Parâmetro "codes" é obrigatório.' }, { status: 400 });
  }

  const requestedCodes = [...new Set(codes.split(',').map(c => c.trim()).filter(Boolean))].slice(0, 5);

  try {
    // Consultas individuais evitam que uma cotação indisponível faça a API
    // descartar as demais no mesmo lote.
    const results = await Promise.allSettled(requestedCodes.map(async (code) => {
      const apiUrl = `https://economia.awesomeapi.com.br/json/last/${code}${token ? `?token=${token}` : ''}`;
      const response = await axios.get(apiUrl, { headers: { 'User-Agent': 'FlortuneApp/1.0' }, timeout: 10000 });
      return Object.values(response.data || {})[0];
    }));
    const dataArray = results.flatMap(result => result.status === 'fulfilled' && result.value ? [result.value] : []);
    if (dataArray.length === 0) throw new Error('Nenhuma cotação pôde ser carregada.');
    
    const res = NextResponse.json({ data: dataArray, error: null });
    res.headers.set('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res;

  } catch (error: any) {
    console.error('Quotes API Error:', error.message);
    const status = error.response?.status || 500;
    return NextResponse.json({ error: status === 429 ? 'Too Many Requests' : error.message }, { status });
  }
}

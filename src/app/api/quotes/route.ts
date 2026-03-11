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

  const query = codes.split(',').map(c => c.trim()).filter(Boolean).join(',');
  const apiUrl = `https://economia.awesomeapi.com.br/json/last/${query}${token ? `?token=${token}` : ''}`;

  try {
    const response = await axios.get(apiUrl, {
      headers: { 'User-Agent': 'FlortuneApp/1.0' },
      timeout: 10000
    });

    const dataArray = Object.values(response.data || {});
    
    const res = NextResponse.json({ data: dataArray, error: null });
    res.headers.set('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res;

  } catch (error: any) {
    console.error('Quotes API Error:', error.message);
    const status = error.response?.status || 500;
    return NextResponse.json({ error: status === 429 ? 'Too Many Requests' : error.message }, { status });
  }
}

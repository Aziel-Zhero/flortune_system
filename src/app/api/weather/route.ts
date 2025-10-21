// src/app/api/weather/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city');
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    console.error("OPENWEATHERMAP_API_KEY is not configured.");
    return NextResponse.json({ error: 'Serviço de clima indisponível. A chave da API não foi configurada no servidor.' }, { status: 503 });
  }

  if (!city) {
    return NextResponse.json({ error: 'Parâmetro "city" é obrigatório.' }, { status: 400 });
  }

  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=pt_br`;

  try {
    const response = await fetch(apiUrl, {
      next: { revalidate: 600 } // Cache de 10 minutos
    });
    
    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.message === 'city not found' 
        ? 'Cidade não encontrada.' 
        : data.message === 'Invalid API key. Please see https://openweathermap.org/faq#error401 for more info.'
        ? 'Chave da API inválida.'
        : `Erro da API de clima: ${data.message}`;
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

    const weatherData = {
      city: data.name,
      temperature: data.main.temp,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
    };

    return NextResponse.json(weatherData);

  } catch (error) {
    console.error("Erro interno ao buscar clima:", error);
    return NextResponse.json({ error: 'Falha ao se conectar com o serviço de clima.' }, { status: 500 });
  }
}

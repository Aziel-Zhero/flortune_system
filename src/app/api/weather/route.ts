
// src/app/api/weather/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city');
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'Chave da API do OpenWeatherMap não configurada no servidor.' }, { status: 500 });
  }

  if (!city) {
    return NextResponse.json({ error: 'Parâmetro "city" é obrigatório.' }, { status: 400 });
  }

  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=pt_br`;

  try {
    const response = await fetch(apiUrl, {
      next: { revalidate: 600 } // Cache de 10 minutos
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.message === 'city not found' ? 'Cidade não encontrada.' : `Erro da API de clima: ${errorData.message}`;
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }
    
    const data = await response.json();

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

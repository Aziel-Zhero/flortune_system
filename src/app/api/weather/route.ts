
// src/app/api/weather/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city');
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;

  if (!city) {
    return NextResponse.json({ error: 'City is required' }, { status: 400 });
  }

  if (!apiKey || apiKey === 'SUA_CHAVE_API_AQUI') {
    const errorMsg = "A chave da API OpenWeatherMap não está configurada no servidor.";
    console.error(errorMsg);
    return NextResponse.json({ error: 'Serviço de clima indisponível (API Key não configurada).', message: errorMsg }, { status: 503 });
  }

  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=pt_br`;

  try {
    const response = await fetch(apiUrl, {
      next: { revalidate: 3600 } // Cache por 1 hora
    });
    
    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.message || `Failed to fetch weather data for city: ${city}`;
      console.error(`OpenWeatherMap API Error (${response.status}):`, data);
      let friendlyMessage = `Falha ao buscar dados para "${city}".`;
      if (response.status === 404) {
          friendlyMessage = `Cidade "${city}" não encontrada. Verifique o nome.`;
      } else if (response.status === 401) {
          friendlyMessage = "Chave da API inválida.";
      }
      return NextResponse.json({ error: friendlyMessage, details: errorMessage }, { status: response.status });
    }
    
    // Limpa a resposta para enviar apenas os dados necessários ao frontend
    const cleanedData = {
        city: data.name,
        temperature: data.main.temp,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
    };

    return NextResponse.json(cleanedData);

  } catch (error) {
    console.error("Error fetching weather data:", error);
    return NextResponse.json({ error: 'Falha de conexão com o serviço de clima.' }, { status: 500 });
  }
}

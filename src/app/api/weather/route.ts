
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city');
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;

  if (!city) {
    return NextResponse.json({ error: 'City is required' }, { status: 400 });
  }

  if (!apiKey) {
    console.error("OpenWeatherMap API key is not configured on the server.");
    return NextResponse.json({ error: 'Weather service is not configured.' }, { status: 500 });
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
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return NextResponse.json({ error: 'Failed to connect to weather service.' }, { status: 500 });
  }
}

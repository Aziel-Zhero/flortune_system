
// src/app/api/weather/route.ts
import { NextResponse } from 'next/server';

// Esta API foi desativada temporariamente junto com a funcionalidade de clima.
export async function GET(request: Request) {
  return NextResponse.json({ error: 'Serviço de clima desativado temporariamente.' }, { status: 503 });
}

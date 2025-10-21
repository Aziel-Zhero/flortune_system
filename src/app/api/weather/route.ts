
// src/app/api/weather/route.ts
import { NextResponse } from 'next/server';

// Esta API foi desativada e a funcionalidade de clima removida da aplicação.
// Manter o arquivo evita erros de build se alguma importação residual ainda existir.
export async function GET(request: Request) {
  return NextResponse.json({ error: 'Serviço de clima desativado permanentemente.' }, { status: 404 });
}

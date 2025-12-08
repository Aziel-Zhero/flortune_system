// src/app/api/auth/[...nextauth]/route.ts
// Este arquivo foi mantido para compatibilidade de rotas, mas a lógica de autenticação
// foi centralizada no sistema nativo do Supabase.
// O NextAuth.js não está mais em uso ativo.

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Authentication endpoint not active. Please use Supabase authentication.' }, { status: 404 });
}

export async function POST() {
    return NextResponse.json({ message: 'Authentication endpoint not active. Please use Supabase authentication.' }, { status: 404 });
}

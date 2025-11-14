// src/app/api/auth/[...nextauth]/route.ts

// Este arquivo não é mais necessário após a migração para a autenticação
// nativa do Supabase (Auth Helpers). A lógica agora está centralizada
// no `auth-context.tsx`, `middleware.ts` e nas Server Actions que
// interagem com o `supabase.auth`.
//
// Manter este arquivo pode causar conflitos. Recomenda-se removê-lo.
export function GET() {
  return new Response("Auth API is handled by Supabase.", { status: 404 });
}
export function POST() {
  return new Response("Auth API is handled by Supabase.", { status: 404 });
}

// src/app/api/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'

  if (!code) {
    console.error('No code found in callback URL')
    return NextResponse.redirect(
      new URL('/login?error=no_code', request.url)
    )
  }

  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Error exchanging code for session:', error.message)
      return NextResponse.redirect(
        new URL('/login?error=auth_callback_failed', request.url)
      )
    }

    // 🔐 Segurança: evita open redirect
    const safeNext = next.startsWith('/') ? next : '/dashboard'

    return NextResponse.redirect(new URL(safeNext, request.url))

  } catch (err) {
    console.error('Unexpected auth callback error:', err)
    return NextResponse.redirect(
      new URL('/login?error=server_error', request.url)
    )
  }
}

// src/app/api/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // If 'next' is in the searchParams, use it as the redirect URL,
  // otherwise, redirect to the dashboard.
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
        // Redirect to the dashboard after successful login/signup
        return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Redirect to an error page if something goes wrong
  console.error("Authentication callback error");
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}

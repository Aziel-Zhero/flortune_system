// src/app/api/quotes/route.ts

// This API route is no longer necessary as the service now calls the external API directly.
// Keeping it could cause confusion. It can be safely deleted.

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  return NextResponse.json({ error: 'This API route is deprecated.' }, { status: 410 });
}

// This file is no longer needed as the service calls the external API directly.
// It can be deleted.
import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({ error: 'This endpoint is deprecated.' }, { status: 410 });
}

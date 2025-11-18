// This file is no longer needed as the quote service now calls the external API directly.
// You can safely delete this file.
export function GET() {
  return new Response("This API route is deprecated.", { status: 410 });
}

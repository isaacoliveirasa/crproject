import { NextRequest } from 'next/server';

// WebGL textures require CORS-enabled images. The Supercell asset CDN does not
// send CORS headers, so we relay those images through our own origin.
const ALLOWED_HOSTS = new Set(['api-assets.clashroyale.com']);

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return new Response('Missing url parameter', { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new Response('Invalid url', { status: 400 });
  }

  if (parsed.protocol !== 'https:' || !ALLOWED_HOSTS.has(parsed.hostname)) {
    return new Response('Host not allowed', { status: 403 });
  }

  const upstream = await fetch(parsed.toString(), {
    next: { revalidate: 86400 },
  });

  if (!upstream.ok || !upstream.body) {
    return new Response('Upstream error', { status: 502 });
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'image/png',
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  });
}

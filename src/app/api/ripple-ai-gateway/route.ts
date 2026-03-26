import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_LEGACY_ANON_KEY =
  process.env.SUPABASE_EDGE_FUNCTION_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_LEGACY_ANON_KEY ||
  process.env.SUPABASE_LEGACY_ANON_KEY;
const SUPABASE_AUTH_API_KEY = SUPABASE_PUBLISHABLE_KEY || SUPABASE_LEGACY_ANON_KEY;
const SUPABASE_EDGE_API_KEY = SUPABASE_LEGACY_ANON_KEY || SUPABASE_PUBLISHABLE_KEY;
const MAX_MESSAGE_CHARS = 12000;
const MAX_THREAD_ID_CHARS = 120;
const UPSTREAM_TIMEOUT_MS = 30000;

interface RippleAiGatewayBody {
  message: string;
  thread_id?: string;
  search_enabled?: boolean;
}

function parseGatewayBody(raw: unknown): RippleAiGatewayBody | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const map = raw as Record<string, unknown>;

  const messageRaw = typeof map.message === 'string' ? map.message.trim() : '';
  if (!messageRaw || messageRaw.length > MAX_MESSAGE_CHARS) return null;

  const threadRaw = typeof map.thread_id === 'string' ? map.thread_id.trim() : '';
  if (threadRaw.length > MAX_THREAD_ID_CHARS) return null;

  const searchEnabled =
    typeof map.search_enabled === 'boolean' ? map.search_enabled : false;

  return {
    message: messageRaw,
    ...(threadRaw ? { thread_id: threadRaw } : {}),
    search_enabled: searchEnabled,
  };
}

async function verifyUserToken(token: string): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_AUTH_API_KEY) return false;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method: 'GET',
    headers: {
      apikey: SUPABASE_AUTH_API_KEY,
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });
  return response.ok;
}

export async function POST(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_AUTH_API_KEY || !SUPABASE_EDGE_API_KEY) {
    return NextResponse.json(
      { error: 'Supabase environment is not configured.' },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get('authorization')?.trim() || '';
  const token = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : '';

  const origin = request.headers.get('origin')?.trim();
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: 'Forbidden origin.' }, { status: 403 });
  }

  if (!token) {
    return NextResponse.json(
      { error: 'Missing authorization token.' },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const safeBody = parseGatewayBody(body);
  if (!safeBody) {
    return NextResponse.json(
      { error: 'Invalid payload. Expected message/thread_id/search_enabled.' },
      { status: 400 },
    );
  }

  try {
    const tokenValid = await verifyUserToken(token);
    if (!tokenValid) {
      return NextResponse.json(
        { error: 'Invalid or expired auth token.' },
        { status: 401 },
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
    let upstream: Response;
    try {
      upstream = await fetch(`${SUPABASE_URL}/functions/v1/ripple-ai-gateway`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_EDGE_API_KEY,
          Authorization: `Bearer ${token}`,
          'x-ripple-access-token': token,
        },
        body: JSON.stringify(safeBody),
        signal: controller.signal,
        cache: 'no-store',
      });
    } finally {
      clearTimeout(timeout);
    }

    const raw = await upstream.text();
    let payload: unknown = null;
    try {
      payload = raw ? JSON.parse(raw) : null;
    } catch {
      payload = raw || null;
    }

    if (!upstream.ok) {
      return NextResponse.json(
        {
          error:
            typeof (payload as any)?.error === 'string'
              ? (payload as any).error
              : typeof (payload as any)?.message === 'string'
                ? (payload as any).message
                : `Edge Function request failed (${upstream.status}).`,
        },
        { status: upstream.status },
      );
    }

    return NextResponse.json(payload ?? {});
  } catch {
    return NextResponse.json(
      { error: 'Failed to send a request to the Edge Function.' },
      { status: 502 },
    );
  }
}

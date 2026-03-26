import { NextRequest, NextResponse } from 'next/server';

interface LinkPreviewData {
  url: string;
  host: string;
  path: string;
  title?: string;
  description?: string;
  author_name?: string;
  thumbnail_url?: string;
  site_name?: string;
}

const REQUEST_TIMEOUT_MS = 4000;
const USER_AGENT =
  'RippleWebLinkPreview/1.0 (+https://rippleweb.local)';

type SocialPlatform =
  | 'youtube'
  | 'instagram'
  | 'tiktok'
  | 'x'
  | 'facebook'
  | 'linkedin'
  | 'generic';

function compactHost(host: string): string {
  return host.replace(/^www\./i, '').trim();
}

function detectSocialPlatform(host: string): SocialPlatform {
  const normalized = compactHost(host).toLowerCase();
  if (normalized === 'youtu.be' || normalized.includes('youtube.com')) return 'youtube';
  if (normalized.includes('instagram.com')) return 'instagram';
  if (normalized.includes('tiktok.com')) return 'tiktok';
  if (normalized.includes('twitter.com') || normalized.includes('x.com')) return 'x';
  if (normalized.includes('facebook.com') || normalized.includes('fb.watch')) return 'facebook';
  if (normalized.includes('linkedin.com')) return 'linkedin';
  return 'generic';
}

function platformSiteName(platform: SocialPlatform): string | undefined {
  switch (platform) {
    case 'youtube':
      return 'YouTube';
    case 'instagram':
      return 'Instagram';
    case 'tiktok':
      return 'TikTok';
    case 'x':
      return 'X';
    case 'facebook':
      return 'Facebook';
    case 'linkedin':
      return 'LinkedIn';
    default:
      return undefined;
  }
}

function cleanText(value: unknown, max = 240): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.replace(/\s+/g, ' ').trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
}

function isPrivateHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host === '127.0.0.1' ||
    host === '::1'
  ) {
    return true;
  }

  if (host.endsWith('.local')) return true;

  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (ipv4) {
    const a = Number(ipv4[1]);
    const b = Number(ipv4[2]);
    if (a === 10 || a === 127) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 169 && b === 254) return true;
  }

  return false;
}

function parseExternalUrl(input: string | null): URL | null {
  if (!input) return null;
  try {
    const parsed = new URL(input.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    if (!parsed.hostname) return null;
    if (isPrivateHostname(parsed.hostname)) return null;
    parsed.hash = '';
    return parsed;
  } catch {
    return null;
  }
}

function removeTrackingParams(url: URL): void {
  const paramsToDrop: string[] = [];
  url.searchParams.forEach((_value, key) => {
    const normalized = key.toLowerCase();
    if (
      normalized.startsWith('utm_') ||
      normalized === 'fbclid' ||
      normalized === 'gclid' ||
      normalized === 'igshid' ||
      normalized === 'si'
    ) {
      paramsToDrop.push(key);
    }
  });
  paramsToDrop.forEach((key) => url.searchParams.delete(key));
}

function canonicalizeSocialUrl(url: URL): URL {
  const next = new URL(url.toString());
  next.hash = '';
  removeTrackingParams(next);

  const platform = detectSocialPlatform(next.host);

  if (platform === 'youtube') {
    const host = compactHost(next.host).toLowerCase();
    if (host === 'youtu.be') {
      const videoId = next.pathname.replace(/^\/+/, '').split('/')[0] || '';
      if (videoId) {
        const timestamp = next.searchParams.get('t');
        next.hostname = 'www.youtube.com';
        next.pathname = '/watch';
        next.search = '';
        next.searchParams.set('v', videoId);
        if (timestamp) next.searchParams.set('t', timestamp);
      }
    } else {
      next.hostname = 'www.youtube.com';
    }
  }

  if (platform === 'instagram') {
    next.hostname = 'www.instagram.com';
  }

  if (platform === 'tiktok') {
    next.hostname = 'www.tiktok.com';
  }

  if (platform === 'x') {
    next.hostname = 'x.com';
  }

  return next;
}

function buildFallback(url: URL): LinkPreviewData {
  const platform = detectSocialPlatform(url.host);
  const siteName = platformSiteName(platform);

  return {
    url: url.toString(),
    host: compactHost(url.host),
    path: url.pathname || '',
    ...(siteName ? { site_name: siteName } : {}),
  };
}

function buildHeuristicPreview(url: URL): Partial<LinkPreviewData> | null {
  const platform = detectSocialPlatform(url.host);
  const siteName = platformSiteName(platform);
  if (!siteName) return null;

  const path = url.pathname || '';

  let title: string | undefined;
  if (platform === 'youtube') {
    if (path.startsWith('/watch') && url.searchParams.get('v')) {
      title = 'YouTube video';
    } else if (path.startsWith('/shorts/')) {
      title = 'YouTube shorts';
    } else {
      title = 'YouTube link';
    }
  } else if (platform === 'instagram') {
    title = path.startsWith('/reel/') ? 'Instagram reel' : 'Instagram post';
  } else if (platform === 'tiktok') {
    title = 'TikTok video';
  } else if (platform === 'x') {
    title = path.includes('/status/') ? 'Post di X' : 'X profile';
  } else if (platform === 'facebook') {
    title = 'Facebook post';
  } else if (platform === 'linkedin') {
    title = 'LinkedIn post';
  }

  const description = `${compactHost(url.host)}${url.pathname}${url.search}`.slice(0, 240);

  return {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    author_name: siteName,
    site_name: siteName,
  };
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function extractMetaContent(html: string, selectors: string[]): string | undefined {
  for (const selector of selectors) {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regexProperty = new RegExp(
      `<meta[^>]+property=["']${escaped}["'][^>]*content=["']([^"']+)["'][^>]*>`,
      'i',
    );
    const regexName = new RegExp(
      `<meta[^>]+name=["']${escaped}["'][^>]*content=["']([^"']+)["'][^>]*>`,
      'i',
    );
    const match = regexProperty.exec(html) || regexName.exec(html);
    if (match?.[1]) {
      return cleanText(match[1], 300);
    }
  }
  return undefined;
}

function extractTitleTag(html: string): string | undefined {
  const match = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
  return cleanText(match?.[1], 180);
}

async function fetchNoEmbed(targetUrl: string): Promise<Partial<LinkPreviewData> | null> {
  const endpoint = `https://noembed.com/embed?url=${encodeURIComponent(targetUrl)}`;
  const response = await fetchWithTimeout(endpoint, {
    headers: {
      Accept: 'application/json',
      'User-Agent': USER_AGENT,
    },
    cache: 'no-store',
  });

  if (!response || !response.ok) return null;

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    return null;
  }

  if (!payload || payload.error) return null;

  return {
    title: cleanText(payload.title, 180),
    description: cleanText(payload.author_name || payload.description, 240),
    author_name: cleanText(payload.author_name, 120),
    thumbnail_url: cleanText(payload.thumbnail_url, 800),
    site_name: cleanText(payload.provider_name, 80),
  };
}

async function fetchPlatformOEmbed(targetUrl: URL): Promise<Partial<LinkPreviewData> | null> {
  const platform = detectSocialPlatform(targetUrl.host);
  let endpoint: string | null = null;

  if (platform === 'youtube') {
    endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(targetUrl.toString())}&format=json`;
  } else if (platform === 'tiktok') {
    endpoint = `https://www.tiktok.com/oembed?url=${encodeURIComponent(targetUrl.toString())}`;
  } else if (platform === 'x') {
    endpoint = `https://publish.twitter.com/oembed?url=${encodeURIComponent(targetUrl.toString())}&omit_script=true`;
  }

  if (!endpoint) return null;

  const response = await fetchWithTimeout(endpoint, {
    headers: {
      Accept: 'application/json',
      'User-Agent': USER_AGENT,
    },
    cache: 'no-store',
  });

  if (!response || !response.ok) return null;

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    return null;
  }

  if (!payload) return null;

  return {
    title: cleanText(payload.title, 180),
    description: cleanText(payload.description, 240),
    author_name: cleanText(payload.author_name || payload.author, 120),
    thumbnail_url: cleanText(payload.thumbnail_url, 800),
    site_name:
      cleanText(payload.provider_name, 80) ||
      platformSiteName(platform),
  };
}

async function fetchOgMeta(targetUrl: string): Promise<Partial<LinkPreviewData> | null> {
  const response = await fetchWithTimeout(targetUrl, {
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'User-Agent': USER_AGENT,
    },
    cache: 'no-store',
  });

  if (!response || !response.ok) return null;

  const html = await response.text();
  if (!html) return null;

  const title =
    extractMetaContent(html, ['og:title', 'twitter:title']) ||
    extractTitleTag(html);
  const description = extractMetaContent(html, [
    'og:description',
    'twitter:description',
    'description',
  ]);
  const siteName = extractMetaContent(html, ['og:site_name']);
  const image = extractMetaContent(html, ['og:image', 'twitter:image']);

  if (!title && !description && !siteName && !image) return null;

  return {
    title,
    description,
    site_name: siteName,
    thumbnail_url: image,
  };
}

function mergePreview(
  fallback: LinkPreviewData,
  ...candidates: Array<Partial<LinkPreviewData> | null>
): LinkPreviewData {
  const merged: LinkPreviewData = { ...fallback };
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (candidate.title) merged.title = candidate.title;
    if (candidate.description) merged.description = candidate.description;
    if (candidate.author_name) merged.author_name = candidate.author_name;
    if (candidate.thumbnail_url) merged.thumbnail_url = candidate.thumbnail_url;
    if (candidate.site_name) merged.site_name = candidate.site_name;
  }
  return merged;
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get('url');
  const parsedUrl = parseExternalUrl(rawUrl);

  if (!parsedUrl) {
    return NextResponse.json(
      { error: 'Invalid URL' },
      { status: 400 },
    );
  }

  const canonicalUrl = canonicalizeSocialUrl(parsedUrl);
  const fallback = buildFallback(canonicalUrl);
  const heuristic = buildHeuristicPreview(canonicalUrl);

  const [platformEmbed, noEmbed, ogMeta] = await Promise.all([
    fetchPlatformOEmbed(canonicalUrl),
    fetchNoEmbed(canonicalUrl.toString()),
    fetchOgMeta(canonicalUrl.toString()),
  ]);

  const data = mergePreview(fallback, heuristic, platformEmbed, noEmbed, ogMeta);
  return NextResponse.json({ data });
}

const DEFAULT_LOCAL_SITE_URL = 'http://localhost:3000/';

const ensureSiteUrlFormat = (value: string) => {
  let normalized = value.trim();

  if (!normalized) {
    return DEFAULT_LOCAL_SITE_URL;
  }

  normalized = normalized.startsWith('http') ? normalized : `https://${normalized}`;
  normalized = normalized.endsWith('/') ? normalized : `${normalized}/`;

  return normalized;
};

export const getBaseSiteUrl = () => {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    (typeof window !== 'undefined' ? window.location.origin : DEFAULT_LOCAL_SITE_URL);

  return ensureSiteUrlFormat(configuredUrl);
};

export const getSiteUrl = (path = '/') => {
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  return new URL(normalizedPath, getBaseSiteUrl()).toString();
};

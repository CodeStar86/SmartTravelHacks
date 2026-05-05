export const SITE_NAME = 'Smart Travel Hacks';

export function getSiteUrl(): string {
  const envUrl = (import.meta as any)?.env?.VITE_SITE_URL as string | undefined;
  if (envUrl) return envUrl.replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '');
  }
  return 'https://www.smarttravelhacks.com';
}

export function absoluteUrl(path = '/'): string {
  const siteUrl = getSiteUrl();
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

import { getAffiliateRedirectUrl } from './api';

function extractSlugFromHref(rawHref?: string | null): string | null {
  if (!rawHref) return null;

  try {
    const url = rawHref.startsWith('http')
      ? new URL(rawHref)
      : new URL(rawHref, window.location.origin);

    const match = url.pathname.match(/^\/go\/([^/?#]+)/);
    return match?.[1] || null;
  } catch {
    const match = rawHref.match(/^\/go\/([^/?#]+)/);
    return match?.[1] || null;
  }
}

export function isAffiliateHref(rawHref?: string | null) {
  return !!extractSlugFromHref(rawHref);
}

export async function trackAffiliateAndNavigate(rawHref: string, target?: string | null) {
  const slug = extractSlugFromHref(rawHref);
  if (!slug) {
    window.location.href = rawHref;
    return;
  }

  const redirectUrl = getAffiliateRedirectUrl(slug, document.referrer || window.location.href);

  if (target === '_blank') {
    window.open(redirectUrl, '_blank', 'noopener,noreferrer');
  } else {
    window.location.href = redirectUrl;
  }
}

export async function handleAffiliateClickEvent(
  e: React.MouseEvent<HTMLAnchorElement> | MouseEvent,
  rawHref?: string | null,
  target?: string | null
) {
  if (!rawHref || !isAffiliateHref(rawHref)) return;

  e.preventDefault();
  await trackAffiliateAndNavigate(rawHref, target);
}

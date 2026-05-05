import { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  robotsIndex?: boolean;
  robotsFollow?: boolean;
  schema?: any;
  keywords?: string;
  language?: string;
}

export function SEOHead({
  title,
  description,
  canonical,
  ogTitle,
  ogDescription,
  ogImage,
  ogUrl,
  ogType = 'website',
  twitterCard = 'summary_large_image',
  twitterTitle,
  twitterDescription,
  twitterImage,
  robotsIndex = true,
  robotsFollow = true,
  schema,
  keywords,
  language = 'en',
}: SEOHeadProps) {
  useEffect(() => {
    // Set document title
    document.title = title;

    // Set HTML lang attribute
    document.documentElement.lang = language;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name';
      let tag = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, name);
        document.head.appendChild(tag);
      }
      
      tag.content = content;
    };

    // Basic meta tags
    updateMetaTag('description', description);
    
    // Keywords (if provided)
    if (keywords) {
      updateMetaTag('keywords', keywords);
    }

    // Additional SEO meta tags
    updateMetaTag('author', 'Smart Travel Hacks');
    updateMetaTag('publisher', 'Smart Travel Hacks');
    updateMetaTag('language', language);
    updateMetaTag('revisit-after', '7 days');
    updateMetaTag('rating', 'general');
    
    // Robots
    const robotsContent = `${robotsIndex ? 'index' : 'noindex'}, ${robotsFollow ? 'follow' : 'nofollow'}`;
    updateMetaTag('robots', robotsContent);
    updateMetaTag('googlebot', robotsContent);
    updateMetaTag('bingbot', robotsContent);

    // Open Graph
    updateMetaTag('og:title', ogTitle || title, true);
    updateMetaTag('og:description', ogDescription || description, true);
    updateMetaTag('og:type', ogType, true);
    updateMetaTag('og:locale', 'en_US', true);
    updateMetaTag('og:site_name', 'Smart Travel Hacks', true);
    const makeAbsoluteUrl = (value: string) => {
      if (/^https?:\/\//i.test(value)) return value;
      return `https://www.smarttravelhacks.com${value.startsWith('/') ? value : `/${value}`}`;
    };
    const resolvedOgImage = makeAbsoluteUrl(ogImage || '/og-image.png');
    updateMetaTag('og:image', resolvedOgImage, true);
    updateMetaTag('og:image:secure_url', resolvedOgImage, true);
    updateMetaTag('og:image:type', 'image/png', true);
    updateMetaTag('og:image:alt', title, true);
    updateMetaTag('og:image:width', '1200', true);
    updateMetaTag('og:image:height', '630', true);
    updateMetaTag('og:url', makeAbsoluteUrl(ogUrl || window.location.pathname || '/'), true);

    // Twitter Card
    updateMetaTag('twitter:card', twitterCard);
    updateMetaTag('twitter:title', twitterTitle || ogTitle || title);
    updateMetaTag('twitter:description', twitterDescription || ogDescription || description);
    updateMetaTag('twitter:site', '@aisummit');
    updateMetaTag('twitter:creator', '@aisummit');
    updateMetaTag('twitter:image', twitterImage ? makeAbsoluteUrl(twitterImage) : resolvedOgImage);
    updateMetaTag('twitter:image:alt', title);

    // Additional meta tags for better crawling
    updateMetaTag('theme-color', '#2563eb'); // Blue color from hero
    updateMetaTag('mobile-web-app-capable', 'yes');
    updateMetaTag('apple-mobile-web-app-capable', 'yes');
    updateMetaTag('apple-mobile-web-app-status-bar-style', 'default');
    updateMetaTag('apple-mobile-web-app-title', 'Smart Travel Hacks');
    updateMetaTag('format-detection', 'telephone=no');

    // Favicons / app icons
    const ensureLink = (rel: string, href: string, sizes?: string) => {
      let link = document.querySelector(`link[rel="${rel}"]${sizes ? `[sizes="${sizes}"]` : ''}`) as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        if (sizes) link.sizes = sizes;
        document.head.appendChild(link);
      }
      link.href = href;
    };
    ensureLink('icon', '/favicon.ico');
    ensureLink('icon', '/favicon.png', '32x32');
    ensureLink('apple-touch-icon', '/apple-touch-icon.png', '180x180');
    ensureLink('manifest', '/site.webmanifest');

    // Canonical link
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = canonical;
    }

    // JSON-LD Schema
    if (schema) {
      let script = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script') as HTMLScriptElement;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(schema);
    }

  }, [title, description, canonical, ogTitle, ogDescription, ogImage, ogUrl, ogType,
      twitterCard, twitterTitle, twitterDescription, twitterImage, robotsIndex, robotsFollow, 
      schema, keywords, language]);

  return null;
}
import { Post, SEOScore, ContentBlock } from '../types';

import { logger } from './logger';
// Generate SEO score for a post
export function calculateSEOScore(
  post: Partial<Post>,
  targetLength = 1500
): SEOScore {
  const checks = {
    keyword_in_title: false,
    keyword_in_first_100: false,
    has_headings: false,
    has_internal_links: false,
    has_external_links: false,
    has_images_with_alt: false,
    meets_length_target: false,
  };

  const keyword = post.seo?.focus_keyword?.toLowerCase();
  const title = post.title?.toLowerCase() || '';
  const content = post.content || [];

  // Check keyword in title
  if (keyword && title.includes(keyword)) {
    checks.keyword_in_title = true;
  }

  // Check keyword in first 100 words
  if (keyword && content.length > 0) {
    const firstBlocks = content.slice(0, 3);
    const firstText = firstBlocks
      .filter(b => b.type === 'paragraph' || b.type === 'heading')
      .map(b => b.content?.text || '')
      .join(' ')
      .toLowerCase();
    if (firstText.includes(keyword)) {
      checks.keyword_in_first_100 = true;
    }
  }

  // Check for headings
  checks.has_headings = content.some(b => b.type === 'heading');

  // Check for images with alt text
  const images = content.filter(b => b.type === 'image');
  checks.has_images_with_alt = images.length > 0 && images.every(img => img.content?.alt);

  // Check word count
  const wordCount = countWords(content);
  checks.meets_length_target = wordCount >= targetLength;

  // Calculate content for link checking
  const allText = content
    .map(b => {
      if (b.type === 'paragraph' || b.type === 'heading') {
        return b.content?.html || b.content?.text || '';
      }
      return '';
    })
    .join(' ');

  // Check for links (basic detection)
  checks.has_internal_links = allText.includes('href="/') || allText.includes('href="./');
  checks.has_external_links = allText.includes('http://') || allText.includes('https://');

  // Calculate score
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const score = Math.round((passedChecks / Object.keys(checks).length) * 100);

  return { score, checks };
}

// Count words in content blocks
export function countWords(content: ContentBlock[]): number {
  return content.reduce((count, block) => {
    if (block.type === 'paragraph' || block.type === 'heading') {
      const text = block.content?.text || '';
      const words = text.trim().split(/\s+/).filter(Boolean);
      return count + words.length;
    }
    return count;
  }, 0);
}

// Generate meta tags for a post
export function generateMetaTags(post: Post, siteUrl: string) {
  const metaTitle = post.seo?.meta_title || post.title;
  const metaDescription = post.seo?.meta_description || post.excerpt;
  const rawOgImage = post.seo?.og_image || post.featured_image || '/og-image.png';
  const ogImage = /^https?:\/\//i.test(rawOgImage) ? rawOgImage : `${siteUrl}${rawOgImage.startsWith('/') ? rawOgImage : `/${rawOgImage}`}`;
  const canonicalUrl = post.seo?.canonical_url || `${siteUrl}/blog/${post.slug}`;

  return {
    title: metaTitle,
    description: metaDescription,
    canonical: canonicalUrl,
    og: {
      title: post.seo?.og_title || metaTitle,
      description: post.seo?.og_description || metaDescription,
      image: ogImage,
      url: canonicalUrl,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seo?.og_title || metaTitle,
      description: post.seo?.og_description || metaDescription,
      image: ogImage,
    },
    robots: {
      index: post.seo?.robots_index !== false,
      follow: post.seo?.robots_follow !== false,
    },
  };
}

// Generate Article JSON-LD schema
export function generateArticleSchema(post: Post, siteUrl: string, authorName = 'Admin') {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.featured_image ? (/^https?:\/\//i.test(post.featured_image) ? post.featured_image : `${siteUrl}${post.featured_image.startsWith('/') ? post.featured_image : `/${post.featured_image}`}`) : `${siteUrl}/og-image.png`,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: {
      '@type': 'Person',
      name: authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Smart Travel Hacks',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}/blog/${post.slug}`,
    },
  };
}

// Generate FAQ JSON-LD schema
export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  if (!faqs || faqs.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

// Generate Breadcrumb JSON-LD schema
export function generateBreadcrumbSchema(
  items: { name: string; url: string }[],
  siteUrl: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.url}`,
    })),
  };
}

// Extract table of contents from content blocks
export function generateTableOfContents(content: ContentBlock[]) {
  // Ensure content is an array
  if (!Array.isArray(content)) {
    return [];
  }
  
  let headingCount = 0;
  return content
    .map((block, blockIndex) => {
      if (block.type === 'heading') {
        const tocItem = {
          id: `heading-${headingCount}`,
          blockIndex, // Store the actual block index for reference
          text: block.content?.text || '',
          level: block.content?.level || 2,
        };
        headingCount++;
        return tocItem;
      }
      return null;
    })
    .filter(Boolean) as { id: string; blockIndex: number; text: string; level: number }[];
}

// Generate excerpt from content
export function generateExcerpt(content: ContentBlock[], maxLength = 160): string {
  // Ensure content is an array
  if (!Array.isArray(content)) {
    logger.warn('[generateExcerpt] Content is not an array:', typeof content);
    return '';
  }
  
  const text = content
    .filter(b => b.type === 'paragraph')
    .map(b => b.content?.text || '')
    .join(' ')
    .trim();

  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}
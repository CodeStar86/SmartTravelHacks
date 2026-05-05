import { useEffect, useState } from 'react';
import { postApi, categoryApi, tagApi } from '../lib/api';

import { logger } from '../lib/logger';
export default function SitemapPage() {
  const [xml, setXml] = useState('');

  useEffect(() => {
    generateSitemap();
  }, []);

  async function generateSitemap() {
    try {
      const [posts, categories, tags] = await Promise.all([
        postApi.list({ status: 'published', limit: 10000 }).catch(() => ({ posts: [] })),
        categoryApi.list().catch(() => ({ categories: [] })),
        tagApi.list().catch(() => ({ tags: [] })),
      ]);

      const baseUrl = 'https://www.smarttravelhacks.com';
      const now = new Date().toISOString();

      let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
      sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

      // Homepage
      sitemap += `  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

      // Static pages
      const staticPages = ['/blog', '/about', '/contact', '/travel-resources', '/privacy', '/affiliate-disclosure'];
      staticPages.forEach(page => {
        sitemap += `  <url>\n    <loc>${baseUrl}${page}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
      });

      // Posts
      (posts.posts || []).forEach((post: any) => {
        sitemap += `  <url>\n    <loc>${baseUrl}/blog/${post.slug}</loc>\n    <lastmod>${post.updated_at || post.published_at}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
      });

      // Categories
      (categories.categories || []).forEach((cat: any) => {
        sitemap += `  <url>\n    <loc>${baseUrl}/category/${cat.slug}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
      });

      // Tags
      (tags.tags || []).forEach((tag: any) => {
        sitemap += `  <url>\n    <loc>${baseUrl}/tag/${tag.slug}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.5</priority>\n  </url>\n`;
      });

      sitemap += '</urlset>';
      setXml(sitemap);
    } catch (error) {
      logger.error('Sitemap generation error:', error);
    }
  }

  useEffect(() => {
    if (xml) {
      document.querySelector('html')!.innerHTML = `<pre>${xml.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;
    }
  }, [xml]);

  return null;
}

import { useEffect } from 'react';
import { absoluteUrl } from '../lib/site';

export default function RobotsPage() {
  useEffect(() => {
    const content = `User-agent: *
Allow: /
Disallow: /admin/

Sitemap: ${absoluteUrl('/sitemap.xml')}`;

    document.querySelector('html')!.innerHTML = `<pre>${content}</pre>`;
    document.querySelector('pre')!.style.fontFamily = 'monospace';
  }, []);

  return null;
}

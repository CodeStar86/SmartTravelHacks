import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const manifestPath = path.join(rootDir, 'public', 'data', 'content-manifest.json');


function normalizeTaxonomyValue(value) {
  return String(value || '').trim().toLowerCase();
}

function slugifyTaxonomyValue(value) {
  return normalizeTaxonomyValue(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function taxonomyCandidateValues(value) {
  if (value === null || value === undefined) return [];
  if (typeof value === 'object') {
    return [value.id, value.slug, value.name, value.title, value.label, value.value]
      .filter((entry) => entry !== null && entry !== undefined && entry !== '');
  }
  return [value];
}

function taxonomyValues(values) {
  if (Array.isArray(values)) return values.flatMap(taxonomyCandidateValues);
  if (typeof values === 'string' && values.includes(',')) return values.split(',').flatMap(taxonomyCandidateValues);
  return taxonomyCandidateValues(values);
}

function itemMatchesTaxonomy(value, taxonomy) {
  const accepted = new Set(
    taxonomyCandidateValues(taxonomy)
      .filter(Boolean)
      .flatMap((entry) => [normalizeTaxonomyValue(entry), slugifyTaxonomyValue(entry)])
      .filter(Boolean)
  );
  return taxonomyCandidateValues(value).some((candidate) => {
    const normalized = normalizeTaxonomyValue(candidate);
    const slugified = slugifyTaxonomyValue(candidate);
    return accepted.has(normalized) || accepted.has(slugified);
  });
}

function postMatchesCategory(post, category) {
  return taxonomyValues(post?.categories).some((value) => itemMatchesTaxonomy(value, category));
}

function postMatchesTag(post, tag) {
  return taxonomyValues(post?.tags).some((value) => itemMatchesTaxonomy(value, tag));
}

function filterMatchingTaxonomies(values, taxonomies = []) {
  const normalizedValues = taxonomyValues(values);
  return normalizedValues.length
    ? taxonomies.filter((taxonomy) => normalizedValues.some((value) => itemMatchesTaxonomy(value, taxonomy)))
    : [];
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripHtml(html = '') {
  return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeContent(content) {
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return content;
  }
  return content || '';
}

function renderContent(content) {
  const normalized = normalizeContent(content);
  if (typeof normalized === 'string') {
    return normalized
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => `<p>${escapeHtml(p)}</p>`)
      .join('\n');
  }
  if (!Array.isArray(normalized)) return '';
  return normalized.map((block) => {
    const type = block?.type;
    const text = block?.content?.text || block?.content?.html || '';
    if (type === 'heading') {
      const level = Math.min(6, Math.max(1, Number(block?.content?.level || 2)));
      return `<h${level}>${escapeHtml(text)}</h${level}>`;
    }
    if (type === 'image' && block?.content?.src) {
      return `<figure><img src="${escapeHtml(block.content.src)}" alt="${escapeHtml(block.content.alt || '')}" loading="lazy" /><figcaption>${escapeHtml(block.content.caption || '')}</figcaption></figure>`;
    }
    if (type === 'list' && Array.isArray(block?.content?.items)) {
      const tag = block?.content?.ordered ? 'ol' : 'ul';
      return `<${tag}>${block.content.items.map((item) => `<li>${escapeHtml(typeof item === 'string' ? item : item?.text || '')}</li>`).join('')}</${tag}>`;
    }
    if (type === 'html' && block?.content?.html) return block.content.html;
    return `<p>${escapeHtml(text || stripHtml(JSON.stringify(block?.content || '')))}</p>`;
  }).join('\n');
}

function readingTime(content) {
  const text = stripHtml(Array.isArray(content) ? content.map((b) => b?.content?.text || b?.content?.html || '').join(' ') : String(content || ''));
  return Math.max(1, Math.ceil(text.split(/\s+/).filter(Boolean).length / 200));
}

function layout({ title, description, canonical, body, schema, ogImage = '/og-image.png', robots = 'index, follow', manifest }) {
  return `
<div class="ssg-shell">
  <header class="ssg-header">
    <a href="/" class="ssg-brand">Smart Travel Hacks</a>
    <nav>
      <a href="/blog">Blog</a>
      <a href="/about">About</a>
      <a href="/travel-resources">Resources</a>
      <a href="/contact">Contact</a>
    </nav>
  </header>
  <main class="ssg-main">${body}</main>
  <footer class="ssg-footer">
    <p>© Smart Travel Hacks</p>
    <p><a href="/privacy">Privacy</a> · <a href="/affiliate-disclosure">Affiliate Disclosure</a></p>
  </footer>
</div>
<script>window.__CONTENT_MANIFEST__=${JSON.stringify(manifest)};</script>
<style>
  .ssg-shell{font-family:Inter,ui-sans-serif,system-ui,sans-serif;color:#111827;background:#fff;min-height:100vh}
  .ssg-header,.ssg-main,.ssg-footer{max-width:1100px;margin:0 auto;padding:24px 16px}
  .ssg-header{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;border-bottom:1px solid #e5e7eb}
  .ssg-header nav{display:flex;gap:16px;flex-wrap:wrap}.ssg-header a{color:#0f172a;text-decoration:none}.ssg-brand{font-weight:700;font-size:1.25rem}
  .ssg-main{padding-top:32px;padding-bottom:48px}.ssg-footer{border-top:1px solid #e5e7eb;color:#6b7280;font-size:.95rem}
  .prose{max-width:780px}.prose h1{font-size:2.5rem;line-height:1.1}.prose h2{font-size:1.75rem;margin-top:2rem}.prose p,.prose li{line-height:1.7}.prose img{max-width:100%;height:auto;border-radius:16px}.card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px}.card{display:block;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;text-decoration:none;color:inherit;background:#fff}.card img{width:100%;height:180px;object-fit:cover;background:#f3f4f6}.card-body{padding:16px}.muted{color:#6b7280}.hero{padding:32px 0 12px}.hero p{max-width:720px}.meta{display:flex;gap:12px;flex-wrap:wrap;color:#6b7280;font-size:.95rem}.chips{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0}.chip{background:#f3f4f6;border-radius:9999px;padding:6px 10px;font-size:.875rem;color:#374151;text-decoration:none}
</style>
<!--ssg-meta:title-->${escapeHtml(title)}<!--/ssg-meta:title-->
<!--ssg-meta:description-->${escapeHtml(description)}<!--/ssg-meta:description-->
<!--ssg-meta:canonical-->${escapeHtml(canonical)}<!--/ssg-meta:canonical-->
<!--ssg-meta:robots-->${escapeHtml(robots)}<!--/ssg-meta:robots-->
<!--ssg-meta:ogimage-->${escapeHtml(ogImage)}<!--/ssg-meta:ogimage-->
<!--ssg-meta:schema-->${escapeHtml(JSON.stringify(schema || {}))}<!--/ssg-meta:schema-->`;
}

function articlePage(post, manifest) {
  const body = `
  <article class="prose">
    <p><a href="/blog">← Back to blog</a></p>
    <h1>${escapeHtml(post.title)}</h1>
    ${post.excerpt ? `<p class="muted">${escapeHtml(post.excerpt)}</p>` : ''}
    <div class="meta"><span>${escapeHtml(post.published_at || '')}</span><span>${readingTime(post.content)} min read</span></div>
    ${post.featured_image ? `<p><img src="${escapeHtml(post.featured_image)}" alt="${escapeHtml(post.title)}" /></p>` : ''}
    ${post.categories?.length ? `<div class="chips">${filterMatchingTaxonomies(post.categories, manifest.categories).map((c) => `<a class="chip" href="/category/${c.slug}">${escapeHtml(c.name)}</a>`).join('')}</div>` : ''}
    ${renderContent(post.content)}
    ${post.tags?.length ? `<div class="chips">${filterMatchingTaxonomies(post.tags, manifest.tags).map((t) => `<a class="chip" href="/tag/${t.slug}">#${escapeHtml(t.name)}</a>`).join('')}</div>` : ''}
  </article>`;
  const canonical = `${manifest.siteUrl}/blog/${post.slug}`;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.featured_image || `${manifest.siteUrl}/og-image.png`,
    datePublished: post.published_at,
    dateModified: post.updated_at || post.published_at,
    mainEntityOfPage: canonical,
    author: { '@type': 'Organization', name: 'Smart Travel Hacks' },
    publisher: { '@type': 'Organization', name: 'Smart Travel Hacks', logo: { '@type': 'ImageObject', url: `${manifest.siteUrl}/logo.png` } },
  };
  return { title: post.seo?.meta_title || post.title, description: post.seo?.meta_description || post.excerpt || 'Travel guide', canonical, body, schema, ogImage: post.featured_image || `${manifest.siteUrl}/og-image.png` };
}

function listingPage({ heading, description, canonical, posts, manifest, schema }) {
  const body = `
  <section class="hero prose">
    <h1>${escapeHtml(heading)}</h1>
    <p class="muted">${escapeHtml(description)}</p>
  </section>
  <section class="card-grid">${posts.map((post) => `
    <a class="card" href="/blog/${post.slug}">
      ${post.featured_image ? `<img src="${escapeHtml(post.featured_image)}" alt="${escapeHtml(post.title)}" />` : ''}
      <div class="card-body">
        <h2>${escapeHtml(post.title)}</h2>
        <p class="muted">${escapeHtml(post.excerpt || '')}</p>
      </div>
    </a>`).join('')}
  </section>`;
  return { title: heading, description, canonical, body, schema, ogImage: `${manifest.siteUrl}/og-image.png` };
}

async function writeRoute(route, html) {
  const filePath = route === '/' ? path.join(distDir, 'index.html') : path.join(distDir, route.replace(/^\//, ''), 'index.html');
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, html, 'utf8');
}

function injectDocument(template, page, manifest) {
  let html = template;
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(page.title)}</title>`);
  const metaBlock = `
    <meta name="description" content="${escapeHtml(page.description)}" />
    <meta name="robots" content="${escapeHtml(page.robots || 'index, follow')}" />
    <link rel="canonical" href="${escapeHtml(page.canonical)}" />
    <meta property="og:title" content="${escapeHtml(page.title)}" />
    <meta property="og:description" content="${escapeHtml(page.description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${escapeHtml(page.canonical)}" />
    <meta property="og:image" content="${escapeHtml(page.ogImage || `${manifest.siteUrl}/og-image.png`)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(page.title)}" />
    <meta name="twitter:description" content="${escapeHtml(page.description)}" />
    <meta name="twitter:image" content="${escapeHtml(page.ogImage || `${manifest.siteUrl}/og-image.png`)}" />
    <script type="application/ld+json">${JSON.stringify(page.schema || {})}</script>`;
  html = html.replace('</head>', `${metaBlock}
</head>`);
  html = html.replace(/<div id="root">[\s\S]*?<\/div>/i, `<div id="root">${layout({ ...page, manifest })}</div>`);
  return html;
}

async function main() {
  const [template, manifestRaw] = await Promise.all([
    fs.readFile(path.join(distDir, 'index.html'), 'utf8'),
    fs.readFile(manifestPath, 'utf8'),
  ]);
  const manifest = JSON.parse(manifestRaw);
  const publicPages = new Map();

  publicPages.set('/', listingPage({
    heading: 'Smart Travel Hacks | Travel Guides, Itineraries & Tips',
    description: 'Discover destination guides, weekend itineraries, hotel tips, food finds, and practical travel advice for planning memorable trips.',
    canonical: `${manifest.siteUrl}/`,
    posts: manifest.posts.slice(0, 6),
    manifest,
    schema: { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Smart Travel Hacks', url: `${manifest.siteUrl}/` },
  }));
  publicPages.set('/blog', listingPage({
    heading: 'Destinations | Smart Travel Hacks',
    description: 'Explore destination guides, itineraries, hotel notes, and practical travel advice.',
    canonical: `${manifest.siteUrl}/blog`,
    posts: manifest.posts,
    manifest,
    schema: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Destinations | Smart Travel Hacks', url: `${manifest.siteUrl}/blog` },
  }));

  for (const category of manifest.categories) {
    const posts = manifest.posts.filter((post) => postMatchesCategory(post, category));
    publicPages.set(`/category/${category.slug}`, listingPage({
      heading: `${category.name} - Smart Travel Hacks`,
      description: category.description || `Browse ${category.name} travel posts.`,
      canonical: `${manifest.siteUrl}/category/${category.slug}`,
      posts,
      manifest,
      schema: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: category.name, url: `${manifest.siteUrl}/category/${category.slug}` },
    }));
  }

  for (const tag of manifest.tags) {
    const posts = manifest.posts.filter((post) => postMatchesTag(post, tag));
    publicPages.set(`/tag/${tag.slug}`, listingPage({
      heading: `#${tag.name} - Smart Travel Hacks`,
      description: tag.description || `Browse posts tagged ${tag.name}.`,
      canonical: `${manifest.siteUrl}/tag/${tag.slug}`,
      posts,
      manifest,
      schema: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: tag.name, url: `${manifest.siteUrl}/tag/${tag.slug}` },
    }));
  }

  for (const post of manifest.posts) {
    publicPages.set(`/blog/${post.slug}`, articlePage(post, manifest));
  }

  const staticPages = [
    ['/about', { title: 'About | Smart Travel Hacks', description: 'Learn more about Smart Travel Hacks.', canonical: `${manifest.siteUrl}/about`, body: '<section class="prose"><h1>About</h1><p>Smart Travel Hacks shares destination guides, hotel notes, itineraries, and practical trip planning advice.</p></section>', schema: { '@context': 'https://schema.org', '@type': 'AboutPage', name: 'About' } }],
    ['/contact', { title: 'Contact | Smart Travel Hacks', description: 'Get in touch with Smart Travel Hacks.', canonical: `${manifest.siteUrl}/contact`, body: '<section class="prose"><h1>Contact</h1><p>Use the contact page to send questions, partnership enquiries, or travel story ideas.</p></section>', schema: { '@context': 'https://schema.org', '@type': 'ContactPage', name: 'Contact' } }],
    ['/travel-resources', { title: 'Travel Resources | Smart Travel Hacks', description: 'Helpful resources for planning and booking better trips.', canonical: `${manifest.siteUrl}/travel-resources`, body: '<section class="prose"><h1>Travel Resources</h1><p>Find practical travel resources for flights, hotels, travel insurance, airport transfers, attraction tickets, tours, packing, budgeting, and smarter trip planning.</p><ul><li>Compare flight and hotel booking options before you reserve.</li><li>Check travel insurance and transfer options before departure.</li><li>Use ticket and tour resources to plan destination activities.</li></ul></section>', schema: { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Travel Resources', url: `${manifest.siteUrl}/travel-resources` } }],
    ['/privacy', { title: 'Privacy Policy | Smart Travel Hacks', description: 'Privacy information for Smart Travel Hacks.', canonical: `${manifest.siteUrl}/privacy`, robots: 'noindex, follow', body: '<section class="prose"><h1>Privacy Policy</h1><p>Read the privacy policy for Smart Travel Hacks.</p></section>', schema: { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Privacy Policy' } }],
    ['/affiliate-disclosure', { title: 'Affiliate Disclosure | Smart Travel Hacks', description: 'Affiliate disclosure for Smart Travel Hacks.', canonical: `${manifest.siteUrl}/affiliate-disclosure`, robots: 'noindex, follow', body: '<section class="prose"><h1>Affiliate Disclosure</h1><p>Some links may earn a commission at no extra cost to the reader.</p></section>', schema: { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Affiliate Disclosure' } }],
  ];
  for (const [route, page] of staticPages) publicPages.set(route, page);

  for (const [route, page] of publicPages) {
    await writeRoute(route, injectDocument(template, page, manifest));
  }

  const notFound = injectDocument(template, {
    title: 'Page not found | Smart Travel Hacks',
    description: 'The page you requested could not be found.',
    canonical: `${manifest.siteUrl}/404`,
    robots: 'noindex, follow',
    body: '<section class="prose"><h1>Page not found</h1><p>The page you requested could not be found.</p><p><a href="/">Return home</a></p></section>',
    schema: { '@context': 'https://schema.org', '@type': 'WebPage', name: '404' },
  }, manifest);
  await fs.writeFile(path.join(distDir, '404.html'), notFound, 'utf8');
  console.log(`Prerendered ${publicPages.size} routes.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const rootDir = process.cwd();
const envPath = path.join(rootDir, '.env');
const envExamplePath = path.join(rootDir, '.env.example');
const infoPath = path.join(rootDir, 'utils', 'supabase', 'info.tsx');

const DEFAULT_CATEGORIES = [
  { name: 'Europe', slug: 'europe' },
  { name: 'Southeast Asia', slug: 'southeast-asia' },
  { name: 'Central, East and South Asia', slug: 'central-east-and-south-asia' },
  { name: 'North America', slug: 'north-america' },
  { name: 'South America', slug: 'south-america' },
  { name: 'Central America', slug: 'central-america' },
  { name: 'Oceania', slug: 'oceania' },
  { name: 'Africa', slug: 'africa' },
  { name: 'Travel Insurance', slug: 'travel-insurance' },
  { name: 'The Best Gear', slug: 'the-best-gear' },
  { name: 'Hostel Life 101', slug: 'hostel-life-101' },
  { name: 'Book A Hotel', slug: 'book-a-hotel' },
  { name: 'Find Cheap Flights', slug: 'find-cheap-flights' },
  { name: 'Budget Backpacking', slug: 'budget-backpacking' },
  { name: 'Travel Tips', slug: 'travel-tips' },
  { name: 'Best Travel Jobs', slug: 'best-travel-jobs' },
];

function withDefaultCategories(categories = []) {
  const bySlug = new Map();
  for (const category of DEFAULT_CATEGORIES) bySlug.set(category.slug, { ...category, id: category.slug, post_count: 0 });
  for (const category of categories || []) {
    if (category?.slug) bySlug.set(category.slug, category);
  }
  return [...bySlug.values()];
}

function parseEnvFile(fileContent) {
  const map = {};
  for (const line of fileContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const idx = trimmed.indexOf('=');
    map[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
  }
  return map;
}

async function getEnv() {
  let env = { ...process.env };
  for (const file of [envPath, envExamplePath]) {
    try {
      const parsed = parseEnvFile(await fs.readFile(file, 'utf8'));
      env = { ...parsed, ...env };
    } catch {}
  }
  try {
    const info = await fs.readFile(infoPath, 'utf8');
    const projectMatch = info.match(/export const projectId = "([^"]+)"/);
    const keyMatch = info.match(/export const publicAnonKey = "([^"]+)"/);
    if (projectMatch && (!env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL.includes('YOUR_'))) env.VITE_SUPABASE_URL = `https://${projectMatch[1]}.supabase.co`;
    if (keyMatch && (!env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY')) env.VITE_SUPABASE_ANON_KEY = keyMatch[1];
  } catch {}
  return env;
}

function materializeRecord(row) {
  return {
    ...(row?.data ?? {}),
    id: row?.id ?? row?.data?.id,
    created_at: row?.data?.created_at ?? row?.created_at,
    updated_at: row?.data?.updated_at ?? row?.updated_at,
  };
}

function normalizePost(row) {
  const post = materializeRecord(row);
  let content = post.content ?? '';
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) content = parsed;
    } catch {}
  }
  return { ...post, content };
}

async function fetchTable(baseUrl, anonKey, table, query = '') {
  const url = `${baseUrl}/rest/v1/${table}?select=id,data,created_at,updated_at${query}`;
  const response = await fetch(url, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      Accept: 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${table}: ${response.status} ${await response.text()}`);
  }
  return response.json();
}


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

function buildSitemap(siteUrl, manifest) {
  const urls = [
    '/', '/blog', '/about', '/contact', '/travel-resources', '/privacy', '/affiliate-disclosure',
    ...manifest.categories.filter((c) => c?.slug).map((c) => `/category/${c.slug}`),
    ...manifest.tags.filter((t) => t?.slug).map((t) => `/tag/${t.slug}`),
    ...manifest.posts.filter((p) => p?.slug).map((p) => `/blog/${p.slug}`),
  ];
  const deduped = [...new Set(urls)];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${deduped
    .map((route) => `  <url><loc>${siteUrl}${route}</loc></url>`)
    .join('\n')}\n</urlset>\n`;
}

function buildRobots(siteUrl) {
  return `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
}

async function writeGeneratedFiles(siteUrl, manifest) {
  const outputDir = path.join(rootDir, 'public', 'data');
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(outputDir, 'content-manifest.json'), JSON.stringify(manifest, null, 2));
  await fs.writeFile(path.join(rootDir, 'public', 'sitemap.xml'), buildSitemap(siteUrl, manifest));
  await fs.writeFile(path.join(rootDir, 'public', 'robots.txt'), buildRobots(siteUrl));
}

async function main() {
  const env = await getEnv();
  const siteUrl = (env.VITE_SITE_URL || 'https://www.smarttravelhacks.com').replace(/\/$/, '');

  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;

  if (!env.VITE_SUPABASE_URL || !supabaseKey || supabaseKey === 'YOUR_SUPABASE_ANON_KEY' || supabaseKey === 'YOUR_SERVICE_ROLE_KEY') {
    const emptyManifest = { generatedAt: new Date().toISOString(), siteUrl, posts: [], categories: withDefaultCategories([]), tags: [] };
    await writeGeneratedFiles(siteUrl, emptyManifest);
    console.log('Created empty content manifest. Add VITE_SUPABASE_URL plus SUPABASE_SERVICE_ROLE_KEY (or a readable VITE_SUPABASE_ANON_KEY) in Vercel so posts can be fetched and indexed.');
    return;
  }

  const baseUrl = env.VITE_SUPABASE_URL.replace(/\/$/, '');
  const anonKey = supabaseKey;

  let manifest;
  try {
    const [postsResult, categoriesResult, tagsResult] = await Promise.allSettled([
      fetchTable(baseUrl, anonKey, 'posts', '&status=eq.published&order=updated_at.desc'),
      fetchTable(baseUrl, anonKey, 'categories', '&order=name.asc'),
      fetchTable(baseUrl, anonKey, 'tags', '&order=name.asc'),
    ]);

    if (postsResult.status === 'rejected') throw postsResult.reason;
    if (categoriesResult.status === 'rejected') console.warn('Categories could not be fetched; using default category list:', categoriesResult.reason?.message || categoriesResult.reason);
    if (tagsResult.status === 'rejected') console.warn('Tags could not be fetched; continuing without tag pages:', tagsResult.reason?.message || tagsResult.reason);

    const posts = postsResult.value.map(normalizePost);
    const categoriesRaw = categoriesResult.status === 'fulfilled' ? categoriesResult.value : [];
    const tagsRaw = tagsResult.status === 'fulfilled' ? tagsResult.value : [];
    const categories = withDefaultCategories(categoriesRaw.map(materializeRecord).map((category) => ({
      ...category,
      post_count: posts.filter((post) => postMatchesCategory(post, category)).length,
    })));
    const tags = tagsRaw.map(materializeRecord).map((tag) => ({
      ...tag,
      post_count: posts.filter((post) => postMatchesTag(post, tag)).length,
    }));

    manifest = {
      generatedAt: new Date().toISOString(),
      siteUrl,
      posts,
      categories,
      tags,
    };
    console.log(`Generated content manifest with ${posts.length} posts, ${categories.length} categories, and ${tags.length} tags.`);
  } catch (error) {
    console.warn('Falling back to an empty manifest because live posts could not be fetched:', error.message);
    manifest = { generatedAt: new Date().toISOString(), siteUrl, posts: [], categories: withDefaultCategories([]), tags: [] };
  }

  await writeGeneratedFiles(siteUrl, manifest);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

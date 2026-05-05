import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import { appLogger } from "./observability.ts";

/*
 * SMART TRAVEL HACKS Backend Server
 * Production persistence uses dedicated Supabase tables, not a generic KV table.
 * Each content type has its own table with indexed metadata and a JSONB payload
 * for backwards-compatible CMS fields.
 */

const app = new Hono();

// Supabase client for storage and auth
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  }
);

// Separate client for validating user JWTs (uses anon key)
const supabaseAuthClient = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  }
);

type EntityTable = { prefix: string; table: string; idColumn: string; dataColumn: string; };

const ENTITY_TABLES: EntityTable[] = [
  { prefix: 'post:', table: 'posts', idColumn: 'id', dataColumn: 'data' },
  { prefix: 'category:', table: 'categories', idColumn: 'id', dataColumn: 'data' },
  { prefix: 'tag:', table: 'tags', idColumn: 'id', dataColumn: 'data' },
  { prefix: 'affiliate:', table: 'affiliate_links', idColumn: 'id', dataColumn: 'data' },
  { prefix: 'click:', table: 'affiliate_clicks', idColumn: 'id', dataColumn: 'data' },
  { prefix: 'media:', table: 'media_assets', idColumn: 'id', dataColumn: 'data' },
  { prefix: 'subscriber:', table: 'subscribers', idColumn: 'id', dataColumn: 'data' },
  { prefix: 'message:', table: 'contact_messages', idColumn: 'id', dataColumn: 'data' },
  { prefix: 'comment:', table: 'comments', idColumn: 'id', dataColumn: 'data' },
  { prefix: 'redirect:', table: 'redirects', idColumn: 'id', dataColumn: 'data' },
  // Production rate-limit records. Keep both prefixes because older deployed
  // builds wrote keys as `rate:<action>:...`, while newer builds use
  // `rate-limit:<action>:...`. Supporting both prevents public forms from
  // failing during rolling upgrades.
  { prefix: 'rate-limit:', table: 'rate_limits', idColumn: 'id', dataColumn: 'data' },
  { prefix: 'rate:', table: 'rate_limits', idColumn: 'id', dataColumn: 'data' },
];

function parseEntityKey(key: string): { table: EntityTable; id: string } {
  if (key === 'settings:site') return { table: { prefix: 'settings:', table: 'site_settings', idColumn: 'key', dataColumn: 'data' }, id: 'site' };
  const table = ENTITY_TABLES.find((entry) => key.startsWith(entry.prefix));
  if (!table) throw new Error(`Unsupported persistence key: ${key}`);
  const id = key.slice(table.prefix.length);
  if (!id) throw new Error(`Missing id in persistence key: ${key}`);
  return { table, id };
}

function parseEntityPrefix(prefix: string): EntityTable {
  if (prefix === 'settings' || prefix === 'settings:') return { prefix: 'settings:', table: 'site_settings', idColumn: 'key', dataColumn: 'data' };
  const table = ENTITY_TABLES.find((entry) => entry.prefix === prefix);
  if (!table) throw new Error(`Unsupported persistence prefix: ${prefix}`);
  return table;
}

function materializeRecord(table: EntityTable, row: any): any {
  return { ...(row?.[table.dataColumn] ?? {}), id: row?.[table.idColumn] ?? row?.[table.dataColumn]?.id };
}


function normalizeTaxonomyValue(value: any): string {
  return String(value || '').trim().toLowerCase();
}

function slugifyTaxonomyValue(value: any): string {
  return normalizeTaxonomyValue(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function taxonomyCandidateValues(value: any): any[] {
  if (value === null || value === undefined) return [];
  if (typeof value === 'object') {
    return [value.id, value.slug, value.name, value.title, value.label, value.value]
      .filter((entry) => entry !== null && entry !== undefined && entry !== '');
  }
  return [value];
}

function taxonomyValues(values: any): any[] {
  if (Array.isArray(values)) return values.flatMap(taxonomyCandidateValues);
  if (typeof values === 'string' && values.includes(',')) return values.split(',').flatMap(taxonomyCandidateValues);
  return taxonomyCandidateValues(values);
}

function taxonomyMatches(value: any, acceptedValues: Set<string>): boolean {
  return taxonomyCandidateValues(value).some((candidate) => {
    const normalized = normalizeTaxonomyValue(candidate);
    return acceptedValues.has(normalized) || acceptedValues.has(slugifyTaxonomyValue(candidate));
  });
}

function acceptedTaxonomyValues(input: any, matchedTaxonomy?: any): Set<string> {
  return new Set(
    [input, ...taxonomyCandidateValues(matchedTaxonomy)]
      .filter(Boolean)
      .flatMap((value) => [normalizeTaxonomyValue(value), slugifyTaxonomyValue(value)])
      .filter(Boolean)
  );
}

function taxonomyRecordMatchesInput(record: any, input: any): boolean {
  const acceptedInputValues = acceptedTaxonomyValues(input);
  return taxonomyCandidateValues(record).some((candidate) => taxonomyMatches(candidate, acceptedInputValues));
}

async function getByKey(key: string): Promise<any> {
  const { table, id } = parseEntityKey(key);
  const { data, error } = await supabase.from(table.table).select(`${table.idColumn}, ${table.dataColumn}`).eq(table.idColumn, id).maybeSingle();
  if (error) throw error;
  return data ? materializeRecord(table, data) : undefined;
}

async function setByKey(key: string, value: any): Promise<void> {
  const { table, id } = parseEntityKey(key);
  const { error } = await supabase.from(table.table).upsert({ [table.idColumn]: id, [table.dataColumn]: { ...(value ?? {}), id: value?.id ?? id } });
  if (error) throw error;
}

async function deleteByKey(key: string): Promise<void> {
  const { table, id } = parseEntityKey(key);
  const { error } = await supabase.from(table.table).delete().eq(table.idColumn, id);
  if (error) throw error;
}

async function getByPrefix(prefix: string): Promise<any[]> {
  const table = parseEntityPrefix(prefix);
  const { data, error } = await supabase.from(table.table).select(`${table.idColumn}, ${table.dataColumn}`);
  if (error) throw error;
  return data?.map((row: any) => materializeRecord(table, row)) ?? [];
}

async function getRecordsByPrefix(prefix: string): Promise<Array<{ key: string; value: any }>> {
  const table = parseEntityPrefix(prefix);
  const rows = await getByPrefix(prefix);
  return rows.map((value: any) => ({ key: table.table === 'site_settings' ? `settings:${value.id || 'site'}` : `${table.prefix}${value.id}`, value }));
}

async function buildAffiliateClickCountMap(): Promise<Map<string, number>> {
  const clicks = await getByPrefix('click:');
  const counts = new Map<string, number>();

  for (const click of clicks) {
    const affiliateId = click?.link_id;
    if (!affiliateId) continue;
    counts.set(affiliateId, (counts.get(affiliateId) || 0) + 1);
  }

  return counts;
}

async function listAffiliatesWithClickCounts(): Promise<any[]> {
  const [affiliates, clickCounts] = await Promise.all([
    getByPrefix('affiliate:'),
    buildAffiliateClickCountMap(),
  ]);

  return affiliates.map((affiliate: any) => ({
    ...affiliate,
    clicks: clickCounts.get(affiliate.id) || 0,
  }));
}

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function recordAffiliateClick(c: any, affiliate: any, referrer?: string | null) {
  const clickId = crypto.randomUUID();
  const forwardedFor = c.req.header('x-forwarded-for') || '';
  const ip = forwardedFor.split(',')[0]?.trim() || c.req.header('x-real-ip') || '';
  const userAgent = c.req.header('user-agent') || '';
  const fingerprintSource = [affiliate.id, ip, userAgent].filter(Boolean).join('|');

  await setByKey(`click:${clickId}`, {
    id: clickId,
    link_id: affiliate.id,
    slug: affiliate.slug,
    destination_url: affiliate.destination_url,
    referrer_page: referrer || c.req.header('referer') || '',
    user_agent: userAgent,
    ip_hash: fingerprintSource ? await sha256(fingerprintSource) : '',
    clicked_at: new Date().toISOString(),
  });
}

// Initialize storage bucket on startup
async function initializeStorage() {
  const bucketName = 'make-3713a632-media';
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/*']
      });
      
      if (error) {
        appLogger.error('Failed to create storage bucket:', error);
      } else {
        appLogger.log('Storage bucket created successfully:', bucketName);
      }
    } else {
      appLogger.log('Storage bucket already exists:', bucketName);
    }
  } catch (error) {
    appLogger.error('Error initializing storage:', error);
  }
}

// Travel categories used by the public footer and category pages. Keep the IDs
// deterministic so posts can safely reference categories across deployments.
const DEFAULT_TRAVEL_CATEGORIES = [
  { id: 'cat-europe', name: 'Europe', slug: 'europe', group: 'where-to-go', description: 'Travel guides, routes, and budget tips for Europe.' },
  { id: 'cat-southeast-asia', name: 'Southeast Asia', slug: 'southeast-asia', group: 'where-to-go', description: 'Backpacking guides, itineraries, and practical tips for Southeast Asia.' },
  { id: 'cat-central-east-and-south-asia', name: 'Central, East, and South Asia', slug: 'central-east-and-south-asia', group: 'where-to-go', description: 'Guides and travel hacks for Central, East, and South Asia.' },
  { id: 'cat-north-america', name: 'North America', slug: 'north-america', group: 'where-to-go', description: 'Budget travel ideas and destination guides for North America.' },
  { id: 'cat-south-america', name: 'South America', slug: 'south-america', group: 'where-to-go', description: 'Backpacking routes, city guides, and savings tips for South America.' },
  { id: 'cat-central-america', name: 'Central America', slug: 'central-america', group: 'where-to-go', description: 'Travel guides and budget tips for Central America.' },
  { id: 'cat-oceania', name: 'Oceania', slug: 'oceania', group: 'where-to-go', description: 'Travel guides and planning tips for Australia, New Zealand, and the Pacific.' },
  { id: 'cat-africa', name: 'Africa', slug: 'africa', group: 'where-to-go', description: 'Destination guides, safety tips, and travel inspiration for Africa.' },
  { id: 'cat-travel-insurance', name: 'Travel Insurance', slug: 'travel-insurance', group: 'plan-your-trip', description: 'Travel insurance guides, comparisons, and safety advice.' },
  { id: 'cat-the-best-gear', name: 'The Best Gear', slug: 'the-best-gear', group: 'plan-your-trip', description: 'Packing lists, gear reviews, and travel essentials.' },
  { id: 'cat-hostel-life-101', name: 'Hostel Life 101', slug: 'hostel-life-101', group: 'plan-your-trip', description: 'Hostel tips, etiquette, safety, and budget accommodation advice.' },
  { id: 'cat-book-a-hotel', name: 'Book a Hotel', slug: 'book-a-hotel', group: 'plan-your-trip', description: 'Hotel booking tips, deal strategies, and accommodation guides.' },
  { id: 'cat-find-cheap-flights', name: 'Find Cheap Flights', slug: 'find-cheap-flights', group: 'plan-your-trip', description: 'Flight booking strategies, fare alerts, and cheap travel hacks.' },
  { id: 'cat-budget-backpacking', name: 'Budget Backpacking', slug: 'budget-backpacking', group: 'plan-your-trip', description: 'Money-saving guides for backpackers and long-term travelers.' },
  { id: 'cat-travel-tips', name: 'Travel Tips', slug: 'travel-tips', group: 'plan-your-trip', description: 'General travel planning tips, hacks, and practical advice.' },
  { id: 'cat-best-travel-jobs', name: 'Best Travel Jobs', slug: 'best-travel-jobs', group: 'plan-your-trip', description: 'Remote work, travel jobs, and ways to earn while traveling.' },
];

async function ensureDefaultTravelCategories() {
  try {
    const existingCategories = await getByPrefix('category:');
    const now = new Date().toISOString();
    const bySlug = new Map(existingCategories.map((category: any) => [String(category?.slug || '').trim().toLowerCase(), category]));

    for (const template of DEFAULT_TRAVEL_CATEGORIES) {
      const existing = bySlug.get(template.slug);
      const category = {
        ...(existing || {}),
        ...template,
        id: existing?.id || template.id,
        created_at: existing?.created_at || now,
        updated_at: now,
      };
      await setByKey(`category:${category.id}`, category);
    }

    appLogger.log(`Ensured ${DEFAULT_TRAVEL_CATEGORIES.length} travel categories`);
  } catch (error) {
    appLogger.error('Error ensuring travel categories:', error);
  }
}

// Initialize storage on startup (non-blocking - don't wait for it)
initializeStorage().catch(err => appLogger.error('Storage initialization failed (non-critical):', err));

// Ensure travel categories on startup (non-blocking)
ensureDefaultTravelCategories().catch(err => appLogger.error('Category initialization failed (non-critical):', err));

// Enable request logging only outside production. Avoid noisy logs and accidental data exposure in prod.
if (Deno.env.get('NODE_ENV') !== 'production') {
  app.use('*', logger(appLogger.log));
}

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: (origin) => {
      const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      if (!origin) return "";
      if (allowedOrigins.includes(origin)) return origin;
      return "";
    },
    allowHeaders: ["Content-Type", "Authorization", "X-Query"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

function getClientIp(c: any): string {
  const forwardedFor = c.req.header('x-forwarded-for') || '';
  return forwardedFor.split(',')[0]?.trim() || c.req.header('x-real-ip') || 'unknown';
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function cleanText(value: unknown, maxLength: number): string {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, maxLength);
}

async function verifyTurnstile(c: any, token?: string) {
  const secret = Deno.env.get('TURNSTILE_SECRET_KEY');
  if (!secret) return null;
  if (!token) return c.json({ error: 'Bot verification is required.' }, 400);

  const form = new FormData();
  form.append('secret', secret);
  form.append('response', token);
  form.append('remoteip', getClientIp(c));

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
    const result = await response.json();
    if (!result.success) return c.json({ error: 'Bot verification failed.' }, 400);
  } catch (error) {
    appLogger.error('Turnstile verification failed:', error);
    return c.json({ error: 'Bot verification could not be completed.' }, 503);
  }

  return null;
}

async function enforcePublicWriteGuard(c: any, action: string, options: { windowSeconds?: number; maxAttempts?: number; turnstileToken?: string } = {}) {
  const turnstile = await verifyTurnstile(c, options.turnstileToken);
  if (turnstile) return turnstile;

  const windowSeconds = options.windowSeconds ?? 60;
  const maxAttempts = options.maxAttempts ?? 5;
  const ip = getClientIp(c);
  const fingerprint = await sha256(`${action}|${ip}`);
  const bucket = Math.floor(Date.now() / (windowSeconds * 1000));
  const key = `rate-limit:${action}:${fingerprint}:${bucket}`;
  const current = await getByKey(key).catch(() => null);
  const count = Number(current?.count || 0) + 1;
  await setByKey(key, { count, updated_at: new Date().toISOString() });

  if (count > maxAttempts) {
    return c.json({ error: 'Too many requests. Please try again later.' }, 429);
  }
  return null;
}

function rejectHoneypot(c: any, data: any) {
  if (data?.website_url || data?.company || data?.fax || data?.nickname) {
    return c.json({ success: true }, 202);
  }
  return null;
}

async function requireAuth(c: any, next: any) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ code: 401, message: 'User authentication required' }, 401);
  }

  const token = authHeader.replace('Bearer ', '').trim();
  if (!token || token === Deno.env.get('SUPABASE_ANON_KEY')) {
    return c.json({ code: 401, message: 'User authentication required' }, 401);
  }

  const { data: { user }, error } = await supabaseAuthClient.auth.getUser(token);
  if (error || !user) {
    return c.json({ code: 401, message: 'Invalid or expired session' }, 401);
  }

  const adminEmails = (Deno.env.get('ADMIN_EMAILS') || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (adminEmails.length > 0 && !adminEmails.includes((user.email || '').toLowerCase())) {
    return c.json({ code: 403, message: 'Admin access required' }, 403);
  }

  c.set('user', user);
  await next();
}

const isPublicEndpoint = (method: string, path: string): boolean => {
  if (method === 'OPTIONS') return true;
  const route = path.replace(/^\/server(?=\/|$)/, '').replace(/^\/make-server-3713a632(?=\/|$)/, '') || '/';

  if (method === 'GET') {
    return (
      route === '/health' ||
      route === '/settings' ||
      route === '/categories' ||
      route.startsWith('/categories/slug/') ||
      route === '/tags' ||
      route.startsWith('/tags/slug/') ||
      route === '/posts' ||
      route === '/posts/count' ||
      route.startsWith('/posts/slug/') ||
      (route.startsWith('/posts/') && route.endsWith('/comments')) ||
      route.startsWith('/redirects/check/') ||
      route === '/affiliates' ||
      route.startsWith('/affiliates/redirect/')
    );
  }

  if (method === 'POST') {
    return (
      route === '/subscribers' ||
      route === '/messages' ||
      route === '/comments' ||
      (route.startsWith('/posts/') && route.endsWith('/view')) ||
      route.startsWith('/affiliates/track/')
    );
  }

  return false;
};

app.use('*', async (c, next) => {
  if (isPublicEndpoint(c.req.method, c.req.path)) {
    return next();
  }
  return requireAuth(c, next);
});

// Health check endpoint
app.get("/health", (c) => {
  return c.json({ 
    status: "ok",
    version: "v3.1-secure",
    timestamp: new Date().toISOString(),
    message: "ok"
  });
});

// ============ POSTS ROUTES ============

// Get posts count (optimized for stats)
app.get("/posts/count", async (c) => {
  try {
    const queryHeader = c.req.header('X-Query');
    const params = queryHeader ? JSON.parse(queryHeader) : {};
    let { status } = params;
    const isAuthenticatedRequest = (c.req.header('Authorization') || '').replace('Bearer ', '').trim() !== Deno.env.get('SUPABASE_ANON_KEY');
    if (!isAuthenticatedRequest) status = 'published';

    const posts = await getByPrefix('post:');
    
    let count = posts.length;
    if (status) {
      count = posts.filter((p: any) => p.status === status).length;
    }

    return c.json({ count });
  } catch (error: any) {
    appLogger.error('Error counting posts:', error);
    return c.json({ error: error.message }, 500);
  }
});

// List posts
app.get("/posts", async (c) => {
  try {
    const queryHeader = c.req.header('X-Query');
    const params = queryHeader ? JSON.parse(queryHeader) : {};
    let { status, category, tag, limit = 100, offset = 0, search } = params;
    const isAuthenticatedRequest = (c.req.header('Authorization') || '').replace('Bearer ', '').trim() !== Deno.env.get('SUPABASE_ANON_KEY');
    if (!isAuthenticatedRequest) status = 'published';

    const posts = await getByPrefix('post:');

    // Filter by status
    let filteredPosts = posts;
    if (status) {
      filteredPosts = filteredPosts.filter((p: any) => p.status === status);
    }

    // Filter by category. Older/prototype data may store category IDs, slugs, names,
    // comma-separated strings, or full objects. Accept every known shape.
    if (category) {
      const allCategories = await getByPrefix('category:');
      const matchedCategory = allCategories.find((cat: any) => taxonomyRecordMatchesInput(cat, category));
      const acceptedCategoryValues = acceptedTaxonomyValues(category, matchedCategory);
      filteredPosts = filteredPosts.filter((p: any) => taxonomyValues(p.categories).some((value: any) => taxonomyMatches(value, acceptedCategoryValues)));
    }

    // Filter by tag. Older/prototype data may store tag IDs, slugs, names,
    // comma-separated strings, or full objects. Accept every known shape.
    if (tag) {
      const allTags = await getByPrefix('tag:');
      const matchedTag = allTags.find((tagRecord: any) => taxonomyRecordMatchesInput(tagRecord, tag));
      const acceptedTagValues = acceptedTaxonomyValues(tag, matchedTag);
      filteredPosts = filteredPosts.filter((p: any) => taxonomyValues(p.tags).some((value: any) => taxonomyMatches(value, acceptedTagValues)));
    }

    // Search filter (title, excerpt, content)
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPosts = filteredPosts.filter((p: any) => {
        const titleMatch = p.title?.toLowerCase().includes(searchLower);
        const excerptMatch = p.excerpt?.toLowerCase().includes(searchLower);
        const slugMatch = p.slug?.toLowerCase().includes(searchLower);
        return titleMatch || excerptMatch || slugMatch;
      });
    }

    // Sort by published date (newest first)
    filteredPosts.sort((a: any, b: any) => {
      const dateA = new Date(a.published_at || a.created_at).getTime();
      const dateB = new Date(b.published_at || b.created_at).getTime();
      return dateB - dateA;
    });

    // Pagination
    const paginatedPosts = filteredPosts.slice(offset, offset + limit);

    // Return posts with metadata
    return c.json({
      posts: paginatedPosts,
      total: filteredPosts.length,
      offset,
      limit,
      hasMore: offset + limit < filteredPosts.length
    });
  } catch (error: any) {
    appLogger.error('Error listing posts:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get post by ID
app.get("/posts/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const post = await getByKey(`post:${id}`);

    if (!post) {
      return c.json({ error: 'Post not found' }, 404);
    }

    return c.json(post);
  } catch (error: any) {
    appLogger.error('Error getting post:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get post by slug
app.get("/posts/slug/:slug", async (c) => {
  try {
    const slug = c.req.param('slug');
    const allPosts = await getByPrefix('post:');
    const post = allPosts.find((p: any) => p.slug === slug);

    if (!post) {
      return c.json({ error: 'Post not found' }, 404);
    }

    return c.json(post);
  } catch (error: any) {
    appLogger.error('Error getting post by slug:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Create post
app.post("/posts", async (c) => {
  try {
    const postData = await c.req.json();

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const post = {
      id,
      ...postData,
      author_id: 'demo-user',
      author_name: 'Admin',
      created_at: now,
      updated_at: now,
      views: 0,
      // Set published_at if status is published
      published_at: postData.status === 'published' ? now : postData.published_at,
    };

    await setByKey(`post:${id}`, post);
    return c.json(post, 201);
  } catch (error: any) {
    appLogger.error('Error creating post:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Update post
app.put("/posts/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();

    const existing = await getByKey(`post:${id}`);
    if (!existing) {
      return c.json({ error: 'Post not found' }, 404);
    }

    const updated = {
      ...existing,
      ...updates,
      id,
      updated_at: new Date().toISOString(),
    };

    // If status is being changed to published and there's no published_at, set it now
    if (updates.status === 'published' && !updated.published_at) {
      updated.published_at = new Date().toISOString();
    }

    await setByKey(`post:${id}`, updated);
    return c.json(updated);
  } catch (error: any) {
    appLogger.error('Error updating post:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Delete post
app.delete("/posts/:id", requireAuth, async (c) => {
  try {
    const id = c.req.param('id');
    await deleteByKey(`post:${id}`);
    return c.json({ success: true });
  } catch (error: any) {
    appLogger.error('Error deleting post:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Increment post views
app.post("/posts/:id/view", async (c) => {
  try {
    const id = c.req.param('id');
    const post = await getByKey(`post:${id}`);

    if (post) {
      post.views = (post.views || 0) + 1;
      await setByKey(`post:${id}`, post);
    }

    return c.json({ success: true });
  } catch (error: any) {
    appLogger.error('Error incrementing views:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============ CATEGORIES ROUTES ============

app.get("/categories", async (c) => {
  try {
    const categories = await getByPrefix('category:');
    return c.json(categories); // getByPrefix already returns values
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.get("/categories/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const category = await getByKey(`category:${id}`);
    if (!category) return c.json({ error: 'Not found' }, 404);
    return c.json(category);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.get("/categories/slug/:slug", async (c) => {
  try {
    const slug = c.req.param('slug');
    const categories = await getByPrefix('category:');
    const normalizedSlug = String(slug || '').trim().toLowerCase();
    const slugify = (value: any) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const category = categories.find((cat: any) => {
      return String(cat.slug || '').trim().toLowerCase() === normalizedSlug ||
        slugify(cat.name) === normalizedSlug ||
        String(cat.id || '').trim().toLowerCase() === normalizedSlug;
    });
    if (!category) return c.json({ error: 'Not found' }, 404);
    return c.json(category);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.post("/categories", async (c) => {
  try {
    const data = await c.req.json();
    const slugify = (value: any) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const requestedSlug = slugify(data?.slug || data?.name);

    if (!requestedSlug) {
      return c.json({ error: 'Category name is required' }, 400);
    }

    const categories = await getByPrefix('category:');
    const existing = categories.find((cat: any) =>
      slugify(cat?.slug || cat?.name) === requestedSlug ||
      String(cat?.name || '').trim().toLowerCase() === String(data?.name || '').trim().toLowerCase()
    );

    if (existing) {
      return c.json(existing, 200);
    }

    const id = crypto.randomUUID();
    const category = { id, ...data, slug: requestedSlug };
    await setByKey(`category:${id}`, category);
    return c.json(category, 201);
  } catch (error: any) {
    const message = String(error?.message || error);
    if (message.includes('categories_slug_idx') || message.includes('duplicate key')) {
      return c.json({ error: 'A category with this slug already exists' }, 409);
    }
    return c.json({ error: message }, 500);
  }
});

app.put("/categories/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    const category = { id, ...data };
    await setByKey(`category:${id}`, category);
    return c.json(category);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.delete("/categories/:id", async (c) => {
  try {
    const id = c.req.param('id');
    await deleteByKey(`category:${id}`);
    return c.json({ success: true });
  } catch (error: any) {
    appLogger.error('Error deleting category:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============ TAGS ROUTES ============

app.get("/tags", async (c) => {
  try {
    const tags = await getByPrefix('tag:');
    return c.json(tags); // getByPrefix already returns values
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.get("/tags/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const tag = await getByKey(`tag:${id}`);
    if (!tag) return c.json({ error: 'Not found' }, 404);
    return c.json(tag);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.get("/tags/slug/:slug", async (c) => {
  try {
    const slug = c.req.param('slug');
    const tags = await getByPrefix('tag:');
    const tag = tags.find((item: any) => item.slug === slug);
    if (!tag) return c.json({ error: 'Not found' }, 404);
    return c.json(tag);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.post("/tags", async (c) => {
  try {
    const data = await c.req.json();
    const slugify = (value: any) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const requestedSlug = slugify(data?.slug || data?.name);

    if (!requestedSlug) {
      return c.json({ error: 'Tag name is required' }, 400);
    }

    const tags = await getByPrefix('tag:');
    const existing = tags.find((tag: any) =>
      slugify(tag?.slug || tag?.name) === requestedSlug ||
      String(tag?.name || '').trim().toLowerCase() === String(data?.name || '').trim().toLowerCase()
    );

    if (existing) {
      return c.json(existing, 200);
    }

    const id = crypto.randomUUID();
    const tag = { id, ...data, slug: requestedSlug };
    await setByKey(`tag:${id}`, tag);
    return c.json(tag, 201);
  } catch (error: any) {
    const message = String(error?.message || error);
    if (message.includes('tags_slug_idx') || message.includes('duplicate key')) {
      return c.json({ error: 'A tag with this slug already exists' }, 409);
    }
    return c.json({ error: message }, 500);
  }
});

app.put("/tags/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    const tag = { id, ...data };
    await setByKey(`tag:${id}`, tag);
    return c.json(tag);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.delete("/tags/:id", async (c) => {
  try {
    const id = c.req.param('id');
    await deleteByKey(`tag:${id}`);
    return c.json({ success: true });
  } catch (error: any) {
    appLogger.error('Error deleting tag:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============ AFFILIATES ROUTES ============

app.get("/affiliates", async (c) => {
  try {
    const affiliates = await listAffiliatesWithClickCounts();
    return c.json({ affiliates });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.post("/affiliates", async (c) => {
  try {
    const data = await c.req.json();
    const id = crypto.randomUUID();
    const affiliate = { 
      id, 
      ...data, 
      clicks: 0,
      created_at: new Date().toISOString(),
    };
    await setByKey(`affiliate:${id}`, affiliate);
    return c.json(affiliate, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.put("/affiliates/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    const existing = await getByKey(`affiliate:${id}`);
    const affiliate = { ...existing, ...data, id };
    await setByKey(`affiliate:${id}`, affiliate);
    return c.json(affiliate);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.delete("/affiliates/:id", async (c) => {
  try {
    const id = c.req.param('id');
    await deleteByKey(`affiliate:${id}`);
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Server-side affiliate redirect and tracking
app.get("/affiliates/redirect/:slug", async (c) => {
  try {
    const slug = c.req.param('slug');
    const affiliates = await getByPrefix('affiliate:');
    const affiliate = affiliates.find((aff: any) => aff.slug === slug);

    if (!affiliate) {
      return c.text('Affiliate link not found', 404);
    }

    await recordAffiliateClick(c, affiliate, c.req.query('referrer'));
    return c.redirect(affiliate.destination_url, 302);
  } catch (error: any) {
    appLogger.error('Error redirecting affiliate click:', error);
    return c.text('Failed to redirect affiliate link', 500);
  }
});

// Legacy affiliate click tracking endpoint
app.post("/affiliates/track/:slug", async (c) => {
  try {
    const slug = c.req.param('slug');
    const body = await c.req.json().catch(() => ({}));
    const referrer = body?.referrer;

    const affiliates = await getByPrefix('affiliate:');
    const affiliate = affiliates.find((aff: any) => aff.slug === slug);

    if (!affiliate) {
      return c.json({ error: 'Affiliate link not found' }, 404);
    }

    await recordAffiliateClick(c, affiliate, referrer);

    return c.json({ destination_url: affiliate.destination_url });
  } catch (error: any) {
    appLogger.error('Error tracking affiliate click:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============ MEDIA ROUTES ============

app.get("/media", async (c) => {
  try {
    const media = await getByPrefix('media:');
    return c.json(media); // getByPrefix already returns values
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.post("/media/upload", requireAuth, async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const altText = formData.get('alt_text') as string;

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Upload file
    const filename = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from('make-3713a632-media')
      .upload(filename, file);

    if (error) throw error;

    // Get signed URL
    const { data: urlData } = await supabase.storage
      .from('make-3713a632-media')
      .createSignedUrl(filename, 31536000); // 1 year

    const id = crypto.randomUUID();
    const mediaAsset = {
      id,
      url: urlData?.signedUrl || '',
      filename,
      alt_text: altText,
      size: file.size,
      uploaded_at: new Date().toISOString(),
    };

    await setByKey(`media:${id}`, mediaAsset);
    return c.json(mediaAsset, 201);
  } catch (error: any) {
    appLogger.error('Error uploading media:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.delete("/media/:id", requireAuth, async (c) => {
  try {
    const id = c.req.param('id');
    const media = await getByKey(`media:${id}`);
    
    if (media) {
      // Delete from storage
      await supabase.storage.from('make-3713a632-media').remove([media.filename]);
    }

    await deleteByKey(`media:${id}`);
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});


const PRIVATE_SETTING_KEYS = new Set([
  'adsense_publisher_id',
  'ga_tracking_id',
  'google_analytics_id',
  'google_adsense_client_id',
]);

function sanitizePublicSettings(settings: Record<string, any>) {
  const sanitized = { ...(settings || {}) };
  for (const key of PRIVATE_SETTING_KEYS) {
    delete sanitized[key];
  }
  return sanitized;
}

function applyBackendOnlySettings(settings: Record<string, any>) {
  return {
    ...(settings || {}),
    // Keep these values backend-only. Configure them as Supabase Edge Function secrets
    // instead of storing or editing them in the frontend/admin UI.
    google_analytics_id: Deno.env.get('GOOGLE_ANALYTICS_ID') || settings?.google_analytics_id || '',
    ga_tracking_id: Deno.env.get('GA_TRACKING_ID') || settings?.ga_tracking_id || '',
    google_adsense_client_id: Deno.env.get('GOOGLE_ADSENSE_CLIENT_ID') || settings?.google_adsense_client_id || '',
    adsense_publisher_id: Deno.env.get('ADSENSE_PUBLISHER_ID') || settings?.adsense_publisher_id || '',
  };
}

// ============ SETTINGS ROUTES ============

app.get("/settings", async (c) => {
  try {
    const settings = await getByKey('settings:site') || {
      site_name: 'AI Summit',
      site_title: 'AI Summit',
      site_description: '',
      site_url: '',
      logo_url: '',
      logo_width: 180,
      logo_height: 40,
      adsense_enabled: false,
      adsense_publisher_id: '',
      ga_tracking_id: '',
      google_analytics_id: '',
      google_adsense_client_id: '',
      affiliate_disclosure_enabled: true,
      affiliate_disclosure_text: 'This post may contain affiliate links.',
      social_tiktok: '',
      social_instagram: '',
      social_facebook: '',
      social_youtube: '',
    };
    return c.json(sanitizePublicSettings(settings));
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.get("/settings/private", requireAuth, async (c) => {
  try {
    const settings = await getByKey('settings:site') || {
      site_name: 'AI Summit',
      site_title: 'AI Summit',
      site_description: '',
      site_url: '',
      logo_url: '',
      logo_width: 180,
      logo_height: 40,
      adsense_enabled: false,
      adsense_publisher_id: '',
      ga_tracking_id: '',
      google_analytics_id: '',
      google_adsense_client_id: '',
      affiliate_disclosure_enabled: true,
      affiliate_disclosure_text: 'This post may contain affiliate links.',
      social_tiktok: '',
      social_instagram: '',
      social_facebook: '',
      social_youtube: '',
    };
    return c.json(sanitizePublicSettings(settings));
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.put("/settings", requireAuth, async (c) => {
  try {
    const incomingSettings = await c.req.json();
    const existingSettings = await getByKey('settings:site') || {};
    const settings = { ...existingSettings, ...incomingSettings };

    // Never accept backend-only Google/ads identifiers from the frontend.
    // Existing values are preserved; new values should be configured as backend env/secrets.
    for (const key of PRIVATE_SETTING_KEYS) {
      if (Object.prototype.hasOwnProperty.call(incomingSettings, key)) {
        settings[key] = existingSettings[key] || '';
      }
    }

    await setByKey('settings:site', settings);
    return c.json(applyBackendOnlySettings(settings));
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============ ANALYTICS ROUTES ============

app.get("/analytics/dashboard", async (c) => {
  try {
    // Get all necessary data
    const [posts, categories, tags, affiliates, subscribers, clickCounts] = await Promise.all([
      getByPrefix('post:'),
      getByPrefix('category:'),
      getByPrefix('tag:'),
      getByPrefix('affiliate:'),
      getByPrefix('subscriber:'),
      buildAffiliateClickCountMap(),
    ]);

    // Calculate stats
    const totalPosts = posts.length;
    const publishedPosts = posts.filter((p: any) => p.status === 'published').length;
    const draftPosts = posts.filter((p: any) => p.status === 'draft').length;
    const totalCategories = categories.length;
    const totalTags = tags.length;
    const totalAffiliateLinks = affiliates.length;
    const totalClicks = Array.from(clickCounts.values()).reduce((sum: number, count: number) => sum + count, 0);
    const totalSubscribers = subscribers.length;

    return c.json({
      stats: {
        total_posts: totalPosts,
        published_posts: publishedPosts,
        draft_posts: draftPosts,
        total_categories: totalCategories,
        total_tags: totalTags,
        total_affiliate_links: totalAffiliateLinks,
        total_affiliate_clicks: totalClicks,
        total_subscribers: totalSubscribers,
      },
      recent_posts: posts
        .sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 5),
    });
  } catch (error: any) {
    appLogger.error('Failed to fetch dashboard analytics:', error);
    return c.json({ error: error.message || 'Failed to fetch analytics' }, 500);
  }
});

// ============ SUBSCRIBERS ROUTES ============

// Get all subscribers
app.get("/subscribers", async (c) => {
  try {
    const subscribers = await getByPrefix('subscriber:');
    // Sort by subscribed date (newest first)
    subscribers.sort((a: any, b: any) => {
      return new Date(b.subscribed_at).getTime() - new Date(a.subscribed_at).getTime();
    });
    return c.json({ subscribers, total: subscribers.length });
  } catch (error: any) {
    appLogger.error('Error fetching subscribers:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Add new subscriber (public endpoint)
app.post("/subscribers", async (c) => {
  try {
    const data = await c.req.json();
    const honeypot = rejectHoneypot(c, data);
    if (honeypot) return honeypot;
    const rateLimit = await enforcePublicWriteGuard(c, 'subscribers', { windowSeconds: 60, maxAttempts: 3, turnstileToken: data.turnstileToken || data.cf_turnstile_response });
    if (rateLimit) return rateLimit;

    const email = cleanText(data.email, 254).toLowerCase();
    if (!email || !isValidEmail(email)) {
      return c.json({ error: 'Valid email is required' }, 400);
    }

    const existing = await getByPrefix('subscriber:');
    const duplicate = existing.find((sub: any) => sub.email.toLowerCase() === email);

    if (duplicate) {
      return c.json({ error: 'Email already subscribed' }, 409);
    }

    const id = crypto.randomUUID();
    const subscriber = {
      id,
      email,
      subscribed_at: new Date().toISOString(),
      status: 'active',
    };

    await setByKey(`subscriber:${id}`, subscriber);
    return c.json({ success: true, subscriber }, 201);
  } catch (error: any) {
    appLogger.error('Error adding subscriber:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Delete subscriber (admin only)
app.delete("/subscribers/:id", async (c) => {
  try {
    const id = c.req.param('id');
    await deleteByKey(`subscriber:${id}`);
    appLogger.log('Subscriber deleted:', id);
    return c.json({ success: true });
  } catch (error: any) {
    appLogger.error('Error deleting subscriber:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Export subscribers as CSV (admin only)
app.get("/subscribers/export/csv", async (c) => {
  try {
    const subscribers = await getByPrefix('subscriber:');
    
    // Sort by subscribed date
    subscribers.sort((a: any, b: any) => {
      return new Date(b.subscribed_at).getTime() - new Date(a.subscribed_at).getTime();
    });

    // Generate CSV content
    let csv = 'Email,Subscribed Date,Status\n';
    subscribers.forEach((sub: any) => {
      const date = new Date(sub.subscribed_at).toLocaleDateString();
      csv += `${sub.email},${date},${sub.status}\n`;
    });

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="subscribers-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    appLogger.error('Error exporting subscribers:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============ AI SEO ROUTES ============


function stripJsonCodeFence(content: string): string {
  let value = (content || '').trim();
  if (value.startsWith('```')) {
    value = value.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  }
  return value;
}

function extractJsonObject(content: string): string {
  const stripped = stripJsonCodeFence(content);
  const first = stripped.indexOf('{');
  const last = stripped.lastIndexOf('}');
  if (first >= 0 && last > first) return stripped.slice(first, last + 1);
  return stripped;
}

function sanitizeJsonControlCharacters(input: string): string {
  let output = '';
  let inString = false;
  let escaped = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    const code = ch.charCodeAt(0);

    if (escaped) {
      output += ch;
      escaped = false;
      continue;
    }

    if (ch === '\\') {
      output += ch;
      escaped = true;
      continue;
    }

    if (ch === '"') {
      output += ch;
      inString = !inString;
      continue;
    }

    if (inString) {
      if (ch === '\n') {
        output += '\\n';
      } else if (ch === '\r') {
        output += '\\r';
      } else if (ch === '\t') {
        output += '\\t';
      } else if (code >= 0 && code <= 0x1f) {
        output += ' ';
      } else {
        output += ch;
      }
    } else {
      output += ch;
    }
  }

  return output;
}

function parseAiJson(content: string): any {
  const extracted = extractJsonObject(content);
  try {
    return JSON.parse(extracted);
  } catch (_firstError) {
    return JSON.parse(sanitizeJsonControlCharacters(extracted));
  }
}

// Generate complete blog post from title
app.post("/ai/generate-post", async (c) => {
  try {
    const { 
      title, 
      mode = 'generate',
      rawContent = '',
      wordCount = 1500, 
      tone = 'professional', 
      keywords = [], 
      focusKeyword = '',
      brief = '',
      targetAudience = '',
      keyPoints = ''
    } = await c.req.json();
    
    if (!title) {
      return c.json({ error: 'Title is required' }, 400);
    }

    // Format mode requires rawContent
    if (mode === 'format' && !rawContent) {
      return c.json({ error: 'Content is required for format mode' }, 400);
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      return c.json({ 
        error: 'OpenAI API key not configured',
        message: 'Please add your OpenAI API key in the environment settings'
      }, 500);
    }

    appLogger.log('Calling OpenAI API for blog post generation...', { title, mode, wordCount, tone, focusKeyword, brief, targetAudience });
    
    // Different prompts based on mode
    let systemPrompt = '';
    let userPrompt = '';
    
    if (mode === 'format') {
      // Format existing content into blocks
      systemPrompt = `You are an expert content formatter. Your job is to take existing blog post content and structure it into professional content blocks.

AVAILABLE BLOCK TYPES:
1. heading - { "type": "heading", "content": { "text": "Title", "level": 2 or 3 } }
2. paragraph - { "type": "paragraph", "content": { "text": "Text with <a href='/blog/topic'>links</a>" } }
3. list - { "type": "list", "content": { "items": ["Point 1", "Point 2"], "ordered": false } }
4. callout - { "type": "callout", "content": { "text": "Important note", "type": "info|warning|success" } }
5. image - { "type": "image", "content": { "url": "https://images.unsplash.com/...", "alt": "Description", "caption": "Caption" } }
6. button - { "type": "button", "content": { "text": "Click Here", "url": "#", "style": "primary" } }

FORMATTING RULES:
✅ Break content into logical sections with H2/H3 headings
✅ Convert lists into proper list blocks (bullet or numbered)
✅ Highlight key insights as callout blocks
✅ Add image blocks where visuals would enhance the content
✅ Preserve all existing links in <a href="...">text</a> format
✅ Add CTA buttons at the end if appropriate
✅ Maintain the original tone and message
✅ Ensure proper flow and readability

Return ONLY a JSON object with this structure:
{
  "blocks": [ array of content blocks ],
  "excerpt": "A compelling 150-160 character meta description"
}`;

      const focusKeywordText = focusKeyword ? `\nFocus keyword: ${focusKeyword} (ensure headings and structure support SEO for this keyword)` : '';
      
      userPrompt = `Format this blog post content into professional content blocks:

Title: ${title}${focusKeywordText}

Content to format:
${rawContent}

Transform this into a well-structured blog post using appropriate block types. Add headings where natural section breaks occur, convert lists, highlight important points as callouts, and suggest 2-3 image placements with descriptive alt text.`;
      
    } else {
      // Generate new content
      const keywordText = keywords.length > 0 ? `\n- Target keywords: ${keywords.join(', ')}` : '';
      const focusKeywordText = focusKeyword ? `\n- PRIMARY FOCUS KEYWORD: "${focusKeyword}" (CRITICAL: Must appear in first paragraph AND title must contain this keyword)` : '';
      const titleKeywordReminder = focusKeyword ? `\n\n⚠️ CRITICAL: The user's title is "${title}". ${title.toLowerCase().includes(focusKeyword.toLowerCase()) ? 'Good - it contains the focus keyword!' : `WARNING: Title does NOT contain focus keyword "${focusKeyword}". You should naturally work the keyword into the content flow and suggest they update the title.`}` : '';
      const briefText = brief ? `\n- Brief/Description: ${brief}` : '';
      const audienceText = targetAudience ? `\n- Target Audience: ${targetAudience}` : '';
      const keyPointsText = keyPoints ? `\n- Key Points to Cover:\n${keyPoints}` : '';
    
      systemPrompt = `You are an expert AI blog writer specializing in SEO-optimized content. Generate blog posts as structured content blocks for a professional blog editor.

🎯 CRITICAL SEO REQUIREMENTS FOR 100/100 SCORE:
1. ✅ Include focus keyword in the FIRST paragraph (within first 100 words)
2. ✅ Use H2 and H3 heading blocks (at least 3-5 headings)
3. ✅ Add internal links (use href="/" or href="/blog/related-topic" format)
4. ✅ Add external links to authoritative sources (use https:// links)
5. ✅ Include image blocks with descriptive alt text
6. ✅ Generate AT LEAST ${wordCount} words (minimum 1500 for best SEO)
7. ✅ Natural keyword density (1-2% for focus keyword)

CONTENT STRUCTURE (MANDATORY):
- Opening paragraph: Hook + focus keyword in first 100 words
- H2 heading: Main section
- 2-3 paragraphs with internal/external links
- H2/H3 heading: Another section
- Image block with alt text
- Callout block for key insight
- List block (bullet or numbered)
- More H2/H3 sections with rich content
- Final CTA button

CONTENT BLOCK TYPES AVAILABLE:
1. heading - For section titles (level 2 or 3)
   { "type": "heading", "content": { "text": "Section Title", "level": 2 } }

2. paragraph - For body text (MUST include <a> tags for links)
   { "type": "paragraph", "content": { "text": "Text with <a href='/blog/topic'>internal link</a> and <a href='https://example.com'>external link</a>" } }

3. list - For bullet points or numbered lists
   { "type": "list", "content": { "items": ["Point 1", "Point 2"], "ordered": false } }

4. callout - For highlighted notes (types: info, warning, success)
   { "type": "callout", "content": { "text": "Key insight here", "type": "info" } }

5. image - Use Unsplash URLs with DESCRIPTIVE alt text
   { "type": "image", "content": { "url": "https://images.unsplash.com/photo-...", "alt": "Descriptive alt text with keywords", "caption": "Image caption" } }

6. button - For CTAs at the end
   { "type": "button", "content": { "text": "Learn More", "url": "#", "style": "primary" } }

LINK FORMATTING RULES:
- Internal links: Use <a href="/blog/topic-name">anchor text</a> format
- External links: Use <a href="https://authoritative-site.com">anchor text</a> format
- Include 2-3 internal links and 1-2 external links minimum

SEO WRITING STYLE:
- Write in ${tone} tone
- Use clear, scannable headings
- Include practical examples and insights
- Natural keyword integration (no stuffing)
- Focus on E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)
- Provide real value to readers

TARGET: Minimum ${wordCount} words (more is better for SEO)

Return ONLY a JSON object with this structure:
{
  "blocks": [
    {
      "id": "block-1",
      "type": "paragraph|heading|list|callout|image|button",
      "content": { ... }
    }
  ],
  "excerpt": "A compelling 150-160 character meta description for SEO"
}`;

      userPrompt = `Write a comprehensive, SEO-optimized blog post as structured content blocks:
- Title: ${title}
- Target word count: ${wordCount} words (MINIMUM - go longer if needed)
- Tone: ${tone}${keywordText}${focusKeywordText}${briefText}${audienceText}${keyPointsText}${titleKeywordReminder}

CRITICAL REQUIREMENTS:
✅ Include focus keyword "${focusKeyword || 'main topic'}" in the FIRST paragraph
✅ Use multiple H2/H3 heading blocks throughout
✅ Add internal links using <a href="/blog/topic">text</a> format in paragraphs
✅ Add external links to authoritative sources using <a href="https://...">text</a>
✅ Include images with descriptive alt text containing keywords
✅ Generate at least ${wordCount} words

Make it informative, engaging, and valuable to readers while achieving 100/100 SEO score.`;
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.8,
        max_tokens: Math.max(Math.ceil(wordCount * 4), 8000), // Increased from 2.5x and 4000 cap to 4x and 8000 minimum
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      appLogger.error('OpenAI API error:', errorData);
      return c.json({ 
        error: 'Failed to generate blog post',
        details: errorData
      }, response.status);
    }

    const data = await response.json();
    
    const jsonContent = data.choices?.[0]?.message?.content || '';
    let result: any;
    try {
      result = parseAiJson(jsonContent);
    } catch (parseError: any) {
      appLogger.error('Failed to parse OpenAI JSON response:', {
        message: parseError?.message,
        preview: jsonContent.slice(0, 500),
      });
      return c.json({
        error: 'AI returned malformed JSON. Please try again.',
        details: parseError?.message || 'Malformed AI response',
      }, 502);
    }

    if (!result || !Array.isArray(result.blocks)) {
      return c.json({
        error: 'AI response was missing required content blocks. Please try again.',
      }, 502);
    }

    // Count words from paragraph and heading blocks
    const wordCountResult = result.blocks
      .filter((b: any) => b.type === 'paragraph' || b.type === 'heading')
      .reduce((sum: number, block: any) => {
        const text = block.content?.text || '';
        return sum + text.split(/\s+/).length;
      }, 0);

    appLogger.log('AI generated blog post successfully with structured blocks');

    return c.json({
      blocks: result.blocks,
      excerpt: result.excerpt,
      wordCount: wordCountResult,
    });
  } catch (error: any) {
    appLogger.error('Failed to generate blog post:', error);
    return c.json({ 
      error: error.message || 'Failed to generate blog post' 
    }, 500);
  }
});

// ============ REDIRECTS ROUTES ============

app.get("/redirects", async (c) => {
  try {
    const redirects = await getByPrefix('redirect:');
    return c.json(redirects);
  } catch (error: any) {
    appLogger.error('Error listing redirects:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.get("/redirects/check/*", async (c) => {
  try {
    // Get the full path after /redirects/check/
    const fullPath = c.req.path.replace('/make-server-3713a632/redirects/check/', '');
    
    // Handle 'index' as root path
    const path = fullPath === 'index' ? '/' : '/' + fullPath;
    const redirects = await getByPrefix('redirect:');
    const redirect = redirects.find((r: any) => r.from_path === path);
    
    if (redirect) {
      // Increment hit count
      redirect.hit_count = (redirect.hit_count || 0) + 1;
      await setByKey(`redirect:${redirect.id}`, redirect);
      
      return c.json({ 
        redirect: true, 
        to_path: redirect.to_path, 
        type: redirect.type 
      });
    }
    
    return c.json({ redirect: false });
  } catch (error: any) {
    appLogger.error('Error checking redirect:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.post("/redirects", async (c) => {
  try {
    const data = await c.req.json();
    
    if (!data.from_path || !data.to_path) {
      return c.json({ error: 'from_path and to_path are required' }, 400);
    }
    
    const id = crypto.randomUUID();
    const redirect = { 
      id, 
      ...data,
      hit_count: 0,
      created_at: new Date().toISOString(),
    };
    
    await setByKey(`redirect:${id}`, redirect);
    return c.json(redirect, 201);
  } catch (error: any) {
    appLogger.error('Error creating redirect:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.put("/redirects/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    const redirect = { id, ...data };
    await setByKey(`redirect:${id}`, redirect);
    return c.json(redirect);
  } catch (error: any) {
    appLogger.error('Error updating redirect:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.delete("/redirects/:id", async (c) => {
  try {
    const id = c.req.param('id');
    await deleteByKey(`redirect:${id}`);
    return c.json({ success: true });
  } catch (error: any) {
    appLogger.error('Error deleting redirect:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// CONTACT MESSAGES ENDPOINTS
// ============================================

// Create a new contact message (public endpoint)
app.post("/messages", async (c) => {
  try {
    const data = await c.req.json();
    const honeypot = rejectHoneypot(c, data);
    if (honeypot) return honeypot;
    const rateLimit = await enforcePublicWriteGuard(c, 'messages', { windowSeconds: 60, maxAttempts: 3, turnstileToken: data.turnstileToken || data.cf_turnstile_response });
    if (rateLimit) return rateLimit;

    if (!data.name || !data.email || !data.subject || !data.message) {
      return c.json({ error: 'All fields are required' }, 400);
    }

    const email = cleanText(data.email, 254).toLowerCase();
    if (!isValidEmail(email)) {
      return c.json({ error: 'Valid email is required' }, 400);
    }

    const id = crypto.randomUUID();
    const message = {
      id,
      name: cleanText(data.name, 120),
      email,
      subject: cleanText(data.subject, 160),
      message: cleanText(data.message, 5000),
      status: 'unread',
      created_at: new Date().toISOString(),
    };

    await setByKey(`message:${id}`, message);
    return c.json(message, 201);
  } catch (error: any) {
    appLogger.error('Error creating message:', error);
    return c.json({ error: error.message }, 500);
  }
});

// List all messages (admin only)
app.get("/messages", async (c) => {
  try {
    const messages = await getByPrefix('message:');
    // Sort by created_at descending (newest first)
    messages.sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return c.json(messages);
  } catch (error: any) {
    appLogger.error('Error listing messages:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Update message status (mark as read/unread)
app.put("/messages/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    
    const message = await getByKey(`message:${id}`);
    if (!message) {
      return c.json({ error: 'Message not found' }, 404);
    }
    
    const updatedMessage = {
      ...message,
      ...data,
      updated_at: new Date().toISOString(),
    };
    
    await setByKey(`message:${id}`, updatedMessage);
    appLogger.log('Message updated:', id);
    return c.json(updatedMessage);
  } catch (error: any) {
    appLogger.error('Error updating message:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Delete a message
app.delete("/messages/:id", async (c) => {
  try {
    const id = c.req.param('id');
    await deleteByKey(`message:${id}`);
    appLogger.log('Message deleted:', id);
    return c.json({ success: true });
  } catch (error: any) {
    appLogger.error('Error deleting message:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============ COMMENTS ROUTES ============

// Get all comments (with optional filters)
app.get("/comments", async (c) => {
  try {
    const queryHeader = c.req.header('X-Query');
    const params = queryHeader ? JSON.parse(queryHeader) : {};
    const { post_id, status, limit = 1000, offset = 0 } = params;

    let comments = await getByPrefix('comment:');

    // Filter by post_id
    if (post_id) {
      comments = comments.filter((c: any) => c.post_id === post_id);
    }

    // Filter by status
    if (status) {
      comments = comments.filter((c: any) => c.status === status);
    }

    // Sort by created_at descending (newest first)
    comments.sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Pagination
    const paginatedComments = comments.slice(offset, offset + limit);

    return c.json({ 
      comments: paginatedComments, 
      total: comments.length,
      offset,
      limit,
      hasMore: offset + limit < comments.length
    });
  } catch (error: any) {
    appLogger.error('Error listing comments:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get comments for a specific post (public)
app.get("/posts/:post_id/comments", async (c) => {
  try {
    const post_id = c.req.param('post_id');
    const allComments = await getByPrefix('comment:');
    
    // Filter approved comments for this post
    const comments = allComments.filter((comment: any) => 
      comment.post_id === post_id && comment.status === 'approved'
    );

    // Sort by created_at ascending (oldest first for reading flow)
    comments.sort((a: any, b: any) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    return c.json({ comments, total: comments.length });
  } catch (error: any) {
    appLogger.error('Error fetching post comments:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Create a new comment (public)
app.post("/comments", async (c) => {
  try {
    const data = await c.req.json();
    const honeypot = rejectHoneypot(c, data);
    if (honeypot) return honeypot;
    const rateLimit = await enforcePublicWriteGuard(c, 'comments', { windowSeconds: 60, maxAttempts: 4, turnstileToken: data.turnstileToken || data.cf_turnstile_response });
    if (rateLimit) return rateLimit;

    if (!data.post_id || !data.author_name || !data.author_email || !data.content) {
      return c.json({ error: 'Missing required fields: post_id, author_name, author_email, content' }, 400);
    }

    const authorEmail = cleanText(data.author_email, 254).toLowerCase();
    if (!isValidEmail(authorEmail)) {
      return c.json({ error: 'Invalid email address' }, 400);
    }

    const content = cleanText(data.content, 5000);
    const spamKeywords = ['viagra', 'casino', 'lottery', 'crypto giveaway', 'click here now'];
    const contentLower = content.toLowerCase();
    const isSpam = spamKeywords.some(keyword => contentLower.includes(keyword));

    const id = crypto.randomUUID();
    const comment = {
      id,
      post_id: cleanText(data.post_id, 120),
      parent_id: data.parent_id ? cleanText(data.parent_id, 120) : null,
      author_name: cleanText(data.author_name, 120),
      author_email: authorEmail,
      author_website: data.author_website ? cleanText(data.author_website, 300) : null,
      content,
      status: isSpam ? 'spam' : 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await setByKey(`comment:${id}`, comment);
    return c.json({ comment, message: isSpam ? 'Comment flagged as spam' : 'Comment submitted for moderation' }, 201);
  } catch (error: any) {
    appLogger.error('Error creating comment:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Update comment (admin - moderate, edit, etc.)
app.put("/comments/:id", requireAuth, async (c) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    
    const comment = await getByKey(`comment:${id}`);
    if (!comment) {
      return c.json({ error: 'Comment not found' }, 404);
    }
    
    const updatedComment = {
      ...comment,
      ...data,
      id, // Ensure ID doesn't change
      updated_at: new Date().toISOString(),
    };
    
    await setByKey(`comment:${id}`, updatedComment);
    appLogger.log('Comment updated:', id);
    return c.json(updatedComment);
  } catch (error: any) {
    appLogger.error('Error updating comment:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Delete comment (admin)
app.delete("/comments/:id", async (c) => {
  try {
    const id = c.req.param('id');
    await deleteByKey(`comment:${id}`);
    appLogger.log('Comment deleted:', id);
    return c.json({ success: true });
  } catch (error: any) {
    appLogger.error('Error deleting comment:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Bulk update comments (admin - bulk approve/reject/delete)
app.post("/comments/bulk", async (c) => {
  try {
    const { action, ids } = await c.req.json();
    
    if (!action || !ids || !Array.isArray(ids)) {
      return c.json({ error: 'Invalid request: action and ids array required' }, 400);
    }

    const results = [];
    for (const id of ids) {
      try {
        if (action === 'delete') {
          await deleteByKey(`comment:${id}`);
          results.push({ id, success: true });
        } else {
          const comment = await getByKey(`comment:${id}`);
          if (comment) {
            comment.status = action; // approve, reject, spam
            comment.updated_at = new Date().toISOString();
            await setByKey(`comment:${id}`, comment);
            results.push({ id, success: true });
          }
        }
      } catch (err: any) {
        results.push({ id, success: false, error: err.message });
      }
    }

    appLogger.log(`Bulk action completed: ${action} on ${ids.length} comments`);
    return c.json({ results, total: ids.length });
  } catch (error: any) {
    appLogger.error('Error performing bulk action:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get comment statistics (admin)
app.get("/comments/stats", async (c) => {
  try {
    const comments = await getByPrefix('comment:');
    
    const stats = {
      total: comments.length,
      pending: comments.filter((c: any) => c.status === 'pending').length,
      approved: comments.filter((c: any) => c.status === 'approved').length,
      spam: comments.filter((c: any) => c.status === 'spam').length,
      rejected: comments.filter((c: any) => c.status === 'rejected').length,
    };

    return c.json(stats);
  } catch (error: any) {
    appLogger.error('Error fetching comment stats:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// BACKUP AND RESTORE ENDPOINTS (ADMIN ONLY)
// ============================================
app.get("/backup/export", async (c) => {
  try {
    const prefixes = ['post:', 'category:', 'tag:', 'affiliate:', 'click:', 'media:', 'subscriber:', 'message:', 'comment:', 'redirect:', 'settings'];
    const data: Record<string, unknown[]> = {};
    const records: Array<{ key: string; value: any }> = [];
    for (const prefix of prefixes) {
      data[prefix] = await getByPrefix(prefix);
      records.push(...await getRecordsByPrefix(prefix));
    }
    return c.json({ exported_at: new Date().toISOString(), format_version: 2, storage: 'typed-supabase-tables', data, records });
  } catch (error: any) {
    appLogger.error('Backup export failed:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.post("/backup/restore", async (c) => {
  try {
    const body = await c.req.json();
    if (body?.confirm !== 'RESTORE') return c.json({ error: 'Set confirm to RESTORE to proceed.' }, 400);
    const records = body?.records;
    if (!Array.isArray(records)) return c.json({ error: 'records must be an array of { key, value } objects.' }, 400);
    for (const record of records) {
      if (!record?.key || typeof record.key !== 'string') return c.json({ error: 'Every record needs a string key.' }, 400);
      await setByKey(record.key, record.value);
    }
    return c.json({ success: true, restored: records.length });
  } catch (error: any) {
    appLogger.error('Backup restore failed:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Normalize Supabase Edge Function paths so routes work both remotely and locally.
// Remote calls can arrive as /server/settings while local/direct calls may be /settings.
Deno.serve((req) => {
  const url = new URL(req.url);
  url.pathname = url.pathname
    .replace(/^\/server(?=\/|$)/, '')
    .replace(/^\/make-server-3713a632(?=\/|$)/, '') || '/';

  return app.fetch(new Request(url.toString(), req));
});

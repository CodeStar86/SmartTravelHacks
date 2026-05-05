# SEO and Category Image Fixes

## What changed

- Updated `vercel.json` so production builds run `npm run build:ssg` and prerender public pages.
- Fixed all known `smarttavelhacks.com` typo URLs to `smarttravelhacks.com`.
- Replaced old `wanderjournal.com` and `YOUR-VERCEL-DOMAIN.vercel.app` sitemap/domain defaults with `https://www.smarttravelhacks.com`.
- Fixed `public/robots.txt` so it points to `https://www.smarttravelhacks.com/sitemap.xml` and disallows `/admin/`.
- Updated `src/app/pages/RobotsPage.tsx` so the runtime robots page uses the configured site URL.
- Updated `scripts/generate-content-manifest.mjs` so it:
  - uses the correct production domain by default,
  - writes both `sitemap.xml` and `robots.txt`,
  - reads JSONB `data` rows from Supabase correctly,
  - can use `SUPABASE_SERVICE_ROLE_KEY` at build time so RLS does not prevent the sitemap/manifest from being populated.
- Expanded category image handling in `src/app/pages/HomePage.tsx` so categories such as `southeast-asia` and `central-east-and-south-asia` no longer fall back to the same repeated image.
- Added a rotating fallback image list for any future category slug that is not explicitly mapped.

## Important Vercel environment variables

Set these before redeploying:

```env
VITE_SITE_URL=https://www.smarttravelhacks.com
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

`SUPABASE_SERVICE_ROLE_KEY` is used only by the Node build script to generate static SEO files. Do not expose it with a `VITE_` prefix.

## After redeploying

Check these URLs:

- `https://www.smarttravelhacks.com/robots.txt`
- `https://www.smarttravelhacks.com/sitemap.xml`
- `https://www.smarttravelhacks.com/data/content-manifest.json`
- Your article URL without the hash, for example: `https://www.smarttravelhacks.com/blog/2-weeks-in-southeast-asia-easy-route-for-first-time-travelers`

The sitemap and content manifest should include your published blog posts after the Vercel environment variables are set correctly.

# Build SSG and Public Read Update

This handoff makes the production build path explicit and adds the Supabase read policies needed for static generation.

## What changed

- `vercel.json` already used `npm run build:ssg`; this remains the production build command.
- `package.json` now makes `npm run build` delegate to `npm run build:ssg` so local and CI builds use the same SEO-safe path.
- Added `npm run build:spa` for the old plain Vite build if it is ever needed.
- Updated docs that still referenced `npm run build` so deployment guidance consistently says `npm run build:ssg`.
- Added `supabase/migrations/0004_public_read_policies.sql` for Option A.

## Required deployment steps

1. Push/apply the new Supabase migration:

   ```bash
   npm run deploy:supabase:db
   ```

   Or run `supabase/migrations/0004_public_read_policies.sql` in the Supabase SQL editor.

2. Confirm these Vercel Production environment variables are set:

   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
   VITE_SITE_URL=https://www.smarttravelhacks.com
   ```

3. Redeploy on Vercel. The build command should be:

   ```bash
   npm run build:ssg
   ```

4. After deploy, check:

   - `https://www.smarttravelhacks.com/blog/entry-rules-for-europe-ees-etias-visas` returns `200 OK`.
   - `https://www.smarttravelhacks.com/sitemap.xml` includes the post URL.

5. In Google Search Console, use **URL Inspection → Test Live URL → Request Indexing**.

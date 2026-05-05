# SSG setup and deployment

## What changed

This project now includes a static-site-generation workflow on top of the existing Vite app.

### New build flow

1. `scripts/generate-content-manifest.mjs`
   - pulls published posts, categories, and tags from Supabase
   - writes `public/data/content-manifest.json`
   - writes `public/sitemap.xml`
2. `vite build`
   - builds the client app
3. `scripts/prerender.mjs`
   - creates static HTML pages in `dist/` for:
     - `/`
     - `/blog`
     - `/blog/:slug`
     - `/category/:slug`
     - `/tag/:slug`
     - `/about`
     - `/contact`
     - `/travel-resources`
     - `/privacy`
     - `/affiliate-disclosure`
     - `404.html`

## What you need to do

### 1. Add a real `.env`
Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_REAL_ANON_KEY
VITE_SITE_URL=https://www.yourdomain.com
```

Use your real production domain for `VITE_SITE_URL`.

### 2. Install dependencies

```bash
npm install
```

### 3. Run the SSG build

```bash
npm run build:ssg
```

### 4. Preview locally
Use any static file server against `dist/`.

Example:

```bash
npx serve dist
```

## Deploy

### Vercel
`vercel.json` is already set to use:

```json
{
  "buildCommand": "npm run build:ssg",
  "outputDirectory": "dist"
}
```

So for Vercel you mainly need to:

1. set the environment variables in the Vercel project
2. redeploy

### Netlify
Use:

- Build command: `npm run build:ssg`
- Publish directory: `dist`

## Important note

The SSG step depends on Supabase being reachable at build time.

If the manifest fetch fails, the build scripts fall back to an empty manifest so the build does not crash, but your prerendered blog/category/tag pages will be empty until the environment variables are correct and the Supabase project is reachable.

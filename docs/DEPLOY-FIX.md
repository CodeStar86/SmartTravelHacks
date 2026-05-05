# SmartTravelHacks deployment fix

This project deploys as:

- Frontend: Vercel Vite app
- Backend API: one Supabase Edge Function named `server`

Do **not** deploy `create-admin-share-payment`, `confirm-admin-share-payment`, or `stripe-webhook`; those functions are not part of this app.

## 1. Vercel settings

Use these settings in Vercel:

```text
Framework Preset: Vite
Build Command: npm run build:ssg
Output Directory: dist
Install Command: npm install
```

The included `vercel.json` is already set to `npm run build:ssg`, which prerenders public routes and generates the sitemap for SEO.

## 2. Vercel environment variables

Add these in Vercel Project Settings → Environment Variables:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_SITE_URL=https://www.smarttravelhacks.com
```

Optional override. Leave this unset unless you rename the Edge Function:

```env
VITE_API_BASE=https://YOUR_PROJECT_REF.supabase.co/functions/v1/server
```

## 3. Deploy Supabase backend

From the project root:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
supabase functions deploy server --no-verify-jwt
```

Or use the included script:

```bash
./scripts/deploy-supabase.sh YOUR_PROJECT_REF
```

Or use npm scripts after linking:

```bash
npm run deploy:supabase
```

## 4. Supabase secrets

Set these in Supabase:

```bash
supabase secrets set SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
supabase secrets set SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
supabase secrets set ALLOWED_ORIGINS=https://www.smarttravelhacks.com
supabase secrets set ADMIN_EMAILS=YOUR_ADMIN_EMAIL
supabase secrets set NODE_ENV=production
supabase secrets set ENVIRONMENT=production
```

If you use a custom domain, include all domains as comma-separated values:

```bash
supabase secrets set ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://www.smarttravelhacks.com
```

## 5. Test the backend

Open:

```text
https://YOUR_PROJECT_REF.supabase.co/functions/v1/server/health
```

Expected response includes:

```json
{"status":"ok"}
```

Then test:

```text
https://YOUR_PROJECT_REF.supabase.co/functions/v1/server/posts
```

If `/health` works but `/posts` fails, run `supabase db push` and check your service role secret.

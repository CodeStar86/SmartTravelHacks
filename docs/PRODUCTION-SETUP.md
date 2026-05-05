# Production setup checklist

This package includes production-hardening patches, but you still need to provide your own Supabase project, secrets, domain, and deployment settings.

## What changed

- Added `tsconfig.json` and `tsconfig.node.json`.
- Added `typecheck` and `preview` scripts.
- Moved `react` and `react-dom` into regular dependencies.
- Removed the public `/admin/signup` route from the frontend.
- Removed the backend admin signup endpoint entirely; create admins manually in Supabase Auth.
- Added basic IP-window rate limiting for subscribers, contact messages, and comments.
- Added honeypot-field support for public forms/API calls.
- Added stricter email validation and basic public-input length cleaning.
- Disabled request logging automatically when `NODE_ENV=production`.

## Local verification

```bash
npm install
npm run typecheck
npm run build:ssg
npm run preview
```

## Required frontend environment variables

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_SITE_URL=https://www.yourdomain.com
```

## Required Supabase Edge Function secrets

```bash
NODE_ENV=production
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
ALLOWED_ORIGINS=https://www.yourdomain.com,https://yourdomain.com
ADMIN_EMAILS=you@yourdomain.com
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
```

## Supabase database setup

Run this SQL in Supabase before deploying the function:

```sql
Apply the typed Supabase schema in `supabase/migrations/0001_typed_schema.sql`. It creates dedicated tables for posts, categories, tags, affiliates, clicks, media, subscribers, messages, comments, redirects, site settings, and rate limits.
```

The Edge Function uses the service role key server-side. Never expose `SUPABASE_SERVICE_ROLE_KEY` in Vercel or frontend code.

## Admin user setup

Do not expose public admin signup in production.

1. Create your admin user in Supabase Auth.
2. Add the admin email to `ADMIN_EMAILS`.
4. Sign in at `/admin/login`.

Provision the first admin manually in Supabase Auth, then add that email to ADMIN_EMAILS and redeploy the function.

## Deployment steps

1. Deploy the frontend to Vercel or another static host.
2. Set all frontend env vars in the host dashboard.
3. Deploy `supabase/functions/server` to Supabase Edge Functions.
4. Set all Edge Function secrets in Supabase.
5. Set `ALLOWED_ORIGINS` to your exact production domain(s).
6. Smoke-test `/`, `/blog`, `/admin/login`, post creation, comments, contact form, newsletter signup, and affiliate redirects.

## Still recommended before significant traffic

- Add CAPTCHA or Cloudflare Turnstile to public forms.
- Continue promoting frequently queried JSON fields into first-class generated/indexed SQL columns as the CMS evolves.
- Add CI that runs `npm run typecheck` and `npm run build:ssg` on every commit.
- Add Sentry or equivalent error monitoring.
- Configure Supabase backups and retention.
- Add end-to-end tests for login, post creation, comments, contact form, and redirects.

## Typed Supabase schema

This build has migrated away from the generic KV table. Apply the SQL in `supabase/migrations` before deploying the Edge Function:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
supabase functions deploy server
```

For existing projects with `kv_store_3713a632`, `0002_migrate_from_legacy_kv.sql` copies legacy records into the dedicated production tables. Verify the admin UI before dropping the legacy table.

## Local frontend environment

Create `.env.local` before running `npm run dev`:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
# Optional; the app defaults to this automatically
# VITE_API_BASE=https://YOUR_PROJECT_ID.supabase.co/functions/v1/server
```

The frontend defaults to the `server` Edge Function at `${VITE_SUPABASE_URL}/functions/v1/server`.

If you previously ran an older build, clear old browser auth state once:

```js
localStorage.clear()
sessionStorage.clear()
```

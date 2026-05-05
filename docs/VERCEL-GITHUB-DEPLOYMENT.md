# Deploy SmartTravelHacks to Vercel via GitHub

This project is prepared for the GitHub repository:

```text
https://github.com/CodeStar86/SmartTravelHacks
```

## 1. Push the project to GitHub

From the project folder:

```bash
git init
git branch -M main
git remote add origin https://github.com/CodeStar86/SmartTravelHacks.git
git add .
git commit -m "Prepare Vercel deployment"
git push -u origin main
```

If the repository already has commits, use:

```bash
git remote set-url origin https://github.com/CodeStar86/SmartTravelHacks.git
git add .
git commit -m "Prepare Vercel deployment"
git push
```

## 2. Import the GitHub repo in Vercel

1. Open Vercel and choose **Add New → Project**.
2. Import `CodeStar86/SmartTravelHacks`.
3. Use these project settings:

```text
Framework Preset: Vite
Build Command: npm run build:ssg
Output Directory: dist
Install Command: npm install
Root Directory: ./
Node.js Version: 20.x
```

The committed `vercel.json` already sets the framework, build command, and output directory.

## 3. Add Vercel environment variables

In **Vercel → Project → Settings → Environment Variables**, add these for Production, Preview, and Development as needed:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_SITE_URL=https://YOUR_VERCEL_OR_CUSTOM_DOMAIN
# Optional; the app defaults to ${VITE_SUPABASE_URL}/functions/v1/server
VITE_API_BASE=https://YOUR_PROJECT_ID.supabase.co/functions/v1/server
VITE_SENTRY_DSN=
VITE_TURNSTILE_SITE_KEY=
```

Do **not** add `SUPABASE_SERVICE_ROLE_KEY` to Vercel. That key belongs only in Supabase Edge Function secrets.

## 4. Deploy Supabase backend separately

The frontend calls the Supabase Edge Function named `server`. Deploy and configure it from your local machine or CI:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
supabase functions deploy server
```

Set these Edge Function secrets in Supabase:

```bash
NODE_ENV=production
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
ALLOWED_ORIGINS=https://YOUR_VERCEL_OR_CUSTOM_DOMAIN
ADMIN_EMAILS=you@yourdomain.com
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
TURNSTILE_SECRET_KEY=
SENTRY_DSN=
ENVIRONMENT=production
```

## 5. Confirm deployment

After Vercel deploys from GitHub, smoke-test:

```text
/
/blog
/admin/login
/contact
/sitemap.xml
/robots.txt
```

Also test newsletter signup, comments, contact messages, affiliate redirects, and admin login after the Supabase function is live.

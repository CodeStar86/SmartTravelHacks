# API routes

The frontend uses `VITE_API_BASE`, defaulting to:

```text
${VITE_SUPABASE_URL}/functions/v1/server
```

The `server` Edge Function normalizes Supabase paths so both remote and local invocation forms work:

- `/functions/v1/server/settings`
- `/settings` inside the function runtime
- legacy `/make-server-3713a632/*` paths

After changing the function, redeploy it:

```bash
supabase functions deploy server
```

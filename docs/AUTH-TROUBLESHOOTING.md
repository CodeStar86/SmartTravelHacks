# Auth troubleshooting

If admin dashboard requests return `401 Invalid or expired session`, check:

1. The frontend `.env.local` points to the same Supabase project as the deployed function.
2. The user exists in Supabase Auth.
3. If `ADMIN_EMAILS` is set on the Edge Function, the signed-in user's email must be listed.
4. Redeploy the Edge Function after changing secrets:

```bash
supabase functions deploy server
```

Admin-only API routes must send the Supabase user access token, not the anon key. This build routes admin analytics, comment stats, redirects, media, and affiliate admin lists through authenticated API calls.

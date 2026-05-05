# Admin provisioning

Public admin signup is intentionally not shipped.

1. Create the admin user in Supabase Authentication.
2. Add the admin email address to the `ADMIN_EMAILS` Edge Function environment variable.
3. Deploy or redeploy the Edge Function.
4. Log in at `/admin/login`.

Do not add a public signup route or an unauthenticated service-role user creation endpoint in production.

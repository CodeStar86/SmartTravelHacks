# Typed Supabase schema

The app no longer uses the original `kv_store_3713a632` table. Production data is stored in dedicated tables:

- `posts`
- `categories`
- `tags`
- `affiliate_links`
- `affiliate_clicks`
- `media_assets`
- `subscribers`
- `contact_messages`
- `comments`
- `redirects`
- `site_settings`
- `rate_limits`

Each table has a stable primary key, timestamps, RLS enabled, useful generated/indexed columns, and a `data jsonb` payload for CMS-specific fields. This gives you real table boundaries, indexing, backup targeting, and future migration paths without breaking the existing frontend/admin API shapes.

## Apply on a new Supabase project

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
supabase functions deploy server
```

Or run the SQL files in `supabase/migrations` in order in the Supabase SQL editor.

## Migrating an existing project

1. Take a backup first.
2. Apply `0001_typed_schema.sql`.
3. Apply `0002_migrate_from_legacy_kv.sql`.
4. Deploy the updated Edge Function.
5. Verify posts, categories, comments, subscribers, redirects, and affiliate links in the admin UI.
6. Keep the old `kv_store_3713a632` table until you have verified production. Then archive/drop it manually.

## Why `data jsonb` still exists

The old admin/frontend API stores flexible CMS objects. The migration now separates entities into typed tables and indexes important columns. A later version can promote more JSON fields into first-class SQL columns without another frontend rewrite.

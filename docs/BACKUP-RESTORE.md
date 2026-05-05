# Backup and restore

## Export

1. Sign in as an admin.
2. Call `GET /make-server-3713a632/backup/export` with an admin Bearer token.
3. Store the JSON file in encrypted storage outside Supabase.

Recommended schedule: daily exports plus weekly retained snapshots.

## Restore

1. Review the backup file locally.
2. Convert the records you want to restore to `{ "key": "...", "value": {...} }` objects.
3. Call `POST /make-server-3713a632/backup/restore` with `{ "confirm": "RESTORE", "records": [...] }` and an admin Bearer token.
4. Smoke-test public pages, admin login, comments, subscribers, and affiliate redirects.

Production now uses dedicated Supabase tables. Enable Supabase managed PITR/backups where available and keep scheduled logical exports for disaster recovery.

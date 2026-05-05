#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: ./scripts/deploy-supabase.sh YOUR_PROJECT_REF"
  exit 1
fi

PROJECT_REF="$1"

supabase link --project-ref "$PROJECT_REF"
supabase db push
supabase functions deploy server --no-verify-jwt

echo "Done. Test: https://${PROJECT_REF}.supabase.co/functions/v1/server/health"

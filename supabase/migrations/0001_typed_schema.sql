-- SmartTravelHacks production schema.
-- This replaces the Figma/Make-style generic KV store with dedicated Supabase tables.
-- Edge Functions use the Supabase service role for writes. Do not add anon write policies.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.posts (
  id text primary key,
  slug text generated always as (data->>'slug') stored,
  title text generated always as (data->>'title') stored,
  status text generated always as (coalesce(data->>'status', 'draft')) stored,
  category_id text generated always as (data->>'category_id') stored,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists posts_slug_idx on public.posts (slug) where slug is not null;
create index if not exists posts_status_idx on public.posts (status);
create index if not exists posts_category_id_idx on public.posts (category_id);
create index if not exists posts_data_gin_idx on public.posts using gin (data);

do $$ begin create trigger posts_updated_at before update on public.posts for each row execute function public.set_updated_at(); exception when duplicate_object then null; end $$;

create table if not exists public.categories (
  id text primary key,
  slug text generated always as (data->>'slug') stored,
  name text generated always as (data->>'name') stored,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists categories_slug_idx on public.categories (slug) where slug is not null;
do $$ begin create trigger categories_updated_at before update on public.categories for each row execute function public.set_updated_at(); exception when duplicate_object then null; end $$;

create table if not exists public.tags (
  id text primary key,
  slug text generated always as (data->>'slug') stored,
  name text generated always as (data->>'name') stored,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists tags_slug_idx on public.tags (slug) where slug is not null;
do $$ begin create trigger tags_updated_at before update on public.tags for each row execute function public.set_updated_at(); exception when duplicate_object then null; end $$;

create table if not exists public.affiliate_links (
  id text primary key,
  slug text generated always as (data->>'slug') stored,
  destination_url text generated always as (data->>'destination_url') stored,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists affiliate_links_slug_idx on public.affiliate_links (slug) where slug is not null;
do $$ begin create trigger affiliate_links_updated_at before update on public.affiliate_links for each row execute function public.set_updated_at(); exception when duplicate_object then null; end $$;

create table if not exists public.affiliate_clicks (
  id text primary key,
  link_id text generated always as (data->>'link_id') stored,
  slug text generated always as (data->>'slug') stored,
  clicked_at text generated always as (data->>'clicked_at') stored,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists affiliate_clicks_link_id_idx on public.affiliate_clicks (link_id);
create index if not exists affiliate_clicks_slug_idx on public.affiliate_clicks (slug);

create table if not exists public.media_assets (
  id text primary key,
  filename text generated always as (data->>'filename') stored,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
do $$ begin create trigger media_assets_updated_at before update on public.media_assets for each row execute function public.set_updated_at(); exception when duplicate_object then null; end $$;

create table if not exists public.subscribers (
  id text primary key,
  email text generated always as (lower(data->>'email')) stored,
  status text generated always as (coalesce(data->>'status', 'active')) stored,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists subscribers_email_idx on public.subscribers (email) where email is not null;
do $$ begin create trigger subscribers_updated_at before update on public.subscribers for each row execute function public.set_updated_at(); exception when duplicate_object then null; end $$;

create table if not exists public.contact_messages (
  id text primary key,
  email text generated always as (lower(data->>'email')) stored,
  status text generated always as (coalesce(data->>'status', 'new')) stored,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists contact_messages_email_idx on public.contact_messages (email);
create index if not exists contact_messages_status_idx on public.contact_messages (status);
do $$ begin create trigger contact_messages_updated_at before update on public.contact_messages for each row execute function public.set_updated_at(); exception when duplicate_object then null; end $$;

create table if not exists public.comments (
  id text primary key,
  post_id text generated always as (data->>'post_id') stored,
  status text generated always as (coalesce(data->>'status', 'pending')) stored,
  email text generated always as (lower(data->>'email')) stored,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists comments_post_id_idx on public.comments (post_id);
create index if not exists comments_status_idx on public.comments (status);
do $$ begin create trigger comments_updated_at before update on public.comments for each row execute function public.set_updated_at(); exception when duplicate_object then null; end $$;

create table if not exists public.redirects (
  id text primary key,
  source_path text generated always as (data->>'source_path') stored,
  destination_path text generated always as (data->>'destination_path') stored,
  status_code text generated always as (coalesce(data->>'status_code', '301')) stored,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists redirects_source_path_idx on public.redirects (source_path) where source_path is not null;
do $$ begin create trigger redirects_updated_at before update on public.redirects for each row execute function public.set_updated_at(); exception when duplicate_object then null; end $$;

create table if not exists public.site_settings (
  key text primary key default 'site',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
do $$ begin create trigger site_settings_updated_at before update on public.site_settings for each row execute function public.set_updated_at(); exception when duplicate_object then null; end $$;

create table if not exists public.rate_limits (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
do $$ begin create trigger rate_limits_updated_at before update on public.rate_limits for each row execute function public.set_updated_at(); exception when duplicate_object then null; end $$;

alter table public.posts enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.affiliate_links enable row level security;
alter table public.affiliate_clicks enable row level security;
alter table public.media_assets enable row level security;
alter table public.subscribers enable row level security;
alter table public.contact_messages enable row level security;
alter table public.comments enable row level security;
alter table public.redirects enable row level security;
alter table public.site_settings enable row level security;
alter table public.rate_limits enable row level security;

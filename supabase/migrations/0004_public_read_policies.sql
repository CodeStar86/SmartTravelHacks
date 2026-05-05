-- Allow the static site generator and public site to read published content with the anon key.
-- Writes still go through the Edge Function/service role; these policies are read-only.

alter table public.posts enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;

drop policy if exists "Public can read published posts" on public.posts;
create policy "Public can read published posts"
on public.posts
for select
to anon, authenticated
using (status = 'published');

drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories"
on public.categories
for select
to anon, authenticated
using (true);

drop policy if exists "Public can read tags" on public.tags;
create policy "Public can read tags"
on public.tags
for select
to anon, authenticated
using (true);

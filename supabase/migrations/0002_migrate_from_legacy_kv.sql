-- Optional one-time migration from the original generic kv_store_3713a632 table.
-- Safe to run even when the legacy table never existed.

do $$
begin
  if to_regclass('public.kv_store_3713a632') is not null then
    insert into public.posts (id, data)
      select substring(key from 6), value from public.kv_store_3713a632 where key like 'post:%'
      on conflict (id) do update set data = excluded.data;
    insert into public.categories (id, data)
      select substring(key from 10), value from public.kv_store_3713a632 where key like 'category:%'
      on conflict (id) do update set data = excluded.data;
    insert into public.tags (id, data)
      select substring(key from 5), value from public.kv_store_3713a632 where key like 'tag:%'
      on conflict (id) do update set data = excluded.data;
    insert into public.affiliate_links (id, data)
      select substring(key from 11), value from public.kv_store_3713a632 where key like 'affiliate:%'
      on conflict (id) do update set data = excluded.data;
    insert into public.affiliate_clicks (id, data)
      select substring(key from 7), value from public.kv_store_3713a632 where key like 'click:%'
      on conflict (id) do update set data = excluded.data;
    insert into public.media_assets (id, data)
      select substring(key from 7), value from public.kv_store_3713a632 where key like 'media:%'
      on conflict (id) do update set data = excluded.data;
    insert into public.subscribers (id, data)
      select substring(key from 12), value from public.kv_store_3713a632 where key like 'subscriber:%'
      on conflict (id) do update set data = excluded.data;
    insert into public.contact_messages (id, data)
      select substring(key from 9), value from public.kv_store_3713a632 where key like 'message:%'
      on conflict (id) do update set data = excluded.data;
    insert into public.comments (id, data)
      select substring(key from 9), value from public.kv_store_3713a632 where key like 'comment:%'
      on conflict (id) do update set data = excluded.data;
    insert into public.redirects (id, data)
      select substring(key from 10), value from public.kv_store_3713a632 where key like 'redirect:%'
      on conflict (id) do update set data = excluded.data;
    insert into public.site_settings (key, data)
      select 'site', value from public.kv_store_3713a632 where key = 'settings:site'
      on conflict (key) do update set data = excluded.data;
  end if;
end $$;

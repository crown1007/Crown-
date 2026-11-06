-- Run this entire file in Supabase Dashboard > SQL Editor.
-- IMPORTANT: This schema intentionally keeps customer names and admin records private.
create extension if not exists pgcrypto;

create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  tracking_code text not null unique,
  customer_name text not null,
  origin text not null,
  destination text not null,
  status text not null default 'Shipment created',
  created_at timestamptz not null default now()
);

create table if not exists public.tracking_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  status text not null,
  details text not null,
  created_at timestamptz not null default now()
);

alter table public.shipments enable row level security;
alter table public.tracking_events enable row level security;

-- Only an authenticated user explicitly assigned app_metadata.role=admin can manage data.
create policy "Admins can manage shipments" on public.shipments
  for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admins can manage tracking events" on public.tracking_events
  for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Public lookup exposes only tracking code, route, current status, and event history.
-- It never returns customer_name or internal shipment IDs.
create or replace function public.public_track_shipment(tracking_code_input text)
returns table (
  tracking_code text,
  origin text,
  destination text,
  status text,
  events json
)
language sql
security definer
set search_path = public
as $$
  select s.tracking_code, s.origin, s.destination, s.status,
    coalesce((
      select json_agg(json_build_object(
        'status', e.status,
        'details', e.details,
        'created_at', e.created_at
      ) order by e.created_at desc)
      from public.tracking_events e
      where e.shipment_id = s.id
    ), '[]'::json)
  from public.shipments s
  where upper(s.tracking_code) = upper(trim(tracking_code_input))
  limit 1;
$$;

revoke all on function public.public_track_shipment(text) from public;
grant execute on function public.public_track_shipment(text) to anon, authenticated;
grant usage on schema public to anon, authenticated;

-- Keep table access restricted; the admin policies above govern authenticated access.
revoke all on public.shipments from anon;
revoke all on public.tracking_events from anon;
grant select, insert, update, delete on public.shipments to authenticated;
grant select, insert, update, delete on public.tracking_events to authenticated;

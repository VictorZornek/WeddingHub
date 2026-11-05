-- Vendors and their quotes.
-- Run once in Supabase: SQL Editor > New query > paste > Run.

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  name text not null,
  contact_name text,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  description text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  includes text,
  valid_until date,
  status text not null default 'open' check (status in ('open', 'chosen', 'rejected')),
  notes text,
  created_at timestamptz not null default now()
);

create index on public.vendors (wedding_id);
create index on public.vendors (category_id);
create index on public.quotes (wedding_id);
create index on public.quotes (vendor_id);
create index on public.quotes (category_id);

alter table public.vendors enable row level security;
alter table public.quotes enable row level security;

create policy "members manage vendors" on public.vendors
  for all to authenticated
  using (public.is_wedding_member(wedding_id))
  with check (public.is_wedding_member(wedding_id));

create policy "members manage quotes" on public.quotes
  for all to authenticated
  using (public.is_wedding_member(wedding_id))
  with check (public.is_wedding_member(wedding_id));

revoke all on public.vendors, public.quotes from anon;
grant select, insert, update, delete on public.vendors, public.quotes to authenticated;

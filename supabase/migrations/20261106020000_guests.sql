-- Guest list with RSVP.
-- Run once in Supabase: SQL Editor > New query > paste > Run.

create table public.guests (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  name text not null,
  group_name text,
  companions int not null default 0 check (companions between 0 and 20),
  rsvp text not null default 'pending' check (rsvp in ('pending', 'confirmed', 'declined')),
  phone text,
  notes text,
  created_at timestamptz not null default now()
);

create index on public.guests (wedding_id);

alter table public.guests enable row level security;

create policy "members manage guests" on public.guests
  for all to authenticated
  using (public.is_wedding_member(wedding_id))
  with check (public.is_wedding_member(wedding_id));

revoke all on public.guests from anon;
grant select, insert, update, delete on public.guests to authenticated;

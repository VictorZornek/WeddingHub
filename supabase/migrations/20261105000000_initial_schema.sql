-- Initial schema for Wedding Hub.
-- Run once in Supabase: SQL Editor > New query > paste > Run.

-- ============================================================
-- Tables
-- ============================================================

-- A wedding shared by its members (the couple).
create table public.weddings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  wedding_date date,
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Who can access each wedding.
create table public.wedding_members (
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'partner' check (role in ('owner', 'partner')),
  created_at timestamptz not null default now(),
  primary key (wedding_id, user_id)
);

-- Separate budgets inside a wedding: the wedding itself, apartment, trip...
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  name text not null,
  spending_cap numeric(12, 2) check (spending_cap >= 0),
  position int not null default 0,
  created_at timestamptz not null default now()
);

-- Budget categories (Reception, Attire, Flowers...).
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  spending_cap numeric(12, 2) check (spending_cap >= 0),
  position int not null default 0,
  created_at timestamptz not null default now()
);

-- Line items inside a category.
create table public.budget_items (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  name text not null,
  estimated_amount numeric(12, 2) check (estimated_amount >= 0),
  actual_amount numeric(12, 2) check (actual_amount >= 0),
  status text not null default 'to_define' check (status in ('to_define', 'included', 'closed')),
  notes text,
  position int not null default 0,
  created_at timestamptz not null default now()
);

-- A payment agreement for a budget item (e.g. the venue contract).
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  budget_item_id uuid references public.budget_items (id) on delete set null,
  description text not null,
  total_amount numeric(12, 2) not null check (total_amount >= 0),
  created_at timestamptz not null default now()
);

-- Each installment of a payment.
create table public.installments (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  payment_id uuid not null references public.payments (id) on delete cascade,
  number int not null check (number > 0),
  amount numeric(12, 2) not null check (amount >= 0),
  due_date date not null,
  paid_at date,
  created_at timestamptz not null default now(),
  unique (payment_id, number)
);

-- Reminders with a notification time.
create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  title text not null,
  notes text,
  remind_at timestamptz not null,
  done boolean not null default false,
  installment_id uuid references public.installments (id) on delete cascade,
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Indexes for the foreign keys used in filters and joins.
create index on public.wedding_members (user_id);
create index on public.projects (wedding_id);
create index on public.categories (wedding_id);
create index on public.categories (project_id);
create index on public.budget_items (wedding_id);
create index on public.budget_items (category_id);
create index on public.payments (wedding_id);
create index on public.payments (budget_item_id);
create index on public.installments (wedding_id);
create index on public.installments (payment_id);
create index on public.installments (due_date);
create index on public.reminders (wedding_id);
create index on public.reminders (installment_id);
create index on public.reminders (remind_at);

-- ============================================================
-- Membership helpers
-- ============================================================

-- True when the signed-in user belongs to the wedding.
-- security definer so policies can read wedding_members without recursion.
create function public.is_wedding_member(p_wedding_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.wedding_members
    where wedding_id = p_wedding_id
      and user_id = (select auth.uid())
  );
$$;

-- The creator of a wedding becomes its owner automatically.
create function public.add_wedding_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.wedding_members (wedding_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  return new;
end;
$$;

create trigger on_wedding_created
after insert on public.weddings
for each row execute function public.add_wedding_owner();

-- ============================================================
-- Row Level Security: only wedding members see and change data
-- ============================================================

alter table public.weddings enable row level security;
alter table public.wedding_members enable row level security;
alter table public.projects enable row level security;
alter table public.categories enable row level security;
alter table public.budget_items enable row level security;
alter table public.payments enable row level security;
alter table public.installments enable row level security;
alter table public.reminders enable row level security;

-- weddings
create policy "members read wedding" on public.weddings
  for select to authenticated
  using (public.is_wedding_member(id) or created_by = (select auth.uid()));

create policy "users create wedding" on public.weddings
  for insert to authenticated
  with check (created_by = (select auth.uid()));

create policy "members update wedding" on public.weddings
  for update to authenticated
  using (public.is_wedding_member(id))
  with check (public.is_wedding_member(id));

create policy "owner deletes wedding" on public.weddings
  for delete to authenticated
  using (created_by = (select auth.uid()));

-- wedding_members: read only. Rows are added by the trigger above
-- and, later, by the partner invite flow.
create policy "members read members" on public.wedding_members
  for select to authenticated
  using (public.is_wedding_member(wedding_id));

-- Every other table: full access for members of the row's wedding.
create policy "members manage projects" on public.projects
  for all to authenticated
  using (public.is_wedding_member(wedding_id))
  with check (public.is_wedding_member(wedding_id));

create policy "members manage categories" on public.categories
  for all to authenticated
  using (public.is_wedding_member(wedding_id))
  with check (public.is_wedding_member(wedding_id));

create policy "members manage budget items" on public.budget_items
  for all to authenticated
  using (public.is_wedding_member(wedding_id))
  with check (public.is_wedding_member(wedding_id));

create policy "members manage payments" on public.payments
  for all to authenticated
  using (public.is_wedding_member(wedding_id))
  with check (public.is_wedding_member(wedding_id));

create policy "members manage installments" on public.installments
  for all to authenticated
  using (public.is_wedding_member(wedding_id))
  with check (public.is_wedding_member(wedding_id));

create policy "members manage reminders" on public.reminders
  for all to authenticated
  using (public.is_wedding_member(wedding_id))
  with check (public.is_wedding_member(wedding_id));

-- ============================================================
-- Grants for the app (anonymous visitors get nothing)
-- ============================================================

revoke all on all tables in schema public from anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke execute on function public.is_wedding_member(uuid) from public, anon;
grant execute on function public.is_wedding_member(uuid) to authenticated;
revoke execute on function public.add_wedding_owner() from public, anon, authenticated;

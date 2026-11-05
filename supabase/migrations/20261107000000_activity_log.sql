-- Activity history: who created, changed or deleted budget items, payments,
-- installments, reminders and spending caps.
-- Rows are written by database triggers, so the app never waits for an extra request.
-- Run once in Supabase: SQL Editor > New query > paste > Run.

create table public.activity_log (
  id bigint generated always as identity primary key,
  -- No foreign key: rows written while a wedding is being deleted would block the delete.
  wedding_id uuid not null,
  table_name text not null,
  record_id uuid not null,
  action text not null check (action in ('insert', 'update', 'delete')),
  -- Name of the record at the time (item name, payment description...).
  label text,
  -- For updates: { "field": { "old": ..., "new": ... } } with only the fields that changed.
  changes jsonb,
  actor_id uuid,
  actor_email text,
  created_at timestamptz not null default now()
);

create index on public.activity_log (wedding_id, created_at desc);

alter table public.activity_log enable row level security;

-- Members only read. Writes come from the trigger below (security definer).
create policy "members read activity" on public.activity_log
  for select to authenticated
  using (public.is_wedding_member(wedding_id));

revoke all on public.activity_log from anon, authenticated;
grant select on public.activity_log to authenticated;

-- Replaces the missing foreign key: a deleted wedding takes its history along.
create function public.delete_wedding_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.activity_log where wedding_id = old.id;
  return null;
end;
$$;

revoke execute on function public.delete_wedding_activity() from public, anon, authenticated;

create trigger delete_wedding_activity after delete on public.weddings
  for each row execute function public.delete_wedding_activity();

-- Columns that change without meaning anything to the couple.
create function public.activity_ignored_columns()
returns text[]
language sql
immutable
set search_path = ''
as $$
  select array['id', 'wedding_id', 'created_at', 'created_by', 'position'];
$$;

create function public.log_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) end;
  v_new jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) end;
  v_row jsonb := coalesce(v_new, v_old);
  v_wedding_id uuid := (v_row ->> 'wedding_id')::uuid;
  v_changes jsonb;
  v_label text;
begin
  -- The whole wedding is being deleted: nobody will read this history.
  if not exists (select 1 from public.weddings where id = v_wedding_id) then
    return null;
  end if;

  if tg_op = 'UPDATE' then
    select jsonb_object_agg(key, jsonb_build_object('old', v_old -> key, 'new', value))
    into v_changes
    from jsonb_each(v_new)
    where (v_old -> key) is distinct from value
      and key <> all (public.activity_ignored_columns())
      -- Projects and categories are only tracked for their spending cap.
      and (tg_table_name not in ('projects', 'categories') or key = 'spending_cap');

    if v_changes is null then
      return null;
    end if;
  end if;

  v_label := case tg_table_name
    when 'budget_items' then v_row ->> 'name'
    when 'payments' then v_row ->> 'description'
    when 'reminders' then v_row ->> 'title'
    when 'projects' then v_row ->> 'name'
    when 'categories' then v_row ->> 'name'
    when 'installments' then concat_ws(
      ' · ',
      (select description from public.payments where id = (v_row ->> 'payment_id')::uuid),
      'parcela ' || (v_row ->> 'number')
    )
  end;

  insert into public.activity_log
    (wedding_id, table_name, record_id, action, label, changes, actor_id, actor_email)
  values (
    v_wedding_id,
    tg_table_name,
    (v_row ->> 'id')::uuid,
    lower(tg_op),
    v_label,
    v_changes,
    (select auth.uid()),
    (select auth.jwt() ->> 'email')
  );

  return null;
end;
$$;

revoke execute on function public.log_activity() from public, anon, authenticated;
revoke execute on function public.activity_ignored_columns() from public, anon;

create trigger log_activity after insert or update or delete on public.budget_items
  for each row execute function public.log_activity();

create trigger log_activity after insert or update or delete on public.payments
  for each row execute function public.log_activity();

create trigger log_activity after insert or update or delete on public.reminders
  for each row execute function public.log_activity();

-- Installments are created and deleted together with their payment, which is
-- already logged; only changes (like marking one as paid) are recorded.
create trigger log_activity after update on public.installments
  for each row execute function public.log_activity();

-- Spending caps live on projects and categories.
create trigger log_activity after update of spending_cap on public.projects
  for each row execute function public.log_activity();

create trigger log_activity after update of spending_cap on public.categories
  for each row execute function public.log_activity();

-- Invite codes so the partner can join the same wedding.
-- Run once in Supabase: SQL Editor > New query > paste > Run.

-- Random 6-char code without look-alike characters (no 0/O, 1/I).
create function public.generate_invite_code()
returns text
language sql
volatile
set search_path = ''
as $$
  select string_agg(
    substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', (floor(random() * 32) + 1)::int, 1),
    ''
  )
  from generate_series(1, 6);
$$;

alter table public.weddings
  add column invite_code text not null unique default public.generate_invite_code();

-- Adds the signed-in user to the wedding that owns the code.
-- security definer because users cannot read weddings they are not part of yet.
create function public.join_wedding(p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_wedding_id uuid;
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  select id into v_wedding_id
  from public.weddings
  where invite_code = upper(trim(p_code));

  if v_wedding_id is null then
    raise exception 'invalid invite code' using errcode = 'P0002';
  end if;

  insert into public.wedding_members (wedding_id, user_id, role)
  values (v_wedding_id, v_user_id, 'partner')
  on conflict do nothing;

  return v_wedding_id;
end;
$$;

revoke execute on function public.generate_invite_code() from public, anon;
grant execute on function public.generate_invite_code() to authenticated;
revoke execute on function public.join_wedding(text) from public, anon;
grant execute on function public.join_wedding(text) to authenticated;

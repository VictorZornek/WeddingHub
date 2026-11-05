-- Picking a quote fills a budget item with the vendor and the value.
-- Run once in Supabase: SQL Editor > New query > paste > Run.

alter table public.budget_items
  add column vendor_id uuid references public.vendors (id) on delete set null;

alter table public.quotes
  add column budget_item_id uuid references public.budget_items (id) on delete set null;

create index on public.budget_items (vendor_id);
create index on public.quotes (budget_item_id);

-- Marks the quote as chosen, the other open quotes of the same category as rejected,
-- and writes vendor + value into the budget item (a new one when p_budget_item_id is null).
-- security invoker: row level security still decides what the user may change.
create function public.choose_quote(p_quote_id uuid, p_budget_item_id uuid default null)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_quote public.quotes%rowtype;
  v_vendor_name text;
  v_item_id uuid := p_budget_item_id;
begin
  select * into v_quote from public.quotes where id = p_quote_id;
  if not found then
    raise exception 'quote not found' using errcode = 'P0002';
  end if;
  if v_quote.category_id is null then
    raise exception 'quote has no category' using errcode = '22023';
  end if;

  select name into v_vendor_name from public.vendors where id = v_quote.vendor_id;

  if v_item_id is null then
    insert into public.budget_items
      (wedding_id, category_id, name, estimated_amount, actual_amount, status, vendor_id, position)
    values (
      v_quote.wedding_id,
      v_quote.category_id,
      v_quote.description,
      v_quote.amount,
      v_quote.amount,
      'closed',
      v_quote.vendor_id,
      coalesce((select max(position) + 1 from public.budget_items where category_id = v_quote.category_id), 0)
    )
    returning id into v_item_id;
  else
    update public.budget_items
    set actual_amount = v_quote.amount,
        status = 'closed',
        vendor_id = v_quote.vendor_id,
        notes = coalesce(notes || E'\n', '') || 'Fornecedor: ' || v_vendor_name
    where id = v_item_id and category_id = v_quote.category_id;
    if not found then
      raise exception 'budget item not in this category' using errcode = '22023';
    end if;
  end if;

  update public.quotes
  set status = 'rejected'
  where category_id = v_quote.category_id and id <> v_quote.id and status = 'open';

  update public.quotes
  set status = 'chosen', budget_item_id = v_item_id
  where id = v_quote.id;

  return v_item_id;
end;
$$;

revoke execute on function public.choose_quote(uuid, uuid) from public, anon;
grant execute on function public.choose_quote(uuid, uuid) to authenticated;

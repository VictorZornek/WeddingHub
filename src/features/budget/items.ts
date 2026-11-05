import { supabase } from '@/lib/supabase';
import type { BudgetItem, BudgetItemStatus, Category } from '@/types/database';

export const STATUS_LABELS: Record<BudgetItemStatus, string> = {
  to_define: 'A definir',
  included: 'Incluso',
  closed: 'Fechado',
};

export const STATUS_ORDER: BudgetItemStatus[] = ['to_define', 'closed', 'included'];

// Numeric columns can arrive as strings; normalize to numbers.
export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeItem(item: BudgetItem): BudgetItem {
  return {
    ...item,
    estimated_amount: toNumber(item.estimated_amount),
    actual_amount: toNumber(item.actual_amount),
  };
}

export type CategoryDetail = Category & { budget_items: BudgetItem[] };

export async function fetchCategory(categoryId: string): Promise<CategoryDetail | null> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, project_id, name, spending_cap, position, budget_items(*)')
    .eq('id', categoryId)
    .order('position', { referencedTable: 'budget_items' })
    .maybeSingle<CategoryDetail>();

  if (error || !data) return null;
  return {
    ...data,
    spending_cap: toNumber(data.spending_cap),
    budget_items: data.budget_items.map(normalizeItem),
  };
}

export async function fetchItem(itemId: string): Promise<BudgetItem | null> {
  const { data, error } = await supabase
    .from('budget_items')
    .select('*')
    .eq('id', itemId)
    .maybeSingle<BudgetItem>();
  return error || !data ? null : normalizeItem(data);
}

export type ItemInput = {
  name: string;
  estimated_amount: number | null;
  actual_amount: number | null;
  status: BudgetItemStatus;
  notes: string | null;
};

export async function createItem(weddingId: string, categoryId: string, input: ItemInput) {
  // New items go to the end of the category.
  const { data: last } = await supabase
    .from('budget_items')
    .select('position')
    .eq('category_id', categoryId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle<{ position: number }>();

  return supabase.from('budget_items').insert({
    ...input,
    wedding_id: weddingId,
    category_id: categoryId,
    position: (last?.position ?? -1) + 1,
  });
}

export function updateItem(itemId: string, input: ItemInput) {
  return supabase.from('budget_items').update(input).eq('id', itemId);
}

export function deleteItem(itemId: string) {
  return supabase.from('budget_items').delete().eq('id', itemId);
}

import { toNumber } from '@/features/budget/items';
import { supabase } from '@/lib/supabase';

import type { Quote } from './vendors';

export type ComparableQuote = Quote & { vendors: { name: string } | null };

export type CategoryComparison = {
  id: string;
  name: string;
  budget_items: { id: string; name: string; position: number }[];
  quotes: ComparableQuote[];
};

// A category with all its quotes (cheapest first) and its budget items to fill.
export async function fetchComparison(categoryId: string): Promise<CategoryComparison | null> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, budget_items(id, name, position), quotes(*, vendors(name))')
    .eq('id', categoryId)
    .maybeSingle<CategoryComparison>();
  if (error || !data) return null;
  return {
    ...data,
    budget_items: [...data.budget_items].sort((a, b) => a.position - b.position),
    quotes: data.quotes
      .map((q) => ({ ...q, amount: toNumber(q.amount) ?? 0 }))
      .sort((a, b) => a.amount - b.amount),
  };
}

// Chooses the quote; budgetItemId null creates a new budget item from it.
export function chooseQuote(quoteId: string, budgetItemId: string | null) {
  return supabase.rpc('choose_quote', { p_quote_id: quoteId, p_budget_item_id: budgetItemId });
}

// Cheapest quote that is still in play (not discarded).
export function cheapestId(quotes: Quote[]) {
  return quotes.filter((q) => q.status !== 'rejected').sort((a, b) => a.amount - b.amount)[0]?.id ?? null;
}

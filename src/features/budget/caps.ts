import { toNumber } from '@/features/budget/items';
import { supabase } from '@/lib/supabase';

export type CapsData = {
  id: string;
  name: string;
  spending_cap: number | null;
  categories: { id: string; name: string; spending_cap: number | null }[];
};

export async function fetchCaps(projectId: string): Promise<CapsData | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, spending_cap, categories(id, name, spending_cap, position)')
    .eq('id', projectId)
    .order('position', { referencedTable: 'categories' })
    .maybeSingle<CapsData>();

  if (error || !data) return null;
  return {
    ...data,
    spending_cap: toNumber(data.spending_cap),
    categories: data.categories.map((c) => ({ ...c, spending_cap: toNumber(c.spending_cap) })),
  };
}

// Saves the project cap and every category cap. Returns true when all succeed.
export async function saveCaps(
  projectId: string,
  projectCap: number | null,
  categoryCaps: { id: string; spending_cap: number | null }[]
) {
  const results = await Promise.all([
    supabase.from('projects').update({ spending_cap: projectCap }).eq('id', projectId),
    ...categoryCaps.map((c) =>
      supabase.from('categories').update({ spending_cap: c.spending_cap }).eq('id', c.id)
    ),
  ]);
  return results.every((r) => !r.error);
}

import { sumItems } from '@/features/budget/totals';
import type { CategoryWithItems } from '@/features/budget/use-budget';

export type CategoryShare = { id: string; name: string; value: number; share: number };

// Share of each category in the projected total, biggest first.
// Categories after `maxSlices - 1` are grouped as "Outras".
export function categoryShares(categories: CategoryWithItems[], maxSlices = 5): CategoryShare[] {
  const values = categories
    .map((c) => ({ id: c.id, name: c.name, value: sumItems(c.budget_items).projected }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);
  const total = values.reduce((sum, c) => sum + c.value, 0);
  if (total === 0) return [];

  const top = values.length > maxSlices ? values.slice(0, maxSlices - 1) : values;
  const rest = values.slice(top.length);
  const slices = rest.length
    ? [...top, { id: 'others', name: 'Outras', value: rest.reduce((sum, c) => sum + c.value, 0) }]
    : top;
  return slices.map((s) => ({ ...s, share: s.value / total }));
}

export type EstimateGap = { id: string; name: string; estimated: number; actual: number; gap: number };

// For items that already have an actual value: how far the actual is from what was estimated.
// Positive gap = spent more than estimated. Biggest differences first.
export function estimateGaps(categories: CategoryWithItems[]): EstimateGap[] {
  return categories
    .map((c) => {
      const known = c.budget_items.filter((i) => i.actual_amount !== null);
      const estimated = known.reduce((sum, i) => sum + (i.estimated_amount ?? 0), 0);
      const actual = known.reduce((sum, i) => sum + (i.actual_amount ?? 0), 0);
      return { id: c.id, name: c.name, estimated, actual, gap: actual - estimated, count: known.length };
    })
    .filter((g) => g.count > 0)
    .map(({ count: _count, ...gap }) => gap)
    .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));
}

export type OpenItems = {
  /** Items still marked "a definir". */
  toDefine: number;
  /** Of those, how many have no value at all yet. */
  withoutValue: number;
  total: number;
  /** Categories with the most open items. */
  byCategory: { id: string; name: string; count: number }[];
};

export function openItems(categories: CategoryWithItems[]): OpenItems {
  const items = categories.flatMap((c) => c.budget_items);
  const open = items.filter((i) => i.status === 'to_define');
  return {
    toDefine: open.length,
    withoutValue: open.filter((i) => i.estimated_amount === null && i.actual_amount === null).length,
    total: items.length,
    byCategory: categories
      .map((c) => ({
        id: c.id,
        name: c.name,
        count: c.budget_items.filter((i) => i.status === 'to_define').length,
      }))
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3),
  };
}

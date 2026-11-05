import type { BudgetItem } from '@/types/database';

export type Totals = {
  /** Sum of estimated values. */
  estimated: number;
  /** Sum of actual (contracted) values. */
  actual: number;
  /** What the money will really be: actual when known, otherwise estimated. */
  projected: number;
};

export function sumItems(items: BudgetItem[]): Totals {
  return items.reduce<Totals>(
    (totals, item) => ({
      estimated: totals.estimated + (item.estimated_amount ?? 0),
      actual: totals.actual + (item.actual_amount ?? 0),
      projected: totals.projected + (item.actual_amount ?? item.estimated_amount ?? 0),
    }),
    { estimated: 0, actual: 0, projected: 0 }
  );
}

export function addTotals(list: Totals[]): Totals {
  return list.reduce<Totals>(
    (sum, totals) => ({
      estimated: sum.estimated + totals.estimated,
      actual: sum.actual + totals.actual,
      projected: sum.projected + totals.projected,
    }),
    { estimated: 0, actual: 0, projected: 0 }
  );
}

/** Share of the cap already used (0..∞), or null when there is no cap. */
export function capUsage(projected: number, cap: number | null): number | null {
  if (cap === null || cap <= 0) return null;
  return projected / cap;
}

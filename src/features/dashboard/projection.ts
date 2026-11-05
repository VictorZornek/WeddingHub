import type { PaymentWithDetails } from '@/features/payments/schedule';

export type ProjectionPoint = {
  /** "AAAA-MM" */
  month: string;
  /** Installments due in this month. */
  due: number;
  /** Everything due up to the end of this month. */
  scheduledTotal: number;
  /** Everything due up to this month that is already paid. */
  paidTotal: number;
};

function nextMonth(month: string) {
  const [year, m] = month.split('-').map(Number);
  return m === 12 ? `${year + 1}-01` : `${year}-${String(m + 1).padStart(2, '0')}`;
}

// Payments linked to the given item ids. Payments without an item count for the main project.
export function paymentsForProject(
  payments: PaymentWithDetails[],
  itemIds: Set<string>,
  isMainProject: boolean
) {
  return payments.filter((p) => (p.budget_item_id ? itemIds.has(p.budget_item_id) : isMainProject));
}

// Month-by-month running total of installments, from the first one (or this month)
// to the last one (or the wedding month), with no gaps.
export function projectionSeries(
  payments: PaymentWithDetails[],
  currentMonth: string,
  weddingMonth: string | null
): ProjectionPoint[] {
  const installments = payments.flatMap((p) => p.installments);
  if (installments.length === 0) return [];

  const months = installments.map((i) => i.due_date.slice(0, 7));
  const first = [currentMonth, ...months].sort()[0];
  const last = [weddingMonth ?? currentMonth, ...months].sort().at(-1)!;

  const points: ProjectionPoint[] = [];
  let scheduledTotal = 0;
  let paidTotal = 0;
  for (let month = first; month <= last; month = nextMonth(month)) {
    const inMonth = installments.filter((i) => i.due_date.startsWith(month));
    const due = inMonth.reduce((sum, i) => sum + i.amount, 0);
    scheduledTotal += due;
    paidTotal += inMonth.filter((i) => i.paid_at).reduce((sum, i) => sum + i.amount, 0);
    points.push({ month, due, scheduledTotal, paidTotal });
  }
  return points;
}

// The month with the most money due, or null when nothing is scheduled.
export function busiestMonth(points: ProjectionPoint[]) {
  return points.reduce<ProjectionPoint | null>(
    (best, point) => (point.due > (best?.due ?? 0) ? point : best),
    null
  );
}

export type CategorySeries = {
  id: string;
  name: string;
  /** Running total of installments, one value per month of `months`. */
  values: number[];
};

export type CategoryProjection = { months: string[]; series: CategorySeries[] };

type CategoryRef = { id: string; name: string; budget_items: { id: string }[] };

// One running-total line per category (by the budget item each payment is linked to).
// Lines after `maxLines - 1` are merged into "Outras"; unlinked payments go to "Sem item".
export function projectionByCategory(
  payments: PaymentWithDetails[],
  categories: CategoryRef[],
  currentMonth: string,
  weddingMonth: string | null,
  maxLines = 5
): CategoryProjection {
  const months = projectionSeries(payments, currentMonth, weddingMonth).map((p) => p.month);
  if (months.length === 0) return { months, series: [] };

  const categoryOfItem = new Map(
    categories.flatMap((c) => c.budget_items.map((i) => [i.id, c] as const))
  );
  const groups = new Map<string, { id: string; name: string; payments: PaymentWithDetails[] }>();
  for (const payment of payments) {
    const category = payment.budget_item_id ? categoryOfItem.get(payment.budget_item_id) : undefined;
    const key = category?.id ?? 'unlinked';
    const group = groups.get(key) ?? { id: key, name: category?.name ?? 'Sem item', payments: [] };
    group.payments.push(payment);
    groups.set(key, group);
  }

  const toValues = (list: PaymentWithDetails[]) => {
    const installments = list.flatMap((p) => p.installments);
    return months.map((month) =>
      installments.filter((i) => i.due_date.slice(0, 7) <= month).reduce((sum, i) => sum + i.amount, 0)
    );
  };

  const all = [...groups.values()]
    .map((g) => ({ id: g.id, name: g.name, payments: g.payments, values: toValues(g.payments) }))
    .sort((a, b) => (b.values.at(-1) ?? 0) - (a.values.at(-1) ?? 0));

  const top = all.length > maxLines ? all.slice(0, maxLines - 1) : all;
  const rest = all.slice(top.length);
  const series = top.map(({ id, name, values }) => ({ id, name, values }));
  if (rest.length) {
    series.push({ id: 'others', name: 'Outras', values: toValues(rest.flatMap((g) => g.payments)) });
  }
  return { months, series };
}

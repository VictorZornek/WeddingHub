import { STATUS_LABELS, toNumber } from '@/features/budget/items';
import { formatDateTime } from '@/lib/date';
import { formatCurrency, formatDate } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import type { BudgetItemStatus } from '@/types/database';

// Written by the log_activity trigger (supabase/migrations/20261107000000_activity_log.sql).

export type ActivityTable =
  | 'budget_items'
  | 'payments'
  | 'installments'
  | 'reminders'
  | 'projects'
  | 'categories';

export type ActivityAction = 'insert' | 'update' | 'delete';

type Change = { old: unknown; new: unknown };

export type Activity = {
  id: number;
  table_name: ActivityTable;
  record_id: string;
  action: ActivityAction;
  label: string | null;
  changes: Record<string, Change> | null;
  actor_id: string | null;
  actor_email: string | null;
  created_at: string;
};

export const ACTIVITY_PAGE_SIZE = 50;

// Newest first. Pass the last id already shown to load the next page.
export async function fetchActivity(weddingId: string, beforeId?: number) {
  let query = supabase
    .from('activity_log')
    .select('*')
    .eq('wedding_id', weddingId)
    .order('id', { ascending: false })
    .limit(ACTIVITY_PAGE_SIZE);
  if (beforeId !== undefined) query = query.lt('id', beforeId);
  const { data, error } = await query;
  return error ? null : (data as Activity[]);
}

const TABLE_NAMES: Record<ActivityTable, string> = {
  budget_items: 'item',
  payments: 'pagamento',
  installments: 'parcela',
  reminders: 'lembrete',
  projects: 'orçamento',
  categories: 'categoria',
};

const FIELD_NAMES: Record<string, string> = {
  name: 'nome',
  estimated_amount: 'valor estimado',
  actual_amount: 'valor real',
  status: 'situação',
  notes: 'observações',
  category_id: 'categoria',
  vendor_id: 'fornecedor',
  description: 'descrição',
  total_amount: 'valor total',
  budget_item_id: 'item do orçamento',
  amount: 'valor',
  due_date: 'vencimento',
  paid_at: 'pagamento',
  number: 'número',
  title: 'título',
  remind_at: 'data do lembrete',
  done: 'concluído',
  installment_id: 'parcela',
  spending_cap: 'limite de gastos',
};

const MONEY_FIELDS = new Set(['estimated_amount', 'actual_amount', 'total_amount', 'amount', 'spending_cap']);
const DATE_FIELDS = new Set(['due_date', 'paid_at']);
// References to other rows: the id means nothing to the couple.
const REFERENCE_FIELDS = new Set(['category_id', 'vendor_id', 'budget_item_id', 'installment_id']);

// Main line: "Criou o item Doces", "Marcou como paga a parcela Buffet · parcela 2".
export function describeActivity(activity: Activity) {
  const thing = TABLE_NAMES[activity.table_name] ?? activity.table_name;
  const name = activity.label ? ` ${activity.label}` : '';
  const article = ['parcela', 'categoria'].includes(thing) ? 'a' : 'o';

  if (activity.action === 'insert') return `Criou ${article} ${thing}${name}`;
  if (activity.action === 'delete') return `Apagou ${article} ${thing}${name}`;

  const changes = activity.changes ?? {};
  const keys = Object.keys(changes);
  if (activity.table_name === 'installments' && keys.length === 1 && keys[0] === 'paid_at') {
    return changes.paid_at.new
      ? `Marcou como paga a parcela${name}`
      : `Desmarcou o pagamento da parcela${name}`;
  }
  if (activity.table_name === 'reminders' && keys.length === 1 && keys[0] === 'done') {
    return changes.done.new ? `Concluiu o lembrete${name}` : `Reabriu o lembrete${name}`;
  }
  if (keys.length === 1 && keys[0] === 'spending_cap') {
    return `Mudou o limite de gastos de${name}`;
  }
  return `Editou ${article} ${thing}${name}`;
}

function formatValue(field: string, value: unknown) {
  if (value === null || value === undefined || value === '') return 'vazio';
  if (MONEY_FIELDS.has(field)) return formatCurrency(toNumber(value as number) ?? 0, { cents: true });
  if (DATE_FIELDS.has(field)) return formatDate(String(value));
  if (field === 'remind_at') return formatDateTime(new Date(String(value)));
  if (field === 'status') return STATUS_LABELS[value as BudgetItemStatus] ?? String(value);
  if (typeof value === 'boolean') return value ? 'sim' : 'não';
  return String(value);
}

// Detail lines for an update: "valor estimado: R$ 100,00 → R$ 150,00".
export function describeChanges(activity: Activity) {
  if (activity.action !== 'update' || !activity.changes) return [];
  return Object.entries(activity.changes).map(([field, change]) => {
    const fieldName = FIELD_NAMES[field] ?? field;
    if (REFERENCE_FIELDS.has(field)) return `${fieldName} alterado`;
    return `${fieldName}: ${formatValue(field, change.old)} → ${formatValue(field, change.new)}`;
  });
}

export function describeActor(activity: Activity, currentUserId: string | undefined) {
  if (activity.actor_id && activity.actor_id === currentUserId) return 'Você';
  return activity.actor_email ?? 'Alguém';
}

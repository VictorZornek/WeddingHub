import { toNumber } from '@/features/budget/items';
import { supabase } from '@/lib/supabase';

import type { PaymentWithDetails, PlannedInstallment } from './schedule';

export {
  planInstallments,
  summarizePayment,
  type PaymentSummary,
  type PaymentWithDetails,
  type PlannedInstallment,
} from './schedule';

function normalize(payment: PaymentWithDetails): PaymentWithDetails {
  return {
    ...payment,
    total_amount: toNumber(payment.total_amount) ?? 0,
    installments: payment.installments
      .map((i) => ({ ...i, amount: toNumber(i.amount) ?? 0 }))
      .sort((a, b) => a.number - b.number),
  };
}

const SELECT = '*, installments(*), budget_items(name)';

export async function fetchPayments(weddingId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select(SELECT)
    .eq('wedding_id', weddingId)
    .order('created_at', { ascending: false });
  if (error) return null;
  return (data as PaymentWithDetails[]).map(normalize);
}

export async function fetchPayment(paymentId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select(SELECT)
    .eq('id', paymentId)
    .maybeSingle<PaymentWithDetails>();
  return error || !data ? null : normalize(data);
}

export type NewPayment = {
  description: string;
  budgetItemId: string | null;
  total: number;
  installments: PlannedInstallment[];
};

// Creates the payment and its installments. Rolls back the payment if installments fail.
export async function createPayment(weddingId: string, input: NewPayment) {
  const { data: payment, error } = await supabase
    .from('payments')
    .insert({
      wedding_id: weddingId,
      description: input.description,
      budget_item_id: input.budgetItemId,
      total_amount: input.total,
    })
    .select('id')
    .single<{ id: string }>();
  if (error || !payment) return false;

  const { error: installmentsError } = await supabase.from('installments').insert(
    input.installments.map((i) => ({ ...i, wedding_id: weddingId, payment_id: payment.id }))
  );
  if (installmentsError) {
    await supabase.from('payments').delete().eq('id', payment.id);
    return false;
  }
  return true;
}

export function deletePayment(paymentId: string) {
  return supabase.from('payments').delete().eq('id', paymentId);
}

// paidAt = "AAAA-MM-DD" marks the installment as paid; null marks it as pending again.
export function setInstallmentPaid(installmentId: string, paidAt: string | null) {
  return supabase.from('installments').update({ paid_at: paidAt }).eq('id', installmentId);
}

export type ItemOption = { id: string; name: string; category: string };

// Budget items to link a payment to, with their category for context.
export async function fetchItemOptions(weddingId: string): Promise<ItemOption[]> {
  const { data } = await supabase
    .from('budget_items')
    .select('id, name, categories(name)')
    .eq('wedding_id', weddingId)
    .order('name');
  return ((data ?? []) as unknown as { id: string; name: string; categories: { name: string } | null }[]).map(
    (row) => ({ id: row.id, name: row.name, category: row.categories?.name ?? '' })
  );
}

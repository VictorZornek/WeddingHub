// Pure payment math (no database), so it can be tested on its own.
import { addMonths, todayIso } from '@/lib/date';
import type { Installment, Payment } from '@/types/database';

export type PaymentWithDetails = Payment & {
  installments: Installment[];
  budget_items: { name: string } | null;
};

export type PlannedInstallment = { number: number; amount: number; due_date: string };

// Splits a total into N monthly installments. Cents left over go to the last one.
export function planInstallments(total: number, count: number, firstDueDate: string) {
  const totalCents = Math.round(total * 100);
  const baseCents = Math.floor(totalCents / count);
  return Array.from({ length: count }, (_, index): PlannedInstallment => {
    const isLast = index === count - 1;
    const cents = isLast ? totalCents - baseCents * (count - 1) : baseCents;
    return { number: index + 1, amount: cents / 100, due_date: addMonths(firstDueDate, index) };
  });
}

export type PaymentSummary = {
  paid: number;
  remaining: number;
  paidCount: number;
  next: Installment | null;
  isOverdue: boolean;
};

export function summarizePayment(payment: PaymentWithDetails, today = todayIso()): PaymentSummary {
  const paidInstallments = payment.installments.filter((i) => i.paid_at);
  const paid = paidInstallments.reduce((sum, i) => sum + i.amount, 0);
  const next =
    [...payment.installments]
      .filter((i) => !i.paid_at)
      .sort((a, b) => a.due_date.localeCompare(b.due_date))[0] ?? null;

  return {
    paid,
    remaining: Math.max(payment.total_amount - paid, 0),
    paidCount: paidInstallments.length,
    next,
    isOverdue: !!next && next.due_date < today,
  };
}

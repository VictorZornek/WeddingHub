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

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// "2026-12" -> "Dez 2026"
export function formatMonth(month: string) {
  const [year, monthNumber] = month.split('-');
  return `${MONTHS[Number(monthNumber) - 1]} ${year}`;
}

export type MonthFlow = {
  /** "AAAA-MM" */
  month: string;
  /** Sum of installments due in the month. */
  due: number;
  /** Part of `due` already paid. */
  paid: number;
  /** Unpaid installments of a month that already passed or of today's month past due date. */
  overdue: number;
  installmentCount: number;
};

// Groups every installment by the month it is due.
export function monthlyCashFlow(payments: PaymentWithDetails[], today = todayIso()): MonthFlow[] {
  const byMonth = new Map<string, MonthFlow>();
  for (const payment of payments) {
    for (const installment of payment.installments) {
      const month = installment.due_date.slice(0, 7);
      const flow = byMonth.get(month) ?? { month, due: 0, paid: 0, overdue: 0, installmentCount: 0 };
      flow.due += installment.amount;
      flow.installmentCount += 1;
      if (installment.paid_at) flow.paid += installment.amount;
      else if (installment.due_date < today) flow.overdue += installment.amount;
      byMonth.set(month, flow);
    }
  }
  return [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month));
}

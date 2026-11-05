import type { PaymentWithDetails } from '@/features/payments/schedule';
import { formatCurrency, formatDate } from '@/lib/format';

import type { Notice } from './notifications';

export const DAYS_BEFORE_DUE = 3;
const NOTIFY_HOUR = 9;

function atNineAm(isoDate: string, daysBefore: number) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day - daysBefore, NOTIFY_HOUR, 0);
}

// Two automatic alerts per unpaid installment: a few days before and on the due date.
export function installmentNotices(payments: PaymentWithDetails[]): Notice[] {
  return payments.flatMap((payment) =>
    payment.installments
      .filter((installment) => !installment.paid_at)
      .flatMap((installment) => {
        const amount = formatCurrency(installment.amount, { cents: true });
        const label = `${installment.number}ª parcela de ${payment.description}`;
        return [
          {
            title: `Parcela vence em ${DAYS_BEFORE_DUE} dias`,
            body: `${label}: ${amount} em ${formatDate(installment.due_date)}.`,
            date: atNineAm(installment.due_date, DAYS_BEFORE_DUE),
          },
          {
            title: 'Parcela vence hoje',
            body: `${label}: ${amount}.`,
            date: atNineAm(installment.due_date, 0),
          },
        ];
      })
  );
}

import { StyleSheet, View } from 'react-native';

import { CapBar } from '@/components/budget/cap-bar';
import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { formatMonth, type MonthFlow } from '@/features/payments/schedule';
import { useTheme } from '@/hooks/use-theme';
import { todayIso } from '@/lib/date';
import { formatCurrency } from '@/lib/format';

// One card per month: how much is due, how much was paid, and what is late.
export function CashFlowList({ months }: { months: MonthFlow[] }) {
  const theme = useTheme();
  const currentMonth = todayIso().slice(0, 7);

  if (months.length === 0) {
    return (
      <ThemedText themeColor="textSecondary" style={styles.empty}>
        As parcelas aparecem aqui, mês a mês, depois que você registrar um pagamento.
      </ThemedText>
    );
  }

  return (
    <View style={styles.list}>
      {months.map((flow) => {
        const isCurrent = flow.month === currentMonth;
        const remaining = Math.max(flow.due - flow.paid, 0);
        const isDone = remaining === 0;
        return (
          <Card
            key={flow.month}
            style={[styles.card, isCurrent && { borderColor: theme.accent }]}>
            <View style={styles.row}>
              <ThemedText type="smallBold">
                {formatMonth(flow.month)}
                {isCurrent ? ' · este mês' : ''}
              </ThemedText>
              <ThemedText type="smallBold">{formatCurrency(flow.due)}</ThemedText>
            </View>

            <CapBar usage={flow.due > 0 ? flow.paid / flow.due : 0} />

            <View style={styles.row}>
              <ThemedText type="small" themeColor="textSecondary">
                {flow.installmentCount} {flow.installmentCount === 1 ? 'parcela' : 'parcelas'}
              </ThemedText>
              {isDone ? (
                <ThemedText type="small" themeColor="link">
                  Tudo pago
                </ThemedText>
              ) : flow.overdue > 0 ? (
                <ThemedText type="small" themeColor="danger">
                  {formatCurrency(flow.overdue)} atrasado
                </ThemedText>
              ) : (
                <ThemedText type="small" themeColor="textSecondary">
                  Falta {formatCurrency(remaining)}
                </ThemedText>
              )}
            </View>
          </Card>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.three },
  card: { gap: Spacing.two },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  empty: { textAlign: 'center', marginTop: Spacing.three },
});

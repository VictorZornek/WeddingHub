import { Pressable, StyleSheet, View } from 'react-native';

import { CapBar } from '@/components/budget/cap-bar';
import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { summarizePayment, type PaymentWithDetails } from '@/features/payments/payments';
import { formatCurrency, formatDate } from '@/lib/format';

type Props = { payment: PaymentWithDetails; onPress: () => void };

export function PaymentCard({ payment, onPress }: Props) {
  const summary = summarizePayment(payment);
  const count = payment.installments.length;
  const progress = payment.total_amount > 0 ? summary.paid / payment.total_amount : 0;
  const isDone = !summary.next;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.title}>
            <ThemedText type="smallBold">{payment.description}</ThemedText>
            {payment.budget_items && (
              <ThemedText type="small" themeColor="textSecondary">
                {payment.budget_items.name}
              </ThemedText>
            )}
          </View>
          <ThemedText type="smallBold">{formatCurrency(payment.total_amount)}</ThemedText>
        </View>

        <CapBar usage={Math.min(progress, 1)} />

        <View style={styles.row}>
          <ThemedText type="small" themeColor="textSecondary">
            {summary.paidCount} de {count} {count === 1 ? 'parcela paga' : 'parcelas pagas'}
          </ThemedText>
          {isDone ? (
            <ThemedText type="small" themeColor="link">
              Quitado
            </ThemedText>
          ) : (
            <ThemedText type="small" themeColor={summary.isOverdue ? 'danger' : 'textSecondary'}>
              {summary.isOverdue ? 'Atrasada' : 'Próxima'} {formatDate(summary.next!.due_date)}
            </ThemedText>
          )}
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.two },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  title: { flex: 1 },
  pressed: { opacity: 0.7 },
});

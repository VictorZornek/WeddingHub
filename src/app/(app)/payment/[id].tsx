import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { FormMessage, LinkButton } from '@/components/form';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import {
  deletePayment,
  fetchPayment,
  setInstallmentPaid,
  summarizePayment,
  type PaymentWithDetails,
} from '@/features/payments/payments';
import { syncNotifications } from '@/features/notifications/sync';
import { useTheme } from '@/hooks/use-theme';
import { confirmDestructive } from '@/lib/confirm';
import { todayIso } from '@/lib/date';
import { formatCurrency, formatDate } from '@/lib/format';
import { useWedding } from '@/providers/wedding-provider';

export default function PaymentScreen() {
  const theme = useTheme();
  const { wedding } = useWedding();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [payment, setPayment] = useState<PaymentWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    fetchPayment(id).then((result) => {
      if (!isActive) return;
      setPayment(result);
      setIsLoading(false);
    });
    return () => {
      isActive = false;
    };
  }, [id]);

  async function handleDelete() {
    if (!payment) return;
    const confirmed = await confirmDestructive(
      'Apagar pagamento?',
      `"${payment.description}" e todas as parcelas serão removidos.`,
      'Apagar'
    );
    if (!confirmed) return;
    const { error: deleteError } = await deletePayment(payment.id);
    if (deleteError) return setError('Não foi possível apagar. Tente de novo.');
    if (wedding) syncNotifications(wedding.id);
    router.back();
  }

  // Updates the screen right away and reverts if the save fails.
  async function handleTogglePaid(installmentId: string, paid: boolean) {
    if (!payment) return;
    const before = payment;
    const paidAt = paid ? todayIso() : null;
    setError(null);
    setPayment({
      ...payment,
      installments: payment.installments.map((i) =>
        i.id === installmentId ? { ...i, paid_at: paidAt } : i
      ),
    });
    const { error: saveError } = await setInstallmentPaid(installmentId, paidAt);
    if (saveError) {
      setPayment(before);
      setError('Não foi possível atualizar a parcela. Tente de novo.');
      return;
    }
    // Paid installments should stop sending due-date alerts.
    if (wedding) syncNotifications(wedding.id);
  }

  const summary = payment ? summarizePayment(payment) : null;
  const today = todayIso();

  return (
    <>
      <Stack.Screen options={{ title: payment?.description ?? '' }} />
      <ScrollView contentContainerStyle={styles.content}>
        {isLoading && <ActivityIndicator color={theme.link} style={styles.loading} />}
        {!isLoading && !payment && (
          <ThemedText themeColor="danger">Pagamento não encontrado.</ThemedText>
        )}

        {payment && summary && (
          <>
            <Card variant="accent" style={styles.summary}>
              <Summary label="Total" value={payment.total_amount} />
              <Summary label="Pago" value={summary.paid} />
              <Summary label="Falta" value={summary.remaining} />
            </Card>

            {payment.budget_items && (
              <ThemedText type="small" themeColor="textSecondary">
                Item do orçamento: {payment.budget_items.name}
              </ThemedText>
            )}

            <ThemedText type="small" themeColor="textSecondary">
              Toque no círculo para marcar a parcela como paga.
            </ThemedText>

            <Card style={styles.list}>
              {payment.installments.map((installment, index) => {
                const isPaid = !!installment.paid_at;
                const isOverdue = !isPaid && installment.due_date < today;
                return (
                  <View
                    key={installment.id}
                    style={[
                      styles.row,
                      index < payment.installments.length - 1 && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: theme.border,
                      },
                    ]}>
                    <Pressable
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isPaid }}
                      accessibilityLabel={`Marcar ${installment.number}ª parcela como paga`}
                      hitSlop={8}
                      onPress={() => handleTogglePaid(installment.id, !isPaid)}
                      style={[
                        styles.check,
                        isPaid
                          ? { backgroundColor: theme.accent, borderColor: theme.accent }
                          : { borderColor: isOverdue ? theme.danger : theme.border },
                      ]}>
                      {isPaid && <SymbolView name="checkmark" size={14} tintColor={theme.onAccentFill} />}
                    </Pressable>
                    <View style={styles.rowText}>
                      <ThemedText type="small">
                        {installment.number}ª parcela · {formatDate(installment.due_date)}
                      </ThemedText>
                      <ThemedText
                        type="small"
                        themeColor={isPaid ? 'link' : isOverdue ? 'danger' : 'textSecondary'}>
                        {isPaid
                          ? `Paga em ${formatDate(installment.paid_at!)}`
                          : isOverdue
                            ? 'Atrasada'
                            : 'Pendente'}
                      </ThemedText>
                    </View>
                    <ThemedText type="smallBold">
                      {formatCurrency(installment.amount, { cents: true })}
                    </ThemedText>
                  </View>
                );
              })}
            </Card>

            <FormMessage error={error} />
            <LinkButton label="Apagar pagamento" onPress={handleDelete} destructive />
          </>
        )}
      </ScrollView>
    </>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.summaryValue}>
      <ThemedText type="small" themeColor="onAccentSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold" themeColor="onAccent">
        {formatCurrency(value)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: Spacing.three, padding: Spacing.three, paddingBottom: Spacing.six },
  loading: { marginTop: Spacing.five },
  summary: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryValue: { gap: Spacing.half },
  list: { paddingVertical: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  rowText: { flex: 1 },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

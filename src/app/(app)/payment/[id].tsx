import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { FormMessage, LinkButton } from '@/components/form';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import {
  deletePayment,
  fetchPayment,
  summarizePayment,
  type PaymentWithDetails,
} from '@/features/payments/payments';
import { useTheme } from '@/hooks/use-theme';
import { confirmDestructive } from '@/lib/confirm';
import { todayIso } from '@/lib/date';
import { formatCurrency, formatDate } from '@/lib/format';

export default function PaymentScreen() {
  const theme = useTheme();
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
    router.back();
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
                    <View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.three,
  },
});

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { PrimaryButton } from '@/components/form';
import { CashFlowList } from '@/components/payments/cash-flow-list';
import { PaymentCard } from '@/components/payments/payment-card';
import { Segmented } from '@/components/segmented';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import {
  fetchPayments,
  summarizePayment,
  type PaymentWithDetails,
} from '@/features/payments/payments';
import { monthlyCashFlow } from '@/features/payments/schedule';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency } from '@/lib/format';
import { useWedding } from '@/providers/wedding-provider';

type PaymentsView = 'contracts' | 'monthly';

const VIEW_OPTIONS: { value: PaymentsView; label: string }[] = [
  { value: 'contracts', label: 'Contratos' },
  { value: 'monthly', label: 'Por mês' },
];

export default function PaymentsScreen() {
  const theme = useTheme();
  const { wedding } = useWedding();
  const weddingId = wedding?.id;
  const [payments, setPayments] = useState<PaymentWithDetails[] | null>(null);
  const [view, setView] = useState<PaymentsView>('contracts');
  const [hasError, setHasError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!weddingId) return;
    const result = await fetchPayments(weddingId);
    setHasError(result === null);
    setPayments(result ?? []);
  }, [weddingId]);

  // Reload when the tab is shown, so new payments appear.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleRefresh() {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  }

  const totals = (payments ?? []).reduce(
    (sum, payment) => {
      const summary = summarizePayment(payment);
      return { total: sum.total + payment.total_amount, paid: sum.paid + summary.paid };
    },
    { total: 0, paid: 0 }
  );

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.link} />
          }>
          <ThemedText type="subtitle">Pagamentos</ThemedText>

          {payments === null && <ActivityIndicator color={theme.link} style={styles.loading} />}
          {hasError && (
            <ThemedText themeColor="danger">Não foi possível carregar os pagamentos.</ThemedText>
          )}

          {payments !== null && (
            <>
              <Card variant="accent" style={styles.summary}>
                <Summary label="Contratado" value={totals.total} />
                <Summary label="Pago" value={totals.paid} />
                <Summary label="Falta pagar" value={Math.max(totals.total - totals.paid, 0)} />
              </Card>

              <PrimaryButton label="Novo pagamento" onPress={() => router.push('/payment/new')} />

              <Segmented options={VIEW_OPTIONS} value={view} onChange={setView} />

              {view === 'monthly' ? (
                <CashFlowList months={monthlyCashFlow(payments)} />
              ) : payments.length === 0 ? (
                <ThemedText themeColor="textSecondary" style={styles.empty}>
                  Registre um contrato para acompanhar as parcelas e os vencimentos.
                </ThemedText>
              ) : (
                payments.map((payment) => (
                  <PaymentCard
                    key={payment.id}
                    payment={payment}
                    onPress={() =>
                      router.push({ pathname: '/payment/[id]', params: { id: payment.id } })
                    }
                  />
                ))
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
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
  flex: { flex: 1 },
  content: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  loading: { marginTop: Spacing.five },
  summary: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryValue: { gap: Spacing.half },
  empty: { textAlign: 'center', marginTop: Spacing.three },
});

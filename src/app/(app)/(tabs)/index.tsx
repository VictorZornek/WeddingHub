import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProjectSwitcher } from '@/components/budget/project-switcher';
import { Card } from '@/components/card';
import { SpendingChart } from '@/components/dashboard/spending-chart';
import { SummaryCards } from '@/components/dashboard/summary-cards';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { addTotals, sumItems } from '@/features/budget/totals';
import { useBudget, type ProjectWithCategories } from '@/features/budget/use-budget';
import {
  fetchPayments,
  summarizePayment,
  type PaymentWithDetails,
} from '@/features/payments/payments';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';
import { useWedding } from '@/providers/wedding-provider';

// Paid installments of payments linked to this project's items. Payments without
// a linked item count for the main project (the first one, "Casamento").
function paidForProject(
  payments: PaymentWithDetails[],
  project: ProjectWithCategories,
  isMainProject: boolean
) {
  const itemIds = new Set(project.categories.flatMap((c) => c.budget_items.map((i) => i.id)));
  return payments
    .filter((p) => (p.budget_item_id ? itemIds.has(p.budget_item_id) : isMainProject))
    .reduce((sum, p) => sum + summarizePayment(p).paid, 0);
}

function daysUntil(isoDate: string) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((new Date(year, month - 1, day).getTime() - start.getTime()) / 86_400_000);
}

export default function HomeScreen() {
  const theme = useTheme();
  const { session } = useSession();
  const { wedding } = useWedding();
  const { projects, isLoading, reload } = useBudget();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const weddingId = wedding?.id;

  // Values change in other tabs, so reload when coming back here.
  useFocusEffect(
    useCallback(() => {
      reload();
      if (weddingId) fetchPayments(weddingId).then((result) => setPayments(result ?? []));
    }, [reload, weddingId])
  );

  const project = projects.find((p) => p.id === selectedId) ?? projects[0] ?? null;
  const totals = addTotals(project?.categories.map((c) => sumItems(c.budget_items)) ?? []);
  const paid = project ? paidForProject(payments, project, project.id === projects[0]?.id) : 0;
  const daysLeft = wedding?.wedding_date ? daysUntil(wedding.wedding_date) : null;

  function shareInvite() {
    if (!wedding) return;
    Share.share({
      message: `Entre no nosso casamento no Wedding Hub com o código: ${wedding.invite_code}`,
    });
  }

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content}>
          <View>
            <ThemedText type="subtitle">{wedding?.name ?? 'Início'}</ThemedText>
            {wedding?.wedding_date && (
              <ThemedText themeColor="textSecondary">
                {formatDate(wedding.wedding_date)}
                {daysLeft !== null && daysLeft > 0 && ` · faltam ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}`}
                {daysLeft === 0 && ' · é hoje!'}
              </ThemedText>
            )}
          </View>

          {isLoading && <ActivityIndicator color={theme.link} style={styles.loading} />}

          {project && (
            <>
              {projects.length > 1 && (
                <ProjectSwitcher projects={projects} selectedId={project.id} onSelect={setSelectedId} />
              )}
              <SummaryCards totals={totals} paid={paid} cap={project.spending_cap} />
              <SpendingChart categories={project.categories} />
            </>
          )}

          {wedding && (
            <Pressable onPress={shareInvite} style={({ pressed }) => pressed && styles.pressed}>
              <Card variant="soft" style={styles.inviteCard}>
                <View style={styles.flex}>
                  <ThemedText type="small" themeColor="textSecondary">
                    Código de convite
                  </ThemedText>
                  <ThemedText type="smallBold" style={styles.code}>
                    {wedding.invite_code}
                  </ThemedText>
                </View>
                <ThemedText type="linkPrimary">Compartilhar</ThemedText>
              </Card>
            </Pressable>
          )}

          <View style={styles.account}>
            <ThemedText type="small" themeColor="textSecondary">
              {session?.user.email}
            </ThemedText>
            <Pressable
              onPress={() => supabase.auth.signOut()}
              style={({ pressed }) => pressed && styles.pressed}>
              <ThemedText type="linkPrimary">Sair</ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
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
  inviteCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  code: { letterSpacing: 3, fontSize: 18 },
  account: { alignItems: 'center', marginTop: Spacing.three },
  pressed: { opacity: 0.7 },
});

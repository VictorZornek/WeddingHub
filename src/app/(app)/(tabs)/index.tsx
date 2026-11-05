import { router, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProjectSwitcher } from '@/components/budget/project-switcher';
import { InsightsCards } from '@/components/dashboard/insights-cards';
import { ProjectionChart } from '@/components/dashboard/projection-chart';
import { SpendingChart } from '@/components/dashboard/spending-chart';
import { SummaryCards } from '@/components/dashboard/summary-cards';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { addTotals, sumItems } from '@/features/budget/totals';
import { useBudget, type ProjectWithCategories } from '@/features/budget/use-budget';
import {
  paymentsForProject,
  projectionByCategory,
  projectionSeries,
} from '@/features/dashboard/projection';
import {
  fetchPayments,
  summarizePayment,
  type PaymentWithDetails,
} from '@/features/payments/payments';
import { useTheme } from '@/hooks/use-theme';
import { todayIso } from '@/lib/date';
import { formatDate } from '@/lib/format';
import { useWedding } from '@/providers/wedding-provider';

// Payments that belong to the selected project (see paymentsForProject).
function projectPayments(
  payments: PaymentWithDetails[],
  project: ProjectWithCategories,
  isMainProject: boolean
) {
  const itemIds = new Set(project.categories.flatMap((c) => c.budget_items.map((i) => i.id)));
  return paymentsForProject(payments, itemIds, isMainProject);
}

function daysUntil(isoDate: string) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((new Date(year, month - 1, day).getTime() - start.getTime()) / 86_400_000);
}

export default function HomeScreen() {
  const theme = useTheme();
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
  const ownPayments = project ? projectPayments(payments, project, project.id === projects[0]?.id) : [];
  const paid = ownPayments.reduce((sum, p) => sum + summarizePayment(p).paid, 0);
  const currentMonth = todayIso().slice(0, 7);
  const weddingMonth = wedding?.wedding_date?.slice(0, 7) ?? null;
  const projection = projectionSeries(ownPayments, currentMonth, weddingMonth);
  const projectionByCat = projectionByCategory(
    ownPayments,
    project?.categories ?? [],
    currentMonth,
    weddingMonth
  );
  const daysLeft = wedding?.wedding_date ? daysUntil(wedding.wedding_date) : null;

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <View style={styles.flex}>
              <ThemedText type="subtitle">{wedding?.name ?? 'Início'}</ThemedText>
              {wedding?.wedding_date && (
                <ThemedText themeColor="textSecondary">
                  {formatDate(wedding.wedding_date)}
                  {daysLeft !== null && daysLeft > 0 && ` · faltam ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}`}
                  {daysLeft === 0 && ' · é hoje!'}
                </ThemedText>
              )}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ajustes"
              hitSlop={8}
              onPress={() => router.push('/settings')}
              style={({ pressed }) => [
                styles.settingsButton,
                { backgroundColor: theme.accentSoft },
                pressed && styles.pressed,
              ]}>
              <SymbolView name="gearshape" size={20} tintColor={theme.link} />
            </Pressable>
          </View>

          {isLoading && <ActivityIndicator color={theme.link} style={styles.loading} />}

          {project && (
            <>
              {projects.length > 1 && (
                <ProjectSwitcher projects={projects} selectedId={project.id} onSelect={setSelectedId} />
              )}
              <SummaryCards totals={totals} paid={paid} cap={project.spending_cap} />
              <SpendingChart categories={project.categories} />
              <ProjectionChart
                points={projection}
                byCategory={projectionByCat}
                categoryIds={project.categories.map((c) => c.id)}
                projected={totals.projected}
                cap={project.spending_cap}
                currentMonth={currentMonth}
              />
              <InsightsCards categories={project.categories} />
            </>
          )}
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
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.one,
  },
  pressed: { opacity: 0.7 },
});

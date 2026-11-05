import { useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CapBar } from '@/components/budget/cap-bar';
import { CategoryCard } from '@/components/budget/category-card';
import { ProjectSwitcher } from '@/components/budget/project-switcher';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { addTotals, capUsage, sumItems } from '@/features/budget/totals';
import { useBudget } from '@/features/budget/use-budget';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency, formatPercent } from '@/lib/format';

export default function BudgetScreen() {
  const theme = useTheme();
  const { projects, error, isLoading, isRefreshing, refresh } = useBudget();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const project = projects.find((p) => p.id === selectedId) ?? projects[0] ?? null;
  const totals = addTotals(project?.categories.map((c) => sumItems(c.budget_items)) ?? []);
  const usage = project ? capUsage(totals.projected, project.spending_cap) : null;

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}>
          <ThemedText type="subtitle">Orçamento</ThemedText>

          {isLoading && <ActivityIndicator style={styles.loading} />}
          {error && <ThemedText style={{ color: theme.danger }}>{error}</ThemedText>}

          {!isLoading && !error && projects.length === 0 && (
            <ThemedText themeColor="textSecondary">Nenhuma categoria cadastrada ainda.</ThemedText>
          )}

          {project && (
            <>
              <ProjectSwitcher projects={projects} selectedId={project.id} onSelect={setSelectedId} />

              <ThemedView type="backgroundElement" style={styles.summary}>
                <View style={styles.summaryRow}>
                  <SummaryValue label="Estimado" value={totals.estimated} />
                  <SummaryValue label="Real" value={totals.actual} />
                  <SummaryValue label="Previsto" value={totals.projected} />
                </View>
                {usage !== null && project.spending_cap !== null ? (
                  <View style={styles.capBlock}>
                    <CapBar usage={usage} />
                    <ThemedText type="small" themeColor="textSecondary">
                      {formatPercent(usage)} do teto de {formatCurrency(project.spending_cap)}
                    </ThemedText>
                  </View>
                ) : (
                  <ThemedText type="small" themeColor="textSecondary">
                    Sem teto de gastos definido.
                  </ThemedText>
                )}
              </ThemedView>

              {project.categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function SummaryValue({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.summaryValue}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold">{formatCurrency(value)}</ThemedText>
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
  summary: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.three },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryValue: { gap: Spacing.half },
  capBlock: { gap: Spacing.one },
});

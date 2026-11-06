import { router, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CapBar } from '@/components/budget/cap-bar';
import { CategoryCard } from '@/components/budget/category-card';
import { ProjectSwitcher } from '@/components/budget/project-switcher';
import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { addTotals, capUsage, sumItems } from '@/features/budget/totals';
import { useBudget } from '@/features/budget/use-budget';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency, formatPercent } from '@/lib/format';

export default function BudgetScreen() {
  const theme = useTheme();
  const { projects, error, isLoading, isRefreshing, refresh, reload } = useBudget();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Totals change after editing items, so reload when coming back to this tab.
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const project = projects.find((p) => p.id === selectedId) ?? projects[0] ?? null;
  const totals = addTotals(project?.categories.map((c) => sumItems(c.budget_items)) ?? []);
  const usage = project ? capUsage(totals.projected, project.spending_cap) : null;

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={theme.link} />
          }>
          <View style={styles.header}>
            <ThemedText type="subtitle">Orçamento</ThemedText>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/vendors')}
              style={({ pressed }) => [
                styles.vendorsButton,
                { backgroundColor: theme.accentSoft },
                pressed && styles.pressed,
              ]}>
              <SymbolView name="person.2" size={16} tintColor={theme.link} />
              <ThemedText type="smallBold" themeColor="link">
                Fornecedores
              </ThemedText>
            </Pressable>
          </View>

          {isLoading && <ActivityIndicator style={styles.loading} color={theme.link} />}
          {error && <ThemedText themeColor="danger">{error}</ThemedText>}

          {!isLoading && !error && projects.length === 0 && (
            <ThemedText themeColor="textSecondary">Nenhuma categoria cadastrada ainda.</ThemedText>
          )}

          {project && (
            <>
              <ProjectSwitcher projects={projects} selectedId={project.id} onSelect={setSelectedId} />

              <Card variant="accent" style={styles.summary}>
                <View>
                  <ThemedText type="small" themeColor="onAccentSecondary">
                    Previsto
                  </ThemedText>
                  <ThemedText type="subtitle" themeColor="onAccent">
                    {formatCurrency(totals.projected)}
                  </ThemedText>
                </View>

                <View style={styles.summaryRow}>
                  <SummaryValue label="Estimado" value={totals.estimated} />
                  <SummaryValue label="Real" value={totals.actual} />
                </View>

                {usage !== null && project.spending_cap !== null ? (
                  <View style={styles.capBlock}>
                    <CapBar usage={usage} />
                    <ThemedText type="small" themeColor="onAccentSecondary">
                      {usage > 1
                        ? `Acima do teto de ${formatCurrency(project.spending_cap)}`
                        : `${formatPercent(usage)} do teto de ${formatCurrency(project.spending_cap)}`}
                    </ThemedText>
                  </View>
                ) : (
                  <ThemedText type="small" themeColor="onAccentSecondary">
                    Sem teto de gastos definido
                  </ThemedText>
                )}

                <Pressable
                  onPress={() =>
                    router.push({ pathname: '/caps/[projectId]', params: { projectId: project.id } })
                  }
                  style={({ pressed }) => [
                    styles.capButton,
                    { backgroundColor: theme.backgroundElement, borderColor: theme.accentBorder },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText type="smallBold" themeColor="link">
                    {project.spending_cap !== null ? 'Editar tetos' : 'Definir tetos'}
                  </ThemedText>
                </Pressable>
              </Card>

              {project.categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  onPress={() =>
                    router.push({ pathname: '/category/[id]', params: { id: category.id } })
                  }
                />
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
  summary: { gap: Spacing.three },
  summaryRow: { flexDirection: 'row', gap: Spacing.five },
  summaryValue: { gap: Spacing.half },
  capBlock: { gap: Spacing.one },
  capButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: Spacing.one + 2,
    paddingHorizontal: Spacing.three,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vendorsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderRadius: 999,
    paddingVertical: Spacing.one + 2,
    paddingHorizontal: Spacing.three,
  },
  pressed: { opacity: 0.7 },
});

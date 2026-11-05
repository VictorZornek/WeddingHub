import { StyleSheet, View } from 'react-native';

import { CapBar } from '@/components/budget/cap-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { CategoryWithItems } from '@/features/budget/use-budget';
import { capUsage, sumItems } from '@/features/budget/totals';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency, formatPercent } from '@/lib/format';

export function CategoryCard({ category }: { category: CategoryWithItems }) {
  const theme = useTheme();
  const totals = sumItems(category.budget_items);
  const usage = capUsage(totals.projected, category.spending_cap);
  const isOver = usage !== null && usage > 1;
  const itemCount = category.budget_items.length;

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.header}>
        <ThemedText type="smallBold" style={styles.name}>
          {category.name}
        </ThemedText>
        <ThemedText type="smallBold">{formatCurrency(totals.estimated)}</ThemedText>
      </View>

      <View style={styles.row}>
        <ThemedText type="small" themeColor="textSecondary">
          {itemCount} {itemCount === 1 ? 'item' : 'itens'}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {totals.actual > 0 ? `Real ${formatCurrency(totals.actual)}` : 'Sem valor real'}
        </ThemedText>
      </View>

      {usage !== null && category.spending_cap !== null && (
        <View style={styles.capBlock}>
          <CapBar usage={usage} />
          <View style={styles.row}>
            <ThemedText type="small" style={isOver ? { color: theme.danger } : undefined} themeColor="textSecondary">
              {isOver ? 'Acima do teto' : `${formatPercent(usage)} do teto`}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Teto {formatCurrency(category.spending_cap)}
            </ThemedText>
          </View>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.one },
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
  name: { flexShrink: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
  capBlock: { gap: Spacing.one, marginTop: Spacing.two },
});

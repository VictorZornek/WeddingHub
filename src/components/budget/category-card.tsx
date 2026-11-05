import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { CapBar } from '@/components/budget/cap-bar';
import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { categoryIcon } from '@/features/budget/category-icon';
import { capUsage, sumItems } from '@/features/budget/totals';
import type { CategoryWithItems } from '@/features/budget/use-budget';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency, formatPercent } from '@/lib/format';

export function CategoryCard({ category }: { category: CategoryWithItems }) {
  const theme = useTheme();
  const totals = sumItems(category.budget_items);
  const usage = capUsage(totals.projected, category.spending_cap);
  const isOver = usage !== null && usage > 1;
  const itemCount = category.budget_items.length;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: theme.accentSoft }]}>
          <SymbolView name={categoryIcon(category.name)} size={18} tintColor={theme.link} />
        </View>
        <View style={styles.titleBlock}>
          <ThemedText type="smallBold">{category.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {itemCount} {itemCount === 1 ? 'item' : 'itens'}
          </ThemedText>
        </View>
        <View style={styles.values}>
          <ThemedText type="smallBold">{formatCurrency(totals.estimated)}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {totals.actual > 0 ? `Real ${formatCurrency(totals.actual)}` : 'Sem valor real'}
          </ThemedText>
        </View>
      </View>

      {usage !== null && category.spending_cap !== null && (
        <View style={styles.capBlock}>
          <CapBar usage={usage} />
          <View style={styles.row}>
            <ThemedText type="small" themeColor={isOver ? 'danger' : 'textSecondary'}>
              {isOver ? 'Acima do teto' : `${formatPercent(usage)} do teto`}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Teto {formatCurrency(category.spending_cap)}
            </ThemedText>
          </View>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.two },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: { flex: 1 },
  values: { alignItems: 'flex-end' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
  capBlock: { gap: Spacing.one },
});

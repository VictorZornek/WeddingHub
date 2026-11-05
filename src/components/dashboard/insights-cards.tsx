import { StyleSheet, View } from 'react-native';

import { CapBar } from '@/components/budget/cap-bar';
import { Card } from '@/components/card';
import { PieChart } from '@/components/dashboard/pie-chart';
import { ThemedText } from '@/components/themed-text';
import { categoryColor } from '@/constants/chart-colors';
import { Spacing } from '@/constants/theme';
import { categoryShares, estimateGaps, openItems } from '@/features/dashboard/insights';
import type { CategoryWithItems } from '@/features/budget/use-budget';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency, formatPercent } from '@/lib/format';

const PIE_SIZE = 168;

export function InsightsCards({ categories }: { categories: CategoryWithItems[] }) {
  return (
    <>
      <ShareCard categories={categories} />
      <GapsCard categories={categories} />
      <OpenItemsCard categories={categories} />
    </>
  );
}

// "Para onde vai o dinheiro": pie chart split by category.
function ShareCard({ categories }: { categories: CategoryWithItems[] }) {
  const theme = useTheme();
  const shares = categoryShares(categories);
  if (shares.length === 0) return null;
  const ids = categories.map((c) => c.id);
  const slices = shares.map((s) => ({ id: s.id, value: s.value, color: categoryColor(ids, s.id) }));

  return (
    <Card style={styles.card}>
      <ThemedText type="smallBold">Para onde vai o dinheiro</ThemedText>
      <View style={styles.pie}>
        <PieChart slices={slices} size={PIE_SIZE} thickness={PIE_SIZE / 2} gapColor={theme.backgroundElement} />
      </View>
      {shares.map((slice) => (
        <View key={slice.id} style={styles.row}>
          <View style={styles.legendName}>
            <View style={[styles.dot, { backgroundColor: categoryColor(ids, slice.id) }]} />
            <ThemedText type="small" numberOfLines={1} style={styles.shrink}>
              {slice.name}
            </ThemedText>
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            {formatPercent(slice.share)} · {formatCurrency(slice.value)}
          </ThemedText>
        </View>
      ))}
    </Card>
  );
}

// "Estimado × real": where the contracts came out above or below the estimate.
function GapsCard({ categories }: { categories: CategoryWithItems[] }) {
  const gaps = estimateGaps(categories);
  if (gaps.length === 0) return null;
  const totalGap = gaps.reduce((sum, g) => sum + g.gap, 0);

  return (
    <Card style={styles.card}>
      <ThemedText type="smallBold">Estimado × real</ThemedText>
      <ThemedText type="small" themeColor={totalGap > 0 ? 'danger' : 'link'}>
        {totalGap > 0
          ? `Os contratos fechados saíram ${formatCurrency(totalGap)} acima do estimado.`
          : totalGap < 0
            ? `Os contratos fechados saíram ${formatCurrency(-totalGap)} abaixo do estimado.`
            : 'Os contratos fechados saíram exatamente como o estimado.'}
      </ThemedText>
      {gaps.slice(0, 4).map((gap) => (
        <View key={gap.id} style={styles.row}>
          <ThemedText type="small" style={styles.shrink}>
            {gap.name}
          </ThemedText>
          <ThemedText type="small" themeColor={gap.gap > 0 ? 'danger' : 'textSecondary'}>
            {gap.gap > 0 ? '+' : gap.gap < 0 ? '−' : ''}
            {formatCurrency(Math.abs(gap.gap))}
          </ThemedText>
        </View>
      ))}
    </Card>
  );
}

// "O que falta decidir": items still marked "a definir".
function OpenItemsCard({ categories }: { categories: CategoryWithItems[] }) {
  const open = openItems(categories);
  if (open.total === 0) return null;
  const decided = open.total - open.toDefine;

  return (
    <Card style={styles.card}>
      <ThemedText type="smallBold">O que falta decidir</ThemedText>
      <CapBar usage={decided / open.total} />
      <ThemedText type="small" themeColor="textSecondary">
        {decided} de {open.total} itens decididos
        {open.withoutValue > 0 ? ` · ${open.withoutValue} ainda sem valor` : ''}
      </ThemedText>
      {open.byCategory.map((category) => (
        <View key={category.id} style={styles.row}>
          <ThemedText type="small">{category.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {category.count} a definir
          </ThemedText>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.two },
  pie: { alignItems: 'center', paddingVertical: Spacing.two },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  legendName: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flexShrink: 1 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  shrink: { flexShrink: 1 },
});

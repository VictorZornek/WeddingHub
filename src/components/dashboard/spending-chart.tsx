import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { sumItems } from '@/features/budget/totals';
import type { CategoryWithItems } from '@/features/budget/use-budget';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency } from '@/lib/format';

type Row = { id: string; name: string; projected: number; cap: number | null };

// Horizontal bars: projected spend per category, with a tick where the cap is.
export function SpendingChart({ categories }: { categories: CategoryWithItems[] }) {
  const theme = useTheme();

  const rows: Row[] = categories
    .map((c) => ({
      id: c.id,
      name: c.name,
      projected: sumItems(c.budget_items).projected,
      cap: c.spending_cap,
    }))
    .filter((r) => r.projected > 0 || r.cap)
    .sort((a, b) => b.projected - a.projected);

  // Every bar uses the same scale so the categories can be compared.
  const scale = Math.max(1, ...rows.map((r) => Math.max(r.projected, r.cap ?? 0)));
  const hasCaps = rows.some((r) => r.cap);

  return (
    <Card style={styles.card}>
      <ThemedText type="smallBold">Gasto × teto por categoria</ThemedText>

      {rows.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Adicione valores no orçamento para ver o gráfico.
        </ThemedText>
      ) : (
        rows.map((row) => {
          const isOver = row.cap !== null && row.projected > row.cap;
          return (
            <View key={row.id} style={styles.row}>
              <View style={styles.labels}>
                <ThemedText type="small" style={styles.name} numberOfLines={1}>
                  {row.name}
                </ThemedText>
                <ThemedText type="small" themeColor={isOver ? 'danger' : 'textSecondary'}>
                  {formatCurrency(row.projected)}
                  {row.cap !== null ? ` / ${formatCurrency(row.cap)}` : ''}
                </ThemedText>
              </View>
              <View style={[styles.track, { backgroundColor: theme.track }]}>
                <View
                  style={[
                    styles.bar,
                    {
                      width: `${(row.projected / scale) * 100}%`,
                      backgroundColor: isOver ? theme.danger : theme.accent,
                    },
                  ]}
                />
                {row.cap !== null && (
                  <View
                    style={[
                      styles.capTick,
                      { left: `${(row.cap / scale) * 100}%`, backgroundColor: theme.text },
                    ]}
                  />
                )}
              </View>
            </View>
          );
        })
      )}

      {hasCaps && (
        <View style={styles.legend}>
          <View style={[styles.legendTick, { backgroundColor: theme.text }]} />
          <ThemedText type="small" themeColor="textSecondary">
            Teto da categoria
          </ThemedText>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three },
  row: { gap: Spacing.one },
  labels: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
  name: { flexShrink: 1 },
  track: { height: 10, borderRadius: 5, overflow: 'visible' },
  bar: { height: '100%', borderRadius: 5 },
  capTick: { position: 'absolute', top: -3, width: 2, height: 16, marginLeft: -1, borderRadius: 1 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  legendTick: { width: 2, height: 12, borderRadius: 1 },
});

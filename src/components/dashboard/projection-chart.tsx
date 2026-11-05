import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { LineChart, type LineSeries } from '@/components/dashboard/line-chart';
import { Segmented } from '@/components/segmented';
import { ThemedText } from '@/components/themed-text';
import { categoryColor } from '@/constants/chart-colors';
import { Spacing } from '@/constants/theme';
import {
  busiestMonth,
  type CategoryProjection,
  type ProjectionPoint,
} from '@/features/dashboard/projection';
import { formatMonth } from '@/features/payments/schedule';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency } from '@/lib/format';

// Warm sand: stands apart from the green "paid" line in light and dark mode.
const SCHEDULED_COLOR = '#E0A86F';

type Mode = 'total' | 'categories';

const MODE_OPTIONS: { value: Mode; label: string }[] = [
  { value: 'total', label: 'Total' },
  { value: 'categories', label: 'Por categoria' },
];

type Props = {
  points: ProjectionPoint[];
  byCategory: CategoryProjection;
  /** Category ids in project order, used to pick each category's color. */
  categoryIds: string[];
  /** Total the budget expects to spend (actual when known, else estimated). */
  projected: number;
  cap: number | null;
  currentMonth: string;
};

// Running total of installments month by month.
// "Total": scheduled vs paid against the cap. "Por categoria": one line per category.
export function ProjectionChart({ points, byCategory, categoryIds, projected, cap, currentMonth }: Props) {
  const theme = useTheme();
  const [mode, setMode] = useState<Mode>('total');

  const months = points.map((p) => p.month);
  const scheduled = points.at(-1)?.scheduledTotal ?? 0;
  const notContracted = Math.max(projected - scheduled, 0);
  const busiest = busiestMonth(points);
  const capLeft = cap !== null ? cap - projected : null;

  const totalSeries: LineSeries[] = [
    { key: 'scheduled', color: SCHEDULED_COLOR, values: points.map((p) => p.scheduledTotal), hollow: true },
    { key: 'paid', color: theme.accent, values: points.map((p) => p.paidTotal), area: true },
  ];
  const categorySeries: LineSeries[] = byCategory.series.map((s) => ({
    key: s.id,
    color: categoryColor(categoryIds, s.id),
    values: s.values,
  }));

  return (
    <Card style={styles.card}>
      <ThemedText type="smallBold">Projeção de pagamentos</ThemedText>

      {points.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Registre pagamentos com parcelas para ver a projeção mês a mês.
        </ThemedText>
      ) : (
        <>
          <Segmented options={MODE_OPTIONS} value={mode} onChange={setMode} />

          {mode === 'total' ? (
            <>
              <LineChart
                months={months}
                series={totalSeries}
                reference={cap !== null ? { value: cap, color: theme.danger } : null}
                currentMonth={currentMonth}
              />
              <View style={styles.legend}>
                <Legend color={SCHEDULED_COLOR} label="Programado" />
                <Legend color={theme.accent} label="Pago" />
                {cap !== null && <Legend color={theme.danger} label="Teto" dashed />}
              </View>
              <View style={styles.insights}>
                <Insight text={`Até ${formatMonth(months.at(-1)!)}: ${formatCurrency(scheduled)} em parcelas.`} />
                {notContracted > 0 && (
                  <Insight text={`${formatCurrency(notContracted)} do previsto ainda não tem pagamento registrado.`} />
                )}
                {busiest && busiest.due > 0 && (
                  <Insight text={`Mês mais pesado: ${formatMonth(busiest.month)}, com ${formatCurrency(busiest.due)}.`} />
                )}
                {capLeft !== null && (
                  <Insight
                    text={
                      capLeft >= 0
                        ? `Sobram ${formatCurrency(capLeft)} até o teto.`
                        : `O previsto passa o teto em ${formatCurrency(-capLeft)}.`
                    }
                    isWarning={capLeft < 0}
                  />
                )}
              </View>
            </>
          ) : (
            <>
              <LineChart months={byCategory.months} series={categorySeries} currentMonth={currentMonth} />
              <View style={styles.categoryLegend}>
                {byCategory.series.map((s) => (
                  <View key={s.id} style={styles.categoryRow}>
                    <Legend color={categoryColor(categoryIds, s.id)} label={s.name} />
                    <ThemedText type="small" themeColor="textSecondary">
                      {formatCurrency(s.values.at(-1) ?? 0)}
                    </ThemedText>
                  </View>
                ))}
              </View>
              <ThemedText type="small" themeColor="textSecondary">
                Total acumulado das parcelas de cada categoria até {formatMonth(byCategory.months.at(-1)!)}.
              </ThemedText>
            </>
          )}
        </>
      )}
    </Card>
  );
}

function Legend({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendLine, { backgroundColor: color }, dashed && styles.legendDashed]} />
      <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
        {label}
      </ThemedText>
    </View>
  );
}

function Insight({ text, isWarning }: { text: string; isWarning?: boolean }) {
  return (
    <ThemedText type="small" themeColor={isWarning ? 'danger' : 'text'}>
      • {text}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, flexShrink: 1 },
  legendLine: { width: 16, height: 3, borderRadius: 2 },
  legendDashed: { width: 10 },
  categoryLegend: { gap: Spacing.one },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  insights: { gap: Spacing.one },
});

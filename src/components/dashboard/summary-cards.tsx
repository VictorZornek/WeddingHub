import { StyleSheet, View } from 'react-native';

import { CapBar } from '@/components/budget/cap-bar';
import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { capUsage, type Totals } from '@/features/budget/totals';
import { formatCurrency, formatPercent } from '@/lib/format';

type Props = {
  totals: Totals;
  /** Money already paid in installments. */
  paid: number;
  cap: number | null;
};

// Four numbers at a glance: estimated, committed, paid and what is left to pay.
export function SummaryCards({ totals, paid, cap }: Props) {
  const remaining = Math.max(totals.projected - paid, 0);
  const usage = capUsage(totals.projected, cap);
  const paidShare = totals.projected > 0 ? paid / totals.projected : 0;

  return (
    <View style={styles.wrapper}>
      <Card variant="accent" style={styles.hero}>
        <ThemedText type="small" themeColor="onAccentSecondary">
          Falta pagar
        </ThemedText>
        <ThemedText type="subtitle" themeColor="onAccent">
          {formatCurrency(remaining)}
        </ThemedText>
        <CapBar usage={Math.min(paidShare, 1)} onAccent />
        <ThemedText type="small" themeColor="onAccentSecondary">
          {formatPercent(paidShare)} do previsto já foi pago
        </ThemedText>
      </Card>

      <View style={styles.grid}>
        <Tile label="Estimado" value={totals.estimated} />
        <Tile label="Previsto" value={totals.projected} hint="real ou estimado" />
        <Tile label="Pago" value={paid} />
        <Tile
          label="Teto"
          value={cap}
          hint={usage === null ? 'sem teto' : usage > 1 ? 'ultrapassado' : `${formatPercent(usage)} usado`}
          isWarning={usage !== null && usage > 1}
        />
      </View>
    </View>
  );
}

type TileProps = { label: string; value: number | null; hint?: string; isWarning?: boolean };

function Tile({ label, value, hint, isWarning }: TileProps) {
  return (
    <Card style={styles.tile}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold">{value === null ? '—' : formatCurrency(value)}</ThemedText>
      {hint && (
        <ThemedText type="small" themeColor={isWarning ? 'danger' : 'textSecondary'} style={styles.hint}>
          {hint}
        </ThemedText>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.three },
  hero: { gap: Spacing.one },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  tile: { flexBasis: '46%', flexGrow: 1, gap: Spacing.half },
  hint: { fontSize: 12, lineHeight: 16 },
});

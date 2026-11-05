import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { STATUS_LABELS } from '@/features/budget/items';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency } from '@/lib/format';
import type { BudgetItem } from '@/types/database';

type Props = {
  item: BudgetItem;
  onPress: () => void;
  isLast: boolean;
};

export function ItemRow({ item, onPress, isLast }: Props) {
  const theme = useTheme();
  const isClosed = item.status === 'closed';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <View style={styles.main}>
        <ThemedText type="small">{item.name}</ThemedText>
        <View
          style={[
            styles.badge,
            { backgroundColor: isClosed ? theme.accent : theme.accentSoft },
          ]}>
          <ThemedText type="small" themeColor={isClosed ? 'onAccent' : 'textSecondary'} style={styles.badgeText}>
            {STATUS_LABELS[item.status]}
          </ThemedText>
        </View>
      </View>
      <View style={styles.values}>
        <ThemedText type="smallBold">
          {item.estimated_amount !== null ? formatCurrency(item.estimated_amount) : '—'}
        </ThemedText>
        {item.actual_amount !== null && (
          <ThemedText type="small" themeColor="textSecondary">
            Real {formatCurrency(item.actual_amount)}
          </ThemedText>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  main: { flex: 1, gap: Spacing.one, alignItems: 'flex-start' },
  badge: { borderRadius: 999, paddingHorizontal: Spacing.two, paddingVertical: Spacing.half },
  badgeText: { fontSize: 12, lineHeight: 16 },
  values: { alignItems: 'flex-end' },
  pressed: { opacity: 0.6 },
});

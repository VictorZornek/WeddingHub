import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDateTime } from '@/lib/date';
import type { Reminder } from '@/types/database';

type Props = {
  reminder: Reminder;
  isLast: boolean;
  /** Current time in ms, passed in so the row stays a pure render. */
  now: number;
  onToggle: () => void;
  onPress: () => void;
};

export function ReminderRow({ reminder, isLast, now, onToggle, onPress }: Props) {
  const theme = useTheme();
  const date = new Date(reminder.remind_at);
  const isLate = !reminder.done && date.getTime() < now;

  return (
    <View
      style={[
        styles.row,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
      ]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: reminder.done }}
        accessibilityLabel={`Concluir ${reminder.title}`}
        hitSlop={8}
        onPress={onToggle}
        style={[
          styles.check,
          reminder.done
            ? { backgroundColor: theme.accent, borderColor: theme.accent }
            : { borderColor: isLate ? theme.danger : theme.border },
        ]}>
        {reminder.done && <SymbolView name="checkmark" size={14} tintColor={theme.onAccent} />}
      </Pressable>

      <Pressable onPress={onPress} style={({ pressed }) => [styles.text, pressed && styles.pressed]}>
        <ThemedText
          type="small"
          themeColor={reminder.done ? 'textSecondary' : 'text'}
          style={reminder.done && styles.doneTitle}>
          {reminder.title}
        </ThemedText>
        <ThemedText type="small" themeColor={isLate ? 'danger' : 'textSecondary'}>
          {isLate ? 'Atrasado · ' : ''}
          {formatDateTime(date)}
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.three },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
  doneTitle: { textDecorationLine: 'line-through' },
  pressed: { opacity: 0.6 },
});

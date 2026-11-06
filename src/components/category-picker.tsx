import { Pressable, StyleSheet, View } from 'react-native';

import { chipLook } from '@/components/chip-look';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { CategoryOption } from '@/features/vendors/vendors';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  options: CategoryOption[];
  value: string | null;
  onChange: (id: string | null) => void;
};

// Wrapping chips to pick one category. Tap the selected one again to clear it.
export function CategoryPicker({ options, value, onChange }: Props) {
  const theme = useTheme();
  const showProject = new Set(options.map((o) => o.project)).size > 1;

  return (
    <View style={styles.wrap}>
      {options.map((option) => {
        const isSelected = option.id === value;
        const look = chipLook(theme, isSelected);
        return (
          <Pressable
            key={option.id}
            onPress={() => onChange(isSelected ? null : option.id)}
            style={[styles.chip, look.container]}>
            <ThemedText type="small" themeColor={look.textColor}>
              {option.name}
              {showProject && option.project !== 'Casamento' && option.project ? ` · ${option.project}` : ''}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { borderRadius: 999, paddingVertical: Spacing.one + 2, paddingHorizontal: Spacing.three },
});

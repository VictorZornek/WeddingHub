import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

// Small caption above a form field.
export function FieldLabel({ label, children }: PropsWithChildren<{ label: string }>) {
  return (
    <View style={styles.block}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: Spacing.one },
});

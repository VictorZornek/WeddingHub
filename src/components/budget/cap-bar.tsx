import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

// Thin progress bar: how much of the spending cap is used. Turns red when over.
export function CapBar({ usage }: { usage: number }) {
  const theme = useTheme();
  const isOver = usage > 1;
  return (
    <View style={[styles.track, { backgroundColor: theme.track }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${Math.min(usage, 1) * 100}%`,
            backgroundColor: isOver ? theme.danger : theme.accent,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
});

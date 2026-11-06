import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type Props = { usage: number };

// Thin progress bar: how much of the spending cap is used. Turns red when over.
export function CapBar({ usage }: Props) {
  const theme = useTheme();
  const isOver = usage > 1;
  const fill = isOver ? theme.danger : theme.accent;
  const track = theme.track;

  return (
    <View style={[styles.track, { backgroundColor: track }]}>
      <View style={[styles.fill, { width: `${Math.min(usage, 1) * 100}%`, backgroundColor: fill }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
});

import { StyleSheet, View, type ViewProps } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = ViewProps & {
  /** "accent" is the soft highlight card with a tinted line; "plain" is the white card with a thin line. */
  variant?: 'plain' | 'accent' | 'soft';
};

export function Card({ variant = 'plain', style, ...rest }: Props) {
  const theme = useTheme();
  const look =
    variant === 'accent'
      ? { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder, borderWidth: 1 }
      : variant === 'soft'
        ? { backgroundColor: theme.accentSoft }
        : { backgroundColor: theme.backgroundElement, borderColor: theme.border, borderWidth: 1 };

  return <View style={[styles.card, look, style]} {...rest} />;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.three + 4,
    padding: Spacing.three,
    borderCurve: 'continuous',
  },
});

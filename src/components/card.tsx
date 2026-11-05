import { StyleSheet, View, type ViewProps } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = ViewProps & {
  /** "accent" is the colored highlight card; "plain" is the white card with a hairline. */
  variant?: 'plain' | 'accent' | 'soft';
};

export function Card({ variant = 'plain', style, ...rest }: Props) {
  const theme = useTheme();
  const look =
    variant === 'accent'
      ? { backgroundColor: theme.accent }
      : variant === 'soft'
        ? { backgroundColor: theme.accentSoft }
        : { backgroundColor: theme.backgroundElement, borderColor: theme.border, borderWidth: StyleSheet.hairlineWidth };

  return <View style={[styles.card, look, style]} {...rest} />;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.three + 4,
    padding: Spacing.three,
    borderCurve: 'continuous',
  },
});

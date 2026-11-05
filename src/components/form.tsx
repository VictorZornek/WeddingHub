import { ActivityIndicator, Pressable, StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Shared form pieces so every screen looks the same.

export function TextField(props: TextInputProps) {
  const theme = useTheme();
  return (
    <TextInput
      placeholderTextColor={theme.textSecondary}
      {...props}
      style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }, props.style]}
    />
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  isLoading?: boolean;
};

export function PrimaryButton({ label, onPress, isLoading }: ButtonProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={isLoading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme.text },
        (pressed || isLoading) && styles.pressed,
      ]}>
      {isLoading ? (
        <ActivityIndicator color={theme.background} />
      ) : (
        <ThemedText type="smallBold" style={{ color: theme.background }}>
          {label}
        </ThemedText>
      )}
    </Pressable>
  );
}

export function LinkButton({ label, onPress }: ButtonProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function FormMessage({ error, info }: { error?: string | null; info?: string | null }) {
  if (error) return <ThemedText style={[styles.center, styles.error]}>{error}</ThemedText>;
  if (info) return <ThemedText style={styles.center}>{info}</ThemedText>;
  return null;
}

const styles = StyleSheet.create({
  input: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  button: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  pressed: { opacity: 0.7 },
  center: { textAlign: 'center' },
  error: { color: '#d93f0b' },
});

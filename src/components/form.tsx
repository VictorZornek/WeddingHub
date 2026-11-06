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
      selectionColor={theme.link}
      {...props}
      style={[
        styles.input,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border, color: theme.text },
        props.style,
      ]}
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
        { backgroundColor: theme.accentSoft, borderColor: theme.accent },
        (pressed || isLoading) && styles.pressed,
      ]}>
      {isLoading ? (
        <ActivityIndicator color={theme.link} />
      ) : (
        <ThemedText type="smallBold" themeColor="link">
          {label}
        </ThemedText>
      )}
    </Pressable>
  );
}

export function LinkButton({ label, onPress, destructive }: ButtonProps & { destructive?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedText type="small" themeColor={destructive ? 'danger' : 'link'} style={styles.center}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function FormMessage({ error, info }: { error?: string | null; info?: string | null }) {
  if (error) {
    return (
      <ThemedText themeColor="danger" style={styles.center}>
        {error}
      </ThemedText>
    );
  }
  if (info) return <ThemedText style={styles.center}>{info}</ThemedText>;
  return null;
}

const styles = StyleSheet.create({
  input: {
    borderRadius: Spacing.three,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  button: {
    borderRadius: Spacing.three,
    borderWidth: 1,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  pressed: { opacity: 0.7 },
  center: { textAlign: 'center' },
});

import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

type Mode = 'signIn' | 'signUp';

// Maps the most common Supabase auth errors to Portuguese.
function toFriendlyError(message: string) {
  if (message.includes('Invalid login credentials')) return 'Email ou senha incorretos.';
  if (message.includes('Email not confirmed')) return 'Confirme seu email antes de entrar.';
  if (message.includes('User already registered')) return 'Já existe uma conta com esse email.';
  if (message.includes('Password should be at least')) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (message.includes('valid email') || message.includes('invalid format')) return 'Email inválido.';
  return message;
}

export default function SignInScreen() {
  const theme = useTheme();
  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const isSignUp = mode === 'signUp';

  async function handleSubmit() {
    setError(null);
    setInfo(null);

    if (!email.trim() || !password) {
      setError('Preencha email e senha.');
      return;
    }

    setIsSubmitting(true);
    const credentials = { email: email.trim(), password };

    if (isSignUp) {
      const { data, error: signUpError } = await supabase.auth.signUp(credentials);
      if (signUpError) setError(toFriendlyError(signUpError.message));
      // No session means Supabase is waiting for email confirmation.
      else if (!data.session) setInfo('Conta criada! Confirme pelo link enviado ao seu email e depois entre.');
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword(credentials);
      if (signInError) setError(toFriendlyError(signInError.message));
    }

    setIsSubmitting(false);
  }

  function toggleMode() {
    setMode(isSignUp ? 'signIn' : 'signUp');
    setError(null);
    setInfo(null);
  }

  const inputStyle = [
    styles.input,
    { backgroundColor: theme.backgroundElement, color: theme.text },
  ];

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ThemedText type="subtitle" style={styles.center}>
            Wedding Hub
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.center}>
            {isSignUp ? 'Crie sua conta' : 'Entre na sua conta'}
          </ThemedText>

          <TextInput
            style={inputStyle}
            placeholder="Email"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={inputStyle}
            placeholder="Senha"
            placeholderTextColor={theme.textSecondary}
            secureTextEntry
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            textContentType={isSignUp ? 'newPassword' : 'password'}
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleSubmit}
          />

          {error && <ThemedText style={[styles.center, styles.error]}>{error}</ThemedText>}
          {info && <ThemedText style={styles.center}>{info}</ThemedText>}

          <Pressable
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: theme.text },
              (pressed || isSubmitting) && styles.pressed,
            ]}>
            {isSubmitting ? (
              <ActivityIndicator color={theme.background} />
            ) : (
              <ThemedText style={{ color: theme.background }} type="smallBold">
                {isSignUp ? 'Criar conta' : 'Entrar'}
              </ThemedText>
            )}
          </Pressable>

          <Pressable onPress={toggleMode} style={({ pressed }) => pressed && styles.pressed}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
              {isSignUp ? 'Já tem conta? Entrar' : 'Não tem conta? Criar conta'}
            </ThemedText>
          </Pressable>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  center: { textAlign: 'center' },
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
  error: { color: '#d93f0b' },
});

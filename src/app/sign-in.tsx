import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormMessage, LinkButton, PrimaryButton, TextField } from '@/components/form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
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

          <TextField
            placeholder="Email"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
          />
          <TextField
            placeholder="Senha"
            secureTextEntry
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            textContentType={isSignUp ? 'newPassword' : 'password'}
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleSubmit}
          />

          <FormMessage error={error} info={info} />

          <PrimaryButton
            label={isSignUp ? 'Criar conta' : 'Entrar'}
            onPress={handleSubmit}
            isLoading={isSubmitting}
          />
          <LinkButton
            label={isSignUp ? 'Já tem conta? Entrar' : 'Não tem conta? Criar conta'}
            onPress={toggleMode}
          />
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
});

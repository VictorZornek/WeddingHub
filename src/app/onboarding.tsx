import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormMessage, LinkButton, PrimaryButton, TextField } from '@/components/form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useWedding } from '@/providers/wedding-provider';

type Mode = 'create' | 'join';

// Turns "DD/MM/AAAA" into "AAAA-MM-DD". Returns null when invalid.
function parseBrazilianDate(value: string): string | null {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  const isRealDate =
    date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day);
  return isRealDate ? `${year}-${month}-${day}` : null;
}

// Adds the slashes while typing: 15032027 -> 15/03/2027.
function maskDate(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export default function OnboardingScreen() {
  const { refresh } = useWedding();
  const [mode, setMode] = useState<Mode>('create');
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCreate = mode === 'create';

  async function handleCreate() {
    if (!name.trim()) {
      setError('Dê um nome para o casamento.');
      return;
    }
    const weddingDate = date ? parseBrazilianDate(date) : null;
    if (date && !weddingDate) {
      setError('Data inválida. Use DD/MM/AAAA.');
      return;
    }

    setIsSubmitting(true);
    const { error: insertError } = await supabase
      .from('weddings')
      .insert({ name: name.trim(), wedding_date: weddingDate });

    if (insertError) {
      setError('Não foi possível criar o casamento. Tente de novo.');
      setIsSubmitting(false);
      return;
    }
    await refresh();
  }

  async function handleJoin() {
    if (code.trim().length !== 6) {
      setError('O código tem 6 caracteres.');
      return;
    }

    setIsSubmitting(true);
    const { error: joinError } = await supabase.rpc('join_wedding', { p_code: code });

    if (joinError) {
      setError(
        joinError.message.includes('invalid invite code')
          ? 'Código não encontrado. Confira com quem te convidou.'
          : 'Não foi possível entrar no casamento. Tente de novo.'
      );
      setIsSubmitting(false);
      return;
    }
    await refresh();
  }

  function toggleMode() {
    setMode(isCreate ? 'join' : 'create');
    setError(null);
  }

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ThemedText type="subtitle" style={styles.center}>
            {isCreate ? 'Novo casamento' : 'Entrar com convite'}
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.center}>
            {isCreate
              ? 'Depois você recebe um código para convidar a outra pessoa.'
              : 'Digite o código que a outra pessoa te passou.'}
          </ThemedText>

          {isCreate ? (
            <>
              <TextField placeholder="Nome (ex.: Nosso casamento)" value={name} onChangeText={setName} />
              <TextField
                placeholder="Data (DD/MM/AAAA) — opcional"
                keyboardType="number-pad"
                value={date}
                onChangeText={(value) => setDate(maskDate(value))}
              />
            </>
          ) : (
            <TextField
              placeholder="Código de convite"
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={6}
              value={code}
              onChangeText={(value) => setCode(value.toUpperCase())}
            />
          )}

          <FormMessage error={error} />

          <PrimaryButton
            label={isCreate ? 'Criar casamento' : 'Entrar'}
            onPress={isCreate ? handleCreate : handleJoin}
            isLoading={isSubmitting}
          />
          <LinkButton
            label={isCreate ? 'Recebi um código de convite' : 'Quero criar um casamento novo'}
            onPress={toggleMode}
          />
          <LinkButton label="Sair da conta" onPress={() => supabase.auth.signOut()} />
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

import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { FieldLabel } from '@/components/field-label';
import { FormMessage, LinkButton, PrimaryButton, TextField } from '@/components/form';
import { Spacing } from '@/constants/theme';
import { syncNotifications } from '@/features/notifications/sync';
import {
  createReminder,
  deleteReminder,
  fetchReminder,
  updateReminder,
} from '@/features/reminders/reminders';
import { useTheme } from '@/hooks/use-theme';
import { confirmDestructive } from '@/lib/confirm';
import {
  combineDateTime,
  maskDate,
  maskTime,
  parseBrazilianDate,
  toBrazilianDate,
  toTime,
} from '@/lib/date';
import { useWedding } from '@/providers/wedding-provider';

// Create (id = "new") or edit a reminder.
export default function ReminderScreen() {
  const theme = useTheme();
  const { wedding } = useWedding();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';

  const [isLoading, setIsLoading] = useState(!isNew);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNew) return;
    let isActive = true;
    fetchReminder(id).then((reminder) => {
      if (!isActive) return;
      if (reminder) {
        const when = new Date(reminder.remind_at);
        setTitle(reminder.title);
        setDate(toBrazilianDate(when));
        setTime(toTime(when));
        setNotes(reminder.notes ?? '');
      } else {
        setError('Lembrete não encontrado.');
      }
      setIsLoading(false);
    });
    return () => {
      isActive = false;
    };
  }, [id, isNew]);

  async function handleSave() {
    setError(null);
    if (!title.trim()) return setError('Escreva o que você quer lembrar.');
    const isoDate = parseBrazilianDate(date);
    if (!isoDate) return setError('Data inválida. Use DD/MM/AAAA.');
    const when = combineDateTime(isoDate, time);
    if (!when) return setError('Hora inválida. Use HH:MM, por exemplo 09:30.');
    if (isNew && when.getTime() <= Date.now()) return setError('Escolha uma data e hora no futuro.');

    const input = { title: title.trim(), notes: notes.trim() || null, remind_at: when.toISOString() };

    setIsSaving(true);
    const { error: saveError } = isNew
      ? await createReminder(wedding!.id, input)
      : await updateReminder(id, input);
    setIsSaving(false);

    if (saveError) return setError('Não foi possível salvar. Tente de novo.');
    syncNotifications(wedding!.id);
    router.back();
  }

  async function handleDelete() {
    const confirmed = await confirmDestructive('Apagar lembrete?', `"${title}" será removido.`, 'Apagar');
    if (!confirmed) return;
    const { error: deleteError } = await deleteReminder(id);
    if (deleteError) return setError('Não foi possível apagar. Tente de novo.');
    syncNotifications(wedding!.id);
    router.back();
  }

  return (
    <>
      <Stack.Screen options={{ title: isNew ? 'Novo lembrete' : 'Editar lembrete' }} />
      {isLoading ? (
        <ActivityIndicator color={theme.link} style={styles.loading} />
      ) : (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <FieldLabel label="Lembrar de">
              <TextField placeholder="Ligar para o buffet" value={title} onChangeText={setTitle} />
            </FieldLabel>

            <View style={styles.twoColumns}>
              <View style={styles.flex}>
                <FieldLabel label="Data">
                  <TextField
                    placeholder="DD/MM/AAAA"
                    keyboardType="number-pad"
                    value={date}
                    onChangeText={(value) => setDate(maskDate(value))}
                  />
                </FieldLabel>
              </View>
              <View style={styles.flex}>
                <FieldLabel label="Hora">
                  <TextField
                    placeholder="09:00"
                    keyboardType="number-pad"
                    value={time}
                    onChangeText={(value) => setTime(maskTime(value))}
                  />
                </FieldLabel>
              </View>
            </View>

            <FieldLabel label="Observações">
              <TextField
                placeholder="Detalhes que vão aparecer na notificação"
                multiline
                value={notes}
                onChangeText={setNotes}
                style={styles.notes}
              />
            </FieldLabel>

            <FormMessage error={error} />
            <PrimaryButton label="Salvar" onPress={handleSave} isLoading={isSaving} />
            {!isNew && <LinkButton label="Apagar lembrete" onPress={handleDelete} destructive />}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { marginTop: Spacing.five },
  content: { gap: Spacing.three, padding: Spacing.three, paddingBottom: Spacing.six },
  twoColumns: { flexDirection: 'row', gap: Spacing.three },
  notes: { minHeight: 88, textAlignVertical: 'top' },
});

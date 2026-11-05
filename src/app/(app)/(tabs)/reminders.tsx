import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { FormMessage, LinkButton, PrimaryButton } from '@/components/form';
import { ReminderRow } from '@/components/reminders/reminder-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { syncNotifications } from '@/features/notifications/sync';
import { fetchReminders, updateReminder } from '@/features/reminders/reminders';
import { useTheme } from '@/hooks/use-theme';
import { useWedding } from '@/providers/wedding-provider';
import type { Reminder } from '@/types/database';

export default function RemindersScreen() {
  const theme = useTheme();
  const { wedding } = useWedding();
  const weddingId = wedding?.id;
  const [reminders, setReminders] = useState<Reminder[] | null>(null);
  // Refreshed on every load, used to mark late reminders.
  const [now, setNow] = useState(0);
  const [showDone, setShowDone] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!weddingId) return;
    const result = await fetchReminders(weddingId);
    setError(result === null ? 'Não foi possível carregar os lembretes.' : null);
    setNow(Date.now());
    setReminders(result ?? []);
  }, [weddingId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleRefresh() {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  }

  // Updates the list right away; reverts if saving fails.
  async function handleToggle(reminder: Reminder) {
    if (!reminders || !weddingId) return;
    const before = reminders;
    setReminders(reminders.map((r) => (r.id === reminder.id ? { ...r, done: !r.done } : r)));
    const { error: saveError } = await updateReminder(reminder.id, { done: !reminder.done });
    if (saveError) {
      setReminders(before);
      setError('Não foi possível atualizar o lembrete.');
      return;
    }
    syncNotifications(weddingId);
  }

  const pending = (reminders ?? []).filter((r) => !r.done);
  const done = (reminders ?? []).filter((r) => r.done).reverse();

  function renderList(list: Reminder[]) {
    return (
      <Card style={styles.list}>
        {list.map((reminder, index) => (
          <ReminderRow
            key={reminder.id}
            reminder={reminder}
            isLast={index === list.length - 1}
            now={now}
            onToggle={() => handleToggle(reminder)}
            onPress={() => router.push({ pathname: '/reminder/[id]', params: { id: reminder.id } })}
          />
        ))}
      </Card>
    );
  }

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.link} />
          }>
          <ThemedText type="subtitle">Lembretes</ThemedText>

          <PrimaryButton
            label="Novo lembrete"
            onPress={() => router.push({ pathname: '/reminder/[id]', params: { id: 'new' } })}
          />
          <FormMessage error={error} />

          {reminders === null && <ActivityIndicator color={theme.link} style={styles.loading} />}

          {reminders !== null && pending.length === 0 && (
            <ThemedText themeColor="textSecondary" style={styles.empty}>
              Nenhum lembrete pendente. Crie um para receber uma notificação no dia e hora certos.
            </ThemedText>
          )}
          {pending.length > 0 && renderList(pending)}

          {done.length > 0 && (
            <>
              <LinkButton
                label={showDone ? 'Esconder concluídos' : `Ver concluídos (${done.length})`}
                onPress={() => setShowDone(!showDone)}
              />
              {showDone && renderList(done)}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  loading: { marginTop: Spacing.five },
  list: { paddingVertical: 0 },
  empty: { textAlign: 'center', marginTop: Spacing.three },
});

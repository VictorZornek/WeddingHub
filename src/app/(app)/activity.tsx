import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { LinkButton } from '@/components/form';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import {
  ACTIVITY_PAGE_SIZE,
  describeActivity,
  describeActor,
  describeChanges,
  fetchActivity,
  type Activity,
} from '@/features/activity/activity';
import { useTheme } from '@/hooks/use-theme';
import { toBrazilianDate, toIsoDate, toTime } from '@/lib/date';
import { useSession } from '@/providers/session-provider';
import { useWedding } from '@/providers/wedding-provider';

function dayTitle(date: Date) {
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (toIsoDate(date) === toIsoDate(today)) return 'Hoje';
  if (toIsoDate(date) === toIsoDate(yesterday)) return 'Ontem';
  return toBrazilianDate(date);
}

// Who created, changed or deleted budget items, payments, installments, reminders and caps.
export default function ActivityScreen() {
  const theme = useTheme();
  const { session } = useSession();
  const { wedding } = useWedding();
  const weddingId = wedding?.id;
  const userId = session?.user.id;
  const [entries, setEntries] = useState<Activity[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!weddingId) return;
      fetchActivity(weddingId).then((result) => {
        setError(result === null);
        setEntries(result ?? []);
        setHasMore((result?.length ?? 0) === ACTIVITY_PAGE_SIZE);
      });
    }, [weddingId])
  );

  async function loadMore() {
    if (!weddingId || !entries?.length) return;
    setIsLoadingMore(true);
    const result = await fetchActivity(weddingId, entries[entries.length - 1].id);
    setIsLoadingMore(false);
    if (!result) return;
    setEntries([...entries, ...result]);
    setHasMore(result.length === ACTIVITY_PAGE_SIZE);
  }

  const days = useMemo(() => {
    const byDay = new Map<string, Activity[]>();
    for (const entry of entries ?? []) {
      const key = dayTitle(new Date(entry.created_at));
      byDay.set(key, [...(byDay.get(key) ?? []), entry]);
    }
    return [...byDay.entries()];
  }, [entries]);

  return (
    <>
      <Stack.Screen options={{ title: 'Histórico' }} />
      <ScrollView contentContainerStyle={styles.content}>
        {entries === null && <ActivityIndicator color={theme.link} style={styles.loading} />}

        {error && (
          <ThemedText themeColor="danger" style={styles.empty}>
            Não foi possível carregar o histórico.
          </ThemedText>
        )}

        {entries !== null && !error && entries.length === 0 && (
          <ThemedText themeColor="textSecondary" style={styles.empty}>
            Aqui aparece quem criou, alterou ou apagou itens, pagamentos, parcelas, lembretes e
            limites de gastos.
          </ThemedText>
        )}

        {days.map(([day, list]) => (
          <View key={day} style={styles.group}>
            <ThemedText type="smallBold">{day}</ThemedText>
            <Card style={styles.list}>
              {list.map((entry, index) => (
                <View
                  key={entry.id}
                  style={[
                    styles.row,
                    index < list.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: theme.border,
                    },
                  ]}>
                  <ThemedText type="small">{describeActivity(entry)}</ThemedText>
                  {describeChanges(entry).map((line) => (
                    <ThemedText key={line} type="small" themeColor="textSecondary">
                      {line}
                    </ThemedText>
                  ))}
                  <ThemedText type="small" themeColor="textSecondary">
                    {describeActor(entry, userId)} · {toTime(new Date(entry.created_at))}
                  </ThemedText>
                </View>
              ))}
            </Card>
          </View>
        ))}

        {hasMore &&
          (isLoadingMore ? (
            <ActivityIndicator color={theme.link} />
          ) : (
            <LinkButton label="Carregar mais" onPress={loadMore} />
          ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { gap: Spacing.three, padding: Spacing.three, paddingBottom: Spacing.six },
  loading: { marginTop: Spacing.five },
  empty: { textAlign: 'center', marginTop: Spacing.three },
  group: { gap: Spacing.two },
  list: { paddingVertical: 0 },
  row: { gap: Spacing.half, paddingVertical: Spacing.three },
});

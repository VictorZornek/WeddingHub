import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { FormMessage, PrimaryButton, TextField } from '@/components/form';
import { Segmented } from '@/components/segmented';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { fetchGuests, setGuestRsvp } from '@/features/guests/guests';
import {
  groupGuests,
  RSVP_LABELS,
  summarizeGuests,
  type Guest,
  type Rsvp,
} from '@/features/guests/summary';
import { useTheme } from '@/hooks/use-theme';
import { useWedding } from '@/providers/wedding-provider';

type Filter = 'all' | Rsvp;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'confirmed', label: 'Confirmados' },
  { value: 'pending', label: 'Aguardando' },
  { value: 'declined', label: 'Não vão' },
];

// Tapping the status chip cycles pending -> confirmed -> declined -> pending.
const NEXT_RSVP: Record<Rsvp, Rsvp> = { pending: 'confirmed', confirmed: 'declined', declined: 'pending' };

function normalize(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export default function GuestsScreen() {
  const theme = useTheme();
  const { wedding } = useWedding();
  const weddingId = wedding?.id;
  const [guests, setGuests] = useState<Guest[] | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!weddingId) return;
    const result = await fetchGuests(weddingId);
    setError(result === null ? 'Não foi possível carregar os convidados.' : null);
    setGuests(result ?? []);
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
  async function handleCycleRsvp(guest: Guest) {
    if (!guests) return;
    const before = guests;
    const next = NEXT_RSVP[guest.rsvp];
    setGuests(guests.map((g) => (g.id === guest.id ? { ...g, rsvp: next } : g)));
    const { error: saveError } = await setGuestRsvp(guest.id, next);
    if (saveError) {
      setGuests(before);
      setError('Não foi possível atualizar a confirmação.');
    }
  }

  const summary = summarizeGuests(guests ?? []);
  const groups = useMemo(() => {
    const query = normalize(search.trim());
    const visible = (guests ?? []).filter(
      (g) =>
        (filter === 'all' || g.rsvp === filter) &&
        (!query || normalize(`${g.name} ${g.group_name ?? ''}`).includes(query))
    );
    return groupGuests(visible);
  }, [guests, filter, search]);

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.link} />
          }>
          <ThemedText type="subtitle">Convidados</ThemedText>

          <Card variant="accent" style={styles.summary}>
            <Stat label="Pessoas" value={summary.people} />
            <Stat label="Confirmadas" value={summary.confirmedPeople} />
            <Stat label="Aguardando" value={summary.pendingPeople} />
            <Stat label="Não vão" value={summary.declinedPeople} />
          </Card>

          <PrimaryButton
            label="Novo convidado"
            onPress={() => router.push({ pathname: '/guest/[id]', params: { id: 'new' } })}
          />
          <FormMessage error={error} />

          {guests === null && <ActivityIndicator color={theme.link} style={styles.loading} />}

          {guests !== null && guests.length === 0 && (
            <ThemedText themeColor="textSecondary" style={styles.empty}>
              Adicione os convidados para acompanhar quem já confirmou presença.
            </ThemedText>
          )}

          {guests !== null && guests.length > 0 && (
            <>
              <Segmented options={FILTERS} value={filter} onChange={setFilter} />
              <TextField placeholder="Buscar por nome ou grupo" value={search} onChangeText={setSearch} />
              <ThemedText type="small" themeColor="textSecondary">
                Toque no status para mudar: Aguardando → Confirmado → Não vai.
              </ThemedText>

              {groups.length === 0 && (
                <ThemedText themeColor="textSecondary" style={styles.empty}>
                  Ninguém encontrado com esse filtro.
                </ThemedText>
              )}

              {groups.map((group) => (
                <View key={group.name} style={styles.group}>
                  <ThemedText type="smallBold">
                    {group.name} · {group.guests.reduce((sum, g) => sum + 1 + g.companions, 0)} pessoas
                  </ThemedText>
                  <Card style={styles.list}>
                    {group.guests.map((guest, index) => (
                      <View
                        key={guest.id}
                        style={[
                          styles.row,
                          index < group.guests.length - 1 && {
                            borderBottomWidth: StyleSheet.hairlineWidth,
                            borderBottomColor: theme.border,
                          },
                        ]}>
                        <Pressable
                          onPress={() => router.push({ pathname: '/guest/[id]', params: { id: guest.id } })}
                          style={({ pressed }) => [styles.flex, pressed && styles.pressed]}>
                          <ThemedText type="small">{guest.name}</ThemedText>
                          {guest.companions > 0 && (
                            <ThemedText type="small" themeColor="textSecondary">
                              + {guest.companions} {guest.companions === 1 ? 'acompanhante' : 'acompanhantes'}
                            </ThemedText>
                          )}
                        </Pressable>
                        <RsvpChip rsvp={guest.rsvp} onPress={() => handleCycleRsvp(guest)} />
                      </View>
                    ))}
                  </Card>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <ThemedText type="smallBold" themeColor="onAccent" style={styles.statValue}>
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="onAccentSecondary" style={styles.statLabel}>
        {label}
      </ThemedText>
    </View>
  );
}

function RsvpChip({ rsvp, onPress }: { rsvp: Rsvp; onPress: () => void }) {
  const theme = useTheme();
  const look =
    rsvp === 'confirmed'
      ? { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder, color: 'link' as const }
      : rsvp === 'declined'
        ? { backgroundColor: theme.backgroundElement, borderColor: theme.danger, color: 'danger' as const }
        : { backgroundColor: theme.backgroundElement, borderColor: theme.border, color: 'textSecondary' as const };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Status: ${RSVP_LABELS[rsvp]}. Toque para mudar.`}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: look.backgroundColor, borderColor: look.borderColor, borderWidth: 1 },
        pressed && styles.pressed,
      ]}>
      <ThemedText type="small" themeColor={look.color} style={styles.chipText}>
        {RSVP_LABELS[rsvp]}
      </ThemedText>
    </Pressable>
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
  empty: { textAlign: 'center', marginTop: Spacing.three },
  summary: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 22, lineHeight: 28 },
  statLabel: { fontSize: 12, lineHeight: 16 },
  group: { gap: Spacing.two },
  list: { paddingVertical: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.three },
  chip: { borderRadius: 999, paddingVertical: Spacing.one, paddingHorizontal: Spacing.three },
  chipText: { fontSize: 12, lineHeight: 16 },
  pressed: { opacity: 0.6 },
});

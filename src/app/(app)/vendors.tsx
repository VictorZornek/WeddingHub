import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { PrimaryButton, TextField } from '@/components/form';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { bestQuote, fetchVendors, type VendorWithQuotes } from '@/features/vendors/vendors';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency } from '@/lib/format';
import { useWedding } from '@/providers/wedding-provider';

function normalize(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

// All vendors, grouped by category, with their number of quotes and the lowest one.
export default function VendorsScreen() {
  const theme = useTheme();
  const { wedding } = useWedding();
  const weddingId = wedding?.id;
  const [vendors, setVendors] = useState<VendorWithQuotes[] | null>(null);
  const [search, setSearch] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (weddingId) fetchVendors(weddingId).then((result) => setVendors(result ?? []));
    }, [weddingId])
  );

  const groups = useMemo(() => {
    const query = normalize(search.trim());
    const filtered = (vendors ?? []).filter(
      (v) => !query || normalize(`${v.name} ${v.categories?.name ?? ''}`).includes(query)
    );
    const byCategory = new Map<string, VendorWithQuotes[]>();
    for (const vendor of filtered) {
      const key = vendor.categories?.name ?? 'Sem categoria';
      byCategory.set(key, [...(byCategory.get(key) ?? []), vendor]);
    }
    return [...byCategory.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [vendors, search]);

  return (
    <>
      <Stack.Screen options={{ title: 'Fornecedores' }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <PrimaryButton
          label="Novo fornecedor"
          onPress={() => router.push({ pathname: '/vendor/[id]', params: { id: 'new' } })}
        />

        {vendors === null && <ActivityIndicator color={theme.link} style={styles.loading} />}

        {vendors !== null && vendors.length > 0 && (
          <TextField placeholder="Buscar fornecedor ou categoria" value={search} onChangeText={setSearch} />
        )}

        {vendors !== null && vendors.length === 0 && (
          <ThemedText themeColor="textSecondary" style={styles.empty}>
            Cadastre os fornecedores que vocês estão cotando para comparar os preços depois.
          </ThemedText>
        )}

        {groups.map(([category, list]) => (
          <View key={category} style={styles.group}>
            <ThemedText type="smallBold">{category}</ThemedText>
            <Card style={styles.list}>
              {list.map((vendor, index) => {
                const best = bestQuote(vendor.quotes);
                const chosen = vendor.quotes.some((q) => q.status === 'chosen');
                return (
                  <Pressable
                    key={vendor.id}
                    onPress={() => router.push({ pathname: '/vendor/[id]', params: { id: vendor.id } })}
                    style={({ pressed }) => [
                      styles.row,
                      index < list.length - 1 && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: theme.border,
                      },
                      pressed && styles.pressed,
                    ]}>
                    <View style={styles.flex}>
                      <ThemedText type="small">{vendor.name}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {vendor.quotes.length === 0
                          ? 'Sem cotação'
                          : `${vendor.quotes.length} ${vendor.quotes.length === 1 ? 'cotação' : 'cotações'}`}
                        {chosen ? ' · escolhido' : ''}
                      </ThemedText>
                    </View>
                    {best && <ThemedText type="smallBold">{formatCurrency(best.amount)}</ThemedText>}
                  </Pressable>
                );
              })}
            </Card>
          </View>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: Spacing.three, padding: Spacing.three, paddingBottom: Spacing.six },
  loading: { marginTop: Spacing.five },
  empty: { textAlign: 'center', marginTop: Spacing.three },
  group: { gap: Spacing.two },
  list: { paddingVertical: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.three },
  pressed: { opacity: 0.6 },
});

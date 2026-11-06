import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { FormMessage, LinkButton, PrimaryButton } from '@/components/form';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import {
  cheapestId,
  chooseQuote,
  fetchComparison,
  type CategoryComparison,
  type ComparableQuote,
} from '@/features/vendors/choose';
import { QUOTE_STATUS_LABELS } from '@/features/vendors/vendors';
import { useTheme } from '@/hooks/use-theme';
import { todayIso } from '@/lib/date';
import { formatCurrency, formatDate } from '@/lib/format';

const CARD_WIDTH = 250;

// Quotes of one category side by side; picking one fills a budget item.
export default function CompareScreen() {
  const theme = useTheme();
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const [data, setData] = useState<CategoryComparison | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [picking, setPicking] = useState<ComparableQuote | null>(null);
  const [targetItemId, setTargetItemId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [today, setToday] = useState('');

  const load = useCallback(async () => {
    const result = await fetchComparison(categoryId);
    setData(result);
    setToday(todayIso());
    setIsLoading(false);
  }, [categoryId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleConfirm() {
    if (!picking) return;
    setError(null);
    setIsSaving(true);
    const { error: chooseError } = await chooseQuote(picking.id, targetItemId);
    setIsSaving(false);
    if (chooseError) return setError('Não foi possível escolher a cotação. Tente de novo.');
    setPicking(null);
    setTargetItemId(null);
    await load();
  }

  const cheapest = data ? cheapestId(data.quotes) : null;
  const cheapestAmount = data?.quotes.find((q) => q.id === cheapest)?.amount ?? 0;

  return (
    <>
      <Stack.Screen options={{ title: data ? `Cotações · ${data.name}` : 'Cotações' }} />
      <ScrollView contentContainerStyle={styles.content}>
        {isLoading && <ActivityIndicator color={theme.link} style={styles.loading} />}

        {data && data.quotes.length === 0 && (
          <View style={styles.emptyBlock}>
            <ThemedText themeColor="textSecondary" style={styles.center}>
              Nenhuma cotação nesta categoria ainda. Cadastre fornecedores e as cotações deles para comparar aqui.
            </ThemedText>
            <PrimaryButton label="Ir para fornecedores" onPress={() => router.push('/vendors')} />
          </View>
        )}

        {data && data.quotes.length > 0 && (
          <>
            <ThemedText type="small" themeColor="textSecondary">
              {data.quotes.length} {data.quotes.length === 1 ? 'cotação' : 'cotações'}, da mais barata para a mais cara.
              Arraste para o lado para comparar.
            </ThemedText>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cards}>
              {data.quotes.map((quote) => {
                const isCheapest = quote.id === cheapest;
                const isChosen = quote.status === 'chosen';
                const isExpired = !!quote.valid_until && quote.valid_until < today;
                const difference = quote.amount - cheapestAmount;
                return (
                  <Card
                    key={quote.id}
                    variant={isChosen ? 'soft' : 'plain'}
                    style={[
                      styles.quoteCard,
                      isChosen && { borderColor: theme.accent },
                      quote.status === 'rejected' && styles.rejected,
                    ]}>
                    <View style={styles.badges}>
                      {isChosen && <Badge label="Escolhida" strong />}
                      {isCheapest && !isChosen && <Badge label="Mais barata" />}
                      {quote.status === 'rejected' && <Badge label={QUOTE_STATUS_LABELS.rejected} />}
                    </View>

                    <ThemedText type="smallBold">{quote.vendors?.name ?? 'Fornecedor'}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {quote.description}
                    </ThemedText>
                    <ThemedText type="subtitle" style={styles.amount}>
                      {formatCurrency(quote.amount)}
                    </ThemedText>
                    {difference > 0 && (
                      <ThemedText type="small" themeColor="textSecondary">
                        +{formatCurrency(difference)} que a mais barata
                      </ThemedText>
                    )}

                    {quote.includes && (
                      <View style={styles.block}>
                        <ThemedText type="small" themeColor="textSecondary">
                          Inclui
                        </ThemedText>
                        <ThemedText type="small">{quote.includes}</ThemedText>
                      </View>
                    )}
                    {quote.valid_until && (
                      <ThemedText type="small" themeColor={isExpired ? 'danger' : 'textSecondary'}>
                        {isExpired ? 'Venceu em' : 'Válida até'} {formatDate(quote.valid_until)}
                      </ThemedText>
                    )}
                    {quote.notes && (
                      <ThemedText type="small" themeColor="textSecondary">
                        {quote.notes}
                      </ThemedText>
                    )}

                    <View style={styles.spacer} />
                    {!isChosen && (
                      <PrimaryButton
                        label="Escolher esta"
                        onPress={() => {
                          setPicking(quote);
                          setTargetItemId(null);
                        }}
                      />
                    )}
                    <LinkButton
                      label="Editar"
                      onPress={() =>
                        router.push({ pathname: '/quote/[id]', params: { id: quote.id, vendorId: quote.vendor_id } })
                      }
                    />
                  </Card>
                );
              })}
            </ScrollView>

            {picking && (
              <Card variant="soft" style={styles.picker}>
                <ThemedText type="smallBold">
                  Escolher {picking.vendors?.name} por {formatCurrency(picking.amount)}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Qual item do orçamento esta cotação vai preencher? O valor real e o fornecedor serão salvos nele,
                  e as outras cotações em aberto desta categoria serão descartadas.
                </ThemedText>
                <ItemOption
                  label={`Criar item novo: "${picking.description}"`}
                  selected={targetItemId === null}
                  onPress={() => setTargetItemId(null)}
                />
                {data.budget_items.map((item) => (
                  <ItemOption
                    key={item.id}
                    label={item.name}
                    selected={targetItemId === item.id}
                    onPress={() => setTargetItemId(item.id)}
                  />
                ))}
                <FormMessage error={error} />
                <PrimaryButton label="Confirmar escolha" onPress={handleConfirm} isLoading={isSaving} />
                <LinkButton label="Cancelar" onPress={() => setPicking(null)} />
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </>
  );
}

function Badge({ label, strong }: { label: string; strong?: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: theme.accentSoft, borderWidth: 1, borderColor: strong ? theme.accent : theme.accentBorder },
      ]}>
      <ThemedText type={strong ? 'smallBold' : 'small'} themeColor="link" style={styles.badgeText}>
        {label}
      </ThemedText>
    </View>
  );
}

function ItemOption({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.option,
        { borderColor: selected ? theme.link : theme.border, backgroundColor: theme.backgroundElement },
      ]}>
      <View style={[styles.radio, { borderColor: selected ? theme.link : theme.border }]}>
        {selected && <View style={[styles.radioDot, { backgroundColor: theme.link }]} />}
      </View>
      <ThemedText type="small" style={styles.optionText}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { gap: Spacing.three, padding: Spacing.three, paddingBottom: Spacing.six },
  loading: { marginTop: Spacing.five },
  emptyBlock: { gap: Spacing.three, marginTop: Spacing.three },
  center: { textAlign: 'center' },
  cards: { gap: Spacing.three, paddingRight: Spacing.three },
  quoteCard: { width: CARD_WIDTH, gap: Spacing.one },
  rejected: { opacity: 0.55 },
  badges: { flexDirection: 'row', gap: Spacing.one, minHeight: 22 },
  badge: { borderRadius: 999, paddingHorizontal: Spacing.two, paddingVertical: Spacing.half },
  badgeText: { fontSize: 12, lineHeight: 16 },
  amount: { fontSize: 26, lineHeight: 34 },
  block: { gap: Spacing.half, marginTop: Spacing.one },
  spacer: { flex: 1, minHeight: Spacing.two },
  picker: { gap: Spacing.two },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 9, height: 9, borderRadius: 5 },
  optionText: { flex: 1 },
});

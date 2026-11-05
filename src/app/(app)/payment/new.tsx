import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { FieldLabel } from '@/components/field-label';
import { FormMessage, LinkButton, PrimaryButton, TextField } from '@/components/form';
import { MoneyField } from '@/components/money-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import {
  createPayment,
  fetchItemOptions,
  planInstallments,
  type ItemOption,
} from '@/features/payments/payments';
import { syncNotifications } from '@/features/notifications/sync';
import { useTheme } from '@/hooks/use-theme';
import { maskDate, parseBrazilianDate } from '@/lib/date';
import { formatCurrency, formatDate, parseMoneyInput } from '@/lib/format';
import { useWedding } from '@/providers/wedding-provider';

const MAX_INSTALLMENTS = 60;

function normalize(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export default function NewPaymentScreen() {
  const theme = useTheme();
  const { wedding } = useWedding();
  const params = useLocalSearchParams<{ budgetItemId?: string }>();

  const [description, setDescription] = useState('');
  const [total, setTotal] = useState('');
  const [count, setCount] = useState('1');
  const [firstDue, setFirstDue] = useState('');
  const [items, setItems] = useState<ItemOption[]>([]);
  const [itemId, setItemId] = useState<string | null>(params.budgetItemId ?? null);
  const [search, setSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!wedding) return;
    let isActive = true;
    fetchItemOptions(wedding.id).then((options) => {
      if (isActive) setItems(options);
    });
    return () => {
      isActive = false;
    };
  }, [wedding]);

  const selectedItem = items.find((i) => i.id === itemId) ?? null;
  const matches = useMemo(() => {
    const query = normalize(search.trim());
    if (!query) return [];
    return items.filter((i) => normalize(`${i.name} ${i.category}`).includes(query)).slice(0, 6);
  }, [items, search]);

  // Live preview of the installments while the form is filled.
  const totalValue = parseMoneyInput(total);
  const countValue = Number(count);
  const firstDueIso = parseBrazilianDate(firstDue);
  const isCountValid = Number.isInteger(countValue) && countValue >= 1 && countValue <= MAX_INSTALLMENTS;
  const plan =
    totalValue && !Number.isNaN(totalValue) && isCountValid && firstDueIso
      ? planInstallments(totalValue, countValue, firstDueIso)
      : null;

  async function handleSave() {
    setError(null);
    if (!description.trim()) return setError('Descreva o pagamento, por exemplo "Contrato do buffet".');
    if (!totalValue || Number.isNaN(totalValue)) return setError('Informe o valor total.');
    if (!isCountValid) return setError(`O número de parcelas vai de 1 a ${MAX_INSTALLMENTS}.`);
    if (!firstDueIso) return setError('Data do 1º vencimento inválida. Use DD/MM/AAAA.');

    setIsSaving(true);
    const ok = await createPayment(wedding!.id, {
      description: description.trim(),
      budgetItemId: itemId,
      total: totalValue,
      installments: plan!,
    });
    setIsSaving(false);

    if (!ok) return setError('Não foi possível salvar. Tente de novo.');
    syncNotifications(wedding!.id);
    router.back();
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Novo pagamento' }} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <FieldLabel label="Descrição">
            <TextField
              placeholder="Contrato do buffet"
              value={description}
              onChangeText={setDescription}
            />
          </FieldLabel>

          <FieldLabel label="Item do orçamento (opcional)">
            {selectedItem ? (
              <Card variant="soft" style={styles.selected}>
                <View style={styles.flex}>
                  <ThemedText type="smallBold">{selectedItem.name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {selectedItem.category}
                  </ThemedText>
                </View>
                <LinkButton label="Trocar" onPress={() => setItemId(null)} />
              </Card>
            ) : (
              <>
                <TextField placeholder="Buscar item: buffet, fotografia..." value={search} onChangeText={setSearch} />
                {matches.map((option) => (
                  <Pressable
                    key={option.id}
                    onPress={() => {
                      setItemId(option.id);
                      setSearch('');
                    }}
                    style={({ pressed }) => [
                      styles.option,
                      { borderColor: theme.border },
                      pressed && styles.pressed,
                    ]}>
                    <ThemedText type="small">{option.name}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {option.category}
                    </ThemedText>
                  </Pressable>
                ))}
              </>
            )}
          </FieldLabel>

          <FieldLabel label="Valor total (R$)">
            <MoneyField placeholder="25.920,00" value={total} onChangeText={setTotal} />
          </FieldLabel>

          <View style={styles.twoColumns}>
            <View style={styles.flex}>
              <FieldLabel label="Parcelas">
                <TextField keyboardType="number-pad" maxLength={2} value={count} onChangeText={setCount} />
              </FieldLabel>
            </View>
            <View style={styles.flex}>
              <FieldLabel label="1º vencimento">
                <TextField
                  placeholder="DD/MM/AAAA"
                  keyboardType="number-pad"
                  value={firstDue}
                  onChangeText={(value) => setFirstDue(maskDate(value))}
                />
              </FieldLabel>
            </View>
          </View>

          {plan && (
            <Card style={styles.preview}>
              <ThemedText type="smallBold">
                {plan.length === 1 ? 'Pagamento único' : `${plan.length} parcelas mensais`}
              </ThemedText>
              {plan.map((installment) => (
                <View key={installment.number} style={styles.previewRow}>
                  <ThemedText type="small" themeColor="textSecondary">
                    {installment.number}ª · {formatDate(installment.due_date)}
                  </ThemedText>
                  <ThemedText type="small">{formatCurrency(installment.amount, { cents: true })}</ThemedText>
                </View>
              ))}
            </Card>
          )}

          <FormMessage error={error} />
          <PrimaryButton label="Salvar pagamento" onPress={handleSave} isLoading={isSaving} />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: Spacing.three, padding: Spacing.three, paddingBottom: Spacing.six },
  selected: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.two,
  },
  pressed: { opacity: 0.6 },
  twoColumns: { flexDirection: 'row', gap: Spacing.three },
  preview: { gap: Spacing.one },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between' },
});

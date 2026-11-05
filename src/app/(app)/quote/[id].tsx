import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import { CategoryPicker } from '@/components/category-picker';
import { FieldLabel } from '@/components/field-label';
import { FormMessage, LinkButton, PrimaryButton, TextField } from '@/components/form';
import { MoneyField } from '@/components/money-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import {
  createQuote,
  deleteQuote,
  fetchCategoryOptions,
  fetchQuote,
  QUOTE_STATUS_LABELS,
  updateQuote,
  type CategoryOption,
  type QuoteStatus,
} from '@/features/vendors/vendors';
import { useTheme } from '@/hooks/use-theme';
import { confirmDestructive } from '@/lib/confirm';
import { maskDate, parseBrazilianDate } from '@/lib/date';
import { formatDate, parseMoneyInput, toMoneyInput } from '@/lib/format';
import { useWedding } from '@/providers/wedding-provider';

// Create (id = "new", needs vendorId) or edit a quote.
export default function QuoteScreen() {
  const theme = useTheme();
  const { wedding } = useWedding();
  const params = useLocalSearchParams<{ id: string; vendorId: string; categoryId?: string }>();
  const isNew = params.id === 'new';

  const [isLoading, setIsLoading] = useState(!isNew);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(params.categoryId || null);
  const [amount, setAmount] = useState('');
  const [includes, setIncludes] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<QuoteStatus>('open');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!wedding) return;
    fetchCategoryOptions(wedding.id).then(setCategories);
  }, [wedding]);

  useEffect(() => {
    if (isNew) return;
    let isActive = true;
    fetchQuote(params.id).then((quote) => {
      if (!isActive) return;
      if (quote) {
        setDescription(quote.description);
        setCategoryId(quote.category_id);
        setAmount(toMoneyInput(quote.amount));
        setIncludes(quote.includes ?? '');
        setValidUntil(quote.valid_until ? formatDate(quote.valid_until) : '');
        setNotes(quote.notes ?? '');
        setStatus(quote.status);
      } else {
        setError('Cotação não encontrada.');
      }
      setIsLoading(false);
    });
    return () => {
      isActive = false;
    };
  }, [params.id, isNew]);

  async function handleSave() {
    setError(null);
    const amountValue = parseMoneyInput(amount);
    const validIso = validUntil ? parseBrazilianDate(validUntil) : null;
    if (!description.trim()) return setError('Descreva a cotação, por exemplo "Pacote completo 150 pessoas".');
    if (amountValue === null || Number.isNaN(amountValue)) return setError('Informe o valor da cotação.');
    if (validUntil && !validIso) return setError('Validade inválida. Use DD/MM/AAAA.');
    if (!categoryId) return setError('Escolha a categoria, para poder comparar com outras cotações.');

    const input = {
      description: description.trim(),
      category_id: categoryId,
      amount: amountValue,
      includes: includes.trim() || null,
      valid_until: validIso,
      notes: notes.trim() || null,
    };

    setIsSaving(true);
    const { error: saveError } = isNew
      ? await createQuote(wedding!.id, params.vendorId, input)
      : await updateQuote(params.id, input);
    setIsSaving(false);

    if (saveError) return setError('Não foi possível salvar. Tente de novo.');
    router.back();
  }

  async function handleDelete() {
    const confirmed = await confirmDestructive('Apagar cotação?', `"${description}" será removida.`, 'Apagar');
    if (!confirmed) return;
    const { error: deleteError } = await deleteQuote(params.id);
    if (deleteError) return setError('Não foi possível apagar. Tente de novo.');
    router.back();
  }

  return (
    <>
      <Stack.Screen options={{ title: isNew ? 'Nova cotação' : 'Editar cotação' }} />
      {isLoading ? (
        <ActivityIndicator color={theme.link} style={styles.loading} />
      ) : (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {!isNew && (
              <ThemedText type="small" themeColor={status === 'chosen' ? 'link' : 'textSecondary'}>
                Situação: {QUOTE_STATUS_LABELS[status]}
              </ThemedText>
            )}

            <FieldLabel label="Descrição">
              <TextField
                placeholder="Pacote completo 150 pessoas"
                value={description}
                onChangeText={setDescription}
              />
            </FieldLabel>

            <FieldLabel label="Valor (R$)">
              <MoneyField placeholder="0,00" value={amount} onChangeText={setAmount} />
            </FieldLabel>

            <FieldLabel label="Categoria">
              <CategoryPicker options={categories} value={categoryId} onChange={setCategoryId} />
            </FieldLabel>

            <FieldLabel label="O que está incluso">
              <TextField
                placeholder="Entrada, prato principal, sobremesa, garçons..."
                multiline
                value={includes}
                onChangeText={setIncludes}
                style={styles.multiline}
              />
            </FieldLabel>

            <FieldLabel label="Válida até (opcional)">
              <TextField
                placeholder="DD/MM/AAAA"
                keyboardType="number-pad"
                value={validUntil}
                onChangeText={(value) => setValidUntil(maskDate(value))}
              />
            </FieldLabel>

            <FieldLabel label="Observações">
              <TextField
                placeholder="Condições de pagamento, desconto à vista..."
                multiline
                value={notes}
                onChangeText={setNotes}
                style={styles.multiline}
              />
            </FieldLabel>

            <FormMessage error={error} />
            <PrimaryButton label="Salvar cotação" onPress={handleSave} isLoading={isSaving} />
            {!isNew && <LinkButton label="Apagar cotação" onPress={handleDelete} destructive />}
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
  multiline: { minHeight: 88, textAlignVertical: 'top' },
});

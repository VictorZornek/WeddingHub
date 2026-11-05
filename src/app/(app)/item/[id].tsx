import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import { FieldLabel } from '@/components/field-label';
import { FormMessage, LinkButton, PrimaryButton, TextField } from '@/components/form';
import { MoneyField } from '@/components/money-field';
import { Segmented } from '@/components/segmented';
import { Spacing } from '@/constants/theme';
import {
  createItem,
  deleteItem,
  fetchItem,
  STATUS_LABELS,
  STATUS_ORDER,
  updateItem,
} from '@/features/budget/items';
import { useTheme } from '@/hooks/use-theme';
import { confirmDestructive } from '@/lib/confirm';
import { parseMoneyInput, toMoneyInput } from '@/lib/format';
import { useWedding } from '@/providers/wedding-provider';
import type { BudgetItemStatus } from '@/types/database';

const STATUS_OPTIONS = STATUS_ORDER.map((value) => ({ value, label: STATUS_LABELS[value] }));

// Create (id = "new", needs categoryId) or edit a budget item.
export default function ItemScreen() {
  const theme = useTheme();
  const { wedding } = useWedding();
  const { id, categoryId } = useLocalSearchParams<{ id: string; categoryId?: string }>();
  const isNew = id === 'new';

  const [isLoading, setIsLoading] = useState(!isNew);
  const [name, setName] = useState('');
  const [estimated, setEstimated] = useState('');
  const [actual, setActual] = useState('');
  const [status, setStatus] = useState<BudgetItemStatus>('to_define');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNew) return;
    let isActive = true;
    fetchItem(id).then((item) => {
      if (!isActive) return;
      if (item) {
        setName(item.name);
        setEstimated(toMoneyInput(item.estimated_amount));
        setActual(toMoneyInput(item.actual_amount));
        setStatus(item.status);
        setNotes(item.notes ?? '');
      } else {
        setError('Item não encontrado.');
      }
      setIsLoading(false);
    });
    return () => {
      isActive = false;
    };
  }, [id, isNew]);

  async function handleSave() {
    setError(null);
    const estimatedValue = parseMoneyInput(estimated);
    const actualValue = parseMoneyInput(actual);

    if (!name.trim()) return setError('Dê um nome para o item.');
    if (Number.isNaN(estimatedValue) || Number.isNaN(actualValue)) {
      return setError('Valor inválido. Use só números, como 1.500,00.');
    }

    const input = {
      name: name.trim(),
      estimated_amount: estimatedValue,
      actual_amount: actualValue,
      status,
      notes: notes.trim() || null,
    };

    setIsSaving(true);
    const { error: saveError } = isNew
      ? await createItem(wedding!.id, categoryId!, input)
      : await updateItem(id, input);
    setIsSaving(false);

    if (saveError) return setError('Não foi possível salvar. Tente de novo.');
    router.back();
  }

  async function handleDelete() {
    const confirmed = await confirmDestructive(
      'Apagar item?',
      `"${name}" será removido do orçamento.`,
      'Apagar'
    );
    if (!confirmed) return;

    const { error: deleteError } = await deleteItem(id);
    if (deleteError) return setError('Não foi possível apagar. Tente de novo.');
    router.back();
  }

  return (
    <>
      <Stack.Screen options={{ title: isNew ? 'Novo item' : 'Editar item' }} />
      {isLoading ? (
        <ActivityIndicator color={theme.link} style={styles.loading} />
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <FieldLabel label="Nome">
              <TextField placeholder="Buffet completo" value={name} onChangeText={setName} />
            </FieldLabel>

            <FieldLabel label="Valor estimado (R$)">
              <MoneyField placeholder="0,00" value={estimated} onChangeText={setEstimated} />
            </FieldLabel>

            <FieldLabel label="Valor real (R$)">
              <MoneyField
                placeholder="Preencha quando fechar o contrato"
                value={actual}
                onChangeText={setActual}
              />
            </FieldLabel>

            <FieldLabel label="Status">
              <Segmented options={STATUS_OPTIONS} value={status} onChange={setStatus} />
            </FieldLabel>

            <FieldLabel label="Observações">
              <TextField
                placeholder="Fornecedor, o que está incluso..."
                multiline
                value={notes}
                onChangeText={setNotes}
                style={styles.notes}
              />
            </FieldLabel>

            <FormMessage error={error} />

            <PrimaryButton label="Salvar" onPress={handleSave} isLoading={isSaving} />
            {!isNew && <LinkButton label="Apagar item" onPress={handleDelete} destructive />}
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
  notes: { minHeight: 88, textAlignVertical: 'top' },
});

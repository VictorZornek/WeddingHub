import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { FieldLabel } from '@/components/field-label';
import { FormMessage, PrimaryButton } from '@/components/form';
import { MoneyField } from '@/components/money-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { fetchCaps, saveCaps, type CapsData } from '@/features/budget/caps';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency, parseMoneyInput, toMoneyInput } from '@/lib/format';

// Edit the overall cap of a project and the cap of each of its categories.
export default function CapsScreen() {
  const theme = useTheme();
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const [data, setData] = useState<CapsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [projectCap, setProjectCap] = useState('');
  const [categoryCaps, setCategoryCaps] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    fetchCaps(projectId).then((result) => {
      if (!isActive) return;
      setData(result);
      if (result) {
        setProjectCap(toMoneyInput(result.spending_cap));
        setCategoryCaps(
          Object.fromEntries(result.categories.map((c) => [c.id, toMoneyInput(c.spending_cap)]))
        );
      }
      setIsLoading(false);
    });
    return () => {
      isActive = false;
    };
  }, [projectId]);

  const parsedCategoryCaps = (data?.categories ?? []).map((c) => ({
    id: c.id,
    spending_cap: parseMoneyInput(categoryCaps[c.id] ?? ''),
  }));
  const sumOfCategoryCaps = parsedCategoryCaps.reduce(
    (sum, c) => sum + (Number.isNaN(c.spending_cap) ? 0 : (c.spending_cap ?? 0)),
    0
  );

  async function handleSave() {
    setError(null);
    const projectValue = parseMoneyInput(projectCap);
    if (Number.isNaN(projectValue) || parsedCategoryCaps.some((c) => Number.isNaN(c.spending_cap))) {
      return setError('Algum valor está inválido. Use só números, como 10.000,00.');
    }

    setIsSaving(true);
    const ok = await saveCaps(projectId, projectValue, parsedCategoryCaps);
    setIsSaving(false);

    if (!ok) return setError('Não foi possível salvar. Tente de novo.');
    router.back();
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Tetos de gastos' }} />
      {isLoading ? (
        <ActivityIndicator color={theme.link} style={styles.loading} />
      ) : !data ? (
        <ThemedText themeColor="danger" style={styles.message}>
          Não foi possível carregar os tetos.
        </ThemedText>
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Card variant="soft" style={styles.block}>
              <FieldLabel label={`Teto geral — ${data.name} (R$)`}>
                <MoneyField placeholder="Sem teto" value={projectCap} onChangeText={setProjectCap} />
              </FieldLabel>
              {sumOfCategoryCaps > 0 && (
                <ThemedText type="small" themeColor="textSecondary">
                  Soma dos tetos das categorias: {formatCurrency(sumOfCategoryCaps)}
                </ThemedText>
              )}
            </Card>

            <ThemedText type="smallBold">Por categoria</ThemedText>
            <Card style={styles.block}>
              {data.categories.map((category) => (
                <View key={category.id}>
                  <FieldLabel label={category.name}>
                    <MoneyField
                      placeholder="Sem teto"
                      value={categoryCaps[category.id] ?? ''}
                      onChangeText={(value) =>
                        setCategoryCaps((current) => ({ ...current, [category.id]: value }))
                      }
                    />
                  </FieldLabel>
                </View>
              ))}
            </Card>

            <ThemedText type="small" themeColor="textSecondary">
              Deixe em branco para não ter teto.
            </ThemedText>

            <FormMessage error={error} />
            <PrimaryButton label="Salvar tetos" onPress={handleSave} isLoading={isSaving} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { marginTop: Spacing.five },
  message: { padding: Spacing.three },
  content: { gap: Spacing.three, padding: Spacing.three, paddingBottom: Spacing.six },
  block: { gap: Spacing.three },
});

import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { ItemRow } from '@/components/budget/item-row';
import { Card } from '@/components/card';
import { LinkButton, PrimaryButton } from '@/components/form';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { fetchCategory, type CategoryDetail } from '@/features/budget/items';
import { sumItems } from '@/features/budget/totals';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency } from '@/lib/format';

export default function CategoryScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [category, setCategory] = useState<CategoryDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Reload every time the screen is shown, so edits made in the item screen appear.
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      fetchCategory(id).then((result) => {
        if (!isActive) return;
        setCategory(result);
        setIsLoading(false);
      });
      return () => {
        isActive = false;
      };
    }, [id])
  );

  const totals = category ? sumItems(category.budget_items) : null;

  return (
    <>
      <Stack.Screen options={{ title: category?.name ?? '' }} />
      <ScrollView contentContainerStyle={styles.content}>
        {isLoading && <ActivityIndicator color={theme.link} style={styles.loading} />}
        {!isLoading && !category && (
          <ThemedText themeColor="danger">Não foi possível carregar a categoria.</ThemedText>
        )}

        {category && totals && (
          <>
            <Card variant="accent" style={styles.summary}>
              <Summary label="Estimado" value={totals.estimated} />
              <Summary label="Real" value={totals.actual} />
              <Summary label="Previsto" value={totals.projected} />
            </Card>

            <Card style={styles.list}>
              {category.budget_items.length === 0 ? (
                <ThemedText themeColor="textSecondary" style={styles.empty}>
                  Adicione o primeiro item desta categoria.
                </ThemedText>
              ) : (
                category.budget_items.map((item, index) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    isLast={index === category.budget_items.length - 1}
                    onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
                  />
                ))
              )}
            </Card>

            <PrimaryButton
              label="Adicionar item"
              onPress={() =>
                router.push({ pathname: '/item/[id]', params: { id: 'new', categoryId: category.id } })
              }
            />
            <LinkButton
              label="Comparar cotações desta categoria"
              onPress={() =>
                router.push({ pathname: '/compare/[categoryId]', params: { categoryId: category.id } })
              }
            />
          </>
        )}
      </ScrollView>
    </>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.summaryValue}>
      <ThemedText type="small" themeColor="onAccentSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold" themeColor="onAccent">
        {formatCurrency(value)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: Spacing.three, padding: Spacing.three, paddingBottom: Spacing.six },
  loading: { marginTop: Spacing.five },
  summary: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryValue: { gap: Spacing.half },
  list: { paddingVertical: 0 },
  empty: { paddingVertical: Spacing.three },
});

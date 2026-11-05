import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { Card } from '@/components/card';
import { CategoryPicker } from '@/components/category-picker';
import { FieldLabel } from '@/components/field-label';
import { FormMessage, LinkButton, PrimaryButton, TextField } from '@/components/form';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import {
  createVendor,
  deleteVendor,
  fetchCategoryOptions,
  fetchVendor,
  QUOTE_STATUS_LABELS,
  updateVendor,
  type CategoryOption,
  type Quote,
} from '@/features/vendors/vendors';
import { useTheme } from '@/hooks/use-theme';
import { confirmDestructive } from '@/lib/confirm';
import { formatCurrency, formatDate } from '@/lib/format';
import { useWedding } from '@/providers/wedding-provider';

// Create (id = "new") or edit a vendor, and see its quotes.
export default function VendorScreen() {
  const theme = useTheme();
  const { wedding } = useWedding();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';

  const [isLoading, setIsLoading] = useState(!isNew);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!wedding) return;
    fetchCategoryOptions(wedding.id).then(setCategories);
  }, [wedding]);

  // Reload on focus so quotes added in the quote screen show up.
  useFocusEffect(
    useCallback(() => {
      if (isNew) return;
      let isActive = true;
      fetchVendor(id).then((vendor) => {
        if (!isActive) return;
        if (vendor) {
          setName(vendor.name);
          setCategoryId(vendor.category_id);
          setContactName(vendor.contact_name ?? '');
          setPhone(vendor.phone ?? '');
          setEmail(vendor.email ?? '');
          setNotes(vendor.notes ?? '');
          setQuotes([...vendor.quotes].sort((a, b) => a.amount - b.amount));
        } else {
          setError('Fornecedor não encontrado.');
        }
        setIsLoading(false);
      });
      return () => {
        isActive = false;
      };
    }, [id, isNew])
  );

  function input() {
    return {
      name: name.trim(),
      category_id: categoryId,
      contact_name: contactName.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      notes: notes.trim() || null,
    };
  }

  async function handleSave() {
    setError(null);
    if (!name.trim()) return setError('Dê um nome para o fornecedor.');
    setIsSaving(true);
    if (isNew) {
      const { data, error: saveError } = await createVendor(wedding!.id, input());
      setIsSaving(false);
      if (saveError || !data) return setError('Não foi possível salvar. Tente de novo.');
      // Stay on the new vendor so quotes can be added right away.
      router.replace({ pathname: '/vendor/[id]', params: { id: data.id } });
      return;
    }
    const { error: saveError } = await updateVendor(id, input());
    setIsSaving(false);
    if (saveError) return setError('Não foi possível salvar. Tente de novo.');
    router.back();
  }

  async function handleDelete() {
    const confirmed = await confirmDestructive(
      'Apagar fornecedor?',
      `"${name}" e as cotações dele serão removidos.`,
      'Apagar'
    );
    if (!confirmed) return;
    const { error: deleteError } = await deleteVendor(id);
    if (deleteError) return setError('Não foi possível apagar. Tente de novo.');
    router.back();
  }

  return (
    <>
      <Stack.Screen options={{ title: isNew ? 'Novo fornecedor' : name || 'Fornecedor' }} />
      {isLoading ? (
        <ActivityIndicator color={theme.link} style={styles.loading} />
      ) : (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {!isNew && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <ThemedText type="smallBold">Cotações</ThemedText>
                  <LinkButton
                    label="Nova cotação"
                    onPress={() =>
                      router.push({
                        pathname: '/quote/[id]',
                        params: { id: 'new', vendorId: id, categoryId: categoryId ?? '' },
                      })
                    }
                  />
                </View>
                {quotes.length === 0 ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    Nenhuma cotação ainda.
                  </ThemedText>
                ) : (
                  <Card style={styles.list}>
                    {quotes.map((quote, index) => (
                      <Pressable
                        key={quote.id}
                        onPress={() =>
                          router.push({ pathname: '/quote/[id]', params: { id: quote.id, vendorId: id } })
                        }
                        style={({ pressed }) => [
                          styles.row,
                          index < quotes.length - 1 && {
                            borderBottomWidth: StyleSheet.hairlineWidth,
                            borderBottomColor: theme.border,
                          },
                          pressed && styles.pressed,
                        ]}>
                        <View style={styles.flex}>
                          <ThemedText type="small">{quote.description}</ThemedText>
                          <ThemedText
                            type="small"
                            themeColor={quote.status === 'chosen' ? 'link' : 'textSecondary'}>
                            {QUOTE_STATUS_LABELS[quote.status]}
                            {quote.valid_until ? ` · válida até ${formatDate(quote.valid_until)}` : ''}
                          </ThemedText>
                        </View>
                        <ThemedText type="smallBold">{formatCurrency(quote.amount)}</ThemedText>
                      </Pressable>
                    ))}
                  </Card>
                )}
              </View>
            )}

            <FieldLabel label="Nome">
              <TextField placeholder="Buffet Sabor & Arte" value={name} onChangeText={setName} />
            </FieldLabel>

            <FieldLabel label="Categoria">
              <CategoryPicker options={categories} value={categoryId} onChange={setCategoryId} />
            </FieldLabel>

            <FieldLabel label="Contato">
              <TextField placeholder="Nome de quem atende" value={contactName} onChangeText={setContactName} />
            </FieldLabel>

            <View style={styles.twoColumns}>
              <View style={styles.flex}>
                <FieldLabel label="Telefone">
                  <TextField placeholder="(11) 99999-9999" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
                </FieldLabel>
              </View>
              <View style={styles.flex}>
                <FieldLabel label="Email">
                  <TextField
                    placeholder="contato@..."
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </FieldLabel>
              </View>
            </View>

            <FieldLabel label="Observações">
              <TextField
                placeholder="Indicação, pontos fortes, o que perguntar..."
                multiline
                value={notes}
                onChangeText={setNotes}
                style={styles.notes}
              />
            </FieldLabel>

            <FormMessage error={error} />
            <PrimaryButton label={isNew ? 'Salvar e adicionar cotações' : 'Salvar'} onPress={handleSave} isLoading={isSaving} />
            {!isNew && <LinkButton label="Apagar fornecedor" onPress={handleDelete} destructive />}
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
  section: { gap: Spacing.two },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  list: { paddingVertical: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.three },
  pressed: { opacity: 0.6 },
  twoColumns: { flexDirection: 'row', gap: Spacing.three },
  notes: { minHeight: 88, textAlignVertical: 'top' },
});

import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { FieldLabel } from '@/components/field-label';
import { FormMessage, LinkButton, PrimaryButton, TextField } from '@/components/form';
import { Segmented } from '@/components/segmented';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { createGuest, deleteGuest, fetchGuest, fetchGuests, updateGuest } from '@/features/guests/guests';
import { RSVP_LABELS, type Rsvp } from '@/features/guests/summary';
import { useTheme } from '@/hooks/use-theme';
import { confirmDestructive } from '@/lib/confirm';
import { useWedding } from '@/providers/wedding-provider';

const RSVP_OPTIONS: { value: Rsvp; label: string }[] = [
  { value: 'pending', label: RSVP_LABELS.pending },
  { value: 'confirmed', label: RSVP_LABELS.confirmed },
  { value: 'declined', label: RSVP_LABELS.declined },
];
const SUGGESTED_GROUPS = ['Família', 'Amigos', 'Trabalho', 'Padrinhos'];
const MAX_COMPANIONS = 20;

// Create (id = "new") or edit a guest.
export default function GuestScreen() {
  const theme = useTheme();
  const { wedding } = useWedding();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';

  const [isLoading, setIsLoading] = useState(!isNew);
  const [name, setName] = useState('');
  const [group, setGroup] = useState('');
  const [companions, setCompanions] = useState(0);
  const [rsvp, setRsvp] = useState<Rsvp>('pending');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [knownGroups, setKnownGroups] = useState<string[]>(SUGGESTED_GROUPS);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Groups already used plus a few suggestions, for one-tap picking.
  useEffect(() => {
    if (!wedding) return;
    fetchGuests(wedding.id).then((guests) => {
      const used = (guests ?? []).map((g) => g.group_name?.trim()).filter((g): g is string => !!g);
      setKnownGroups([...new Set([...used, ...SUGGESTED_GROUPS])]);
    });
  }, [wedding]);

  useEffect(() => {
    if (isNew) return;
    let isActive = true;
    fetchGuest(id).then((guest) => {
      if (!isActive) return;
      if (guest) {
        setName(guest.name);
        setGroup(guest.group_name ?? '');
        setCompanions(guest.companions);
        setRsvp(guest.rsvp);
        setPhone(guest.phone ?? '');
        setNotes(guest.notes ?? '');
      } else {
        setError('Convidado não encontrado.');
      }
      setIsLoading(false);
    });
    return () => {
      isActive = false;
    };
  }, [id, isNew]);

  async function handleSave() {
    setError(null);
    if (!name.trim()) return setError('Escreva o nome do convidado.');
    const input = {
      name: name.trim(),
      group_name: group.trim() || null,
      companions,
      rsvp,
      phone: phone.trim() || null,
      notes: notes.trim() || null,
    };
    setIsSaving(true);
    const { error: saveError } = isNew ? await createGuest(wedding!.id, input) : await updateGuest(id, input);
    setIsSaving(false);
    if (saveError) return setError('Não foi possível salvar. Tente de novo.');
    router.back();
  }

  async function handleDelete() {
    const confirmed = await confirmDestructive('Remover convidado?', `"${name}" sai da lista.`, 'Remover');
    if (!confirmed) return;
    const { error: deleteError } = await deleteGuest(id);
    if (deleteError) return setError('Não foi possível remover. Tente de novo.');
    router.back();
  }

  return (
    <>
      <Stack.Screen options={{ title: isNew ? 'Novo convidado' : 'Editar convidado' }} />
      {isLoading ? (
        <ActivityIndicator color={theme.link} style={styles.loading} />
      ) : (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <FieldLabel label="Nome">
              <TextField placeholder="Nome e sobrenome" value={name} onChangeText={setName} />
            </FieldLabel>

            <FieldLabel label="Grupo">
              <TextField placeholder="Família, Amigos..." value={group} onChangeText={setGroup} />
              <View style={styles.chips}>
                {knownGroups.map((option) => {
                  const isSelected = option === group.trim();
                  return (
                    <Pressable
                      key={option}
                      onPress={() => setGroup(isSelected ? '' : option)}
                      style={[styles.chip, { backgroundColor: isSelected ? theme.accent : theme.accentSoft }]}>
                      <ThemedText type="small" themeColor={isSelected ? 'onAccent' : 'textSecondary'}>
                        {option}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </FieldLabel>

            <FieldLabel label="Acompanhantes">
              <View style={styles.stepper}>
                <StepButton
                  label="−"
                  onPress={() => setCompanions(Math.max(0, companions - 1))}
                  disabled={companions === 0}
                />
                <ThemedText type="smallBold" style={styles.stepValue}>
                  {companions}
                </ThemedText>
                <StepButton
                  label="+"
                  onPress={() => setCompanions(Math.min(MAX_COMPANIONS, companions + 1))}
                  disabled={companions === MAX_COMPANIONS}
                />
                <ThemedText type="small" themeColor="textSecondary">
                  {1 + companions} {companions === 0 ? 'pessoa' : 'pessoas'} no total
                </ThemedText>
              </View>
            </FieldLabel>

            <FieldLabel label="Presença">
              <Segmented options={RSVP_OPTIONS} value={rsvp} onChange={setRsvp} />
            </FieldLabel>

            <FieldLabel label="Telefone (opcional)">
              <TextField placeholder="(11) 99999-9999" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
            </FieldLabel>

            <FieldLabel label="Observações">
              <TextField
                placeholder="Restrição alimentar, criança, mesa..."
                multiline
                value={notes}
                onChangeText={setNotes}
                style={styles.notes}
              />
            </FieldLabel>

            <FormMessage error={error} />
            <PrimaryButton label="Salvar" onPress={handleSave} isLoading={isSaving} />
            {!isNew && <LinkButton label="Remover convidado" onPress={handleDelete} destructive />}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </>
  );
}

function StepButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled: boolean }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label === '+' ? 'Adicionar acompanhante' : 'Remover acompanhante'}
      onPress={onPress}
      style={[styles.stepButton, { backgroundColor: theme.accentSoft }, disabled && styles.disabled]}>
      <ThemedText type="smallBold" themeColor="link" style={styles.stepLabel}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { marginTop: Spacing.five },
  content: { gap: Spacing.three, padding: Spacing.three, paddingBottom: Spacing.six },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.one },
  chip: { borderRadius: 999, paddingVertical: Spacing.one + 2, paddingHorizontal: Spacing.three },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  stepButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  stepLabel: { fontSize: 20, lineHeight: 24 },
  stepValue: { fontSize: 18, minWidth: 24, textAlign: 'center' },
  disabled: { opacity: 0.4 },
  notes: { minHeight: 88, textAlignVertical: 'top' },
});

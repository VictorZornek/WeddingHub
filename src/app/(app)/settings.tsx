import { Stack } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Share, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { LinkButton } from '@/components/form';
import { Segmented } from '@/components/segmented';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import {
  getThemePreference,
  setThemePreference,
  type ThemePreference,
} from '@/features/settings/theme-preference';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';
import { useWedding } from '@/providers/wedding-provider';

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'auto', label: 'Automático' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
];

export default function SettingsScreen() {
  const { session } = useSession();
  const { wedding } = useWedding();
  const [theme, setTheme] = useState<ThemePreference>(getThemePreference);

  function handleThemeChange(value: ThemePreference) {
    setTheme(value);
    setThemePreference(value);
  }

  function shareInvite() {
    if (!wedding) return;
    Share.share({
      message: `Entre no nosso casamento no Wedding Hub com o código: ${wedding.invite_code}`,
    });
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Ajustes' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Section title="Aparência">
          <Segmented options={THEME_OPTIONS} value={theme} onChange={handleThemeChange} />
          <ThemedText type="small" themeColor="textSecondary">
            Automático segue o modo claro ou escuro do iPhone. A escolha fica salva neste celular.
          </ThemedText>
        </Section>

        {wedding && (
          <Section title="Convite">
            <View style={styles.row}>
              <View>
                <ThemedText type="small" themeColor="textSecondary">
                  Código do casamento
                </ThemedText>
                <ThemedText type="smallBold" style={styles.code}>
                  {wedding.invite_code}
                </ThemedText>
              </View>
              <LinkButton label="Compartilhar" onPress={shareInvite} />
            </View>
          </Section>
        )}

        <Section title="Conta">
          <ThemedText type="small">{session?.user.email}</ThemedText>
          <LinkButton label="Sair da conta" onPress={() => supabase.auth.signOut()} destructive />
        </Section>
      </ScrollView>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold">{title}</ThemedText>
      <Card style={styles.card}>{children}</Card>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: Spacing.four, padding: Spacing.three, paddingBottom: Spacing.six },
  section: { gap: Spacing.two },
  card: { gap: Spacing.three, alignItems: 'stretch' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  code: { letterSpacing: 3, fontSize: 18 },
});

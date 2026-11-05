import { Pressable, Share, StyleSheet } from 'react-native';

import { ScreenPlaceholder } from '@/components/screen-placeholder';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/card';
import { Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';
import { useWedding } from '@/providers/wedding-provider';

export default function HomeScreen() {
  const { session } = useSession();
  const { wedding } = useWedding();

  function shareInvite() {
    if (!wedding) return;
    Share.share({
      message: `Entre no nosso casamento no Wedding Hub com o código: ${wedding.invite_code}`,
    });
  }

  return (
    <ScreenPlaceholder
      title={wedding?.name ?? 'Início'}
      description="Resumo do orçamento: gasto × teto por categoria e total.">
      {wedding && (
        <Pressable onPress={shareInvite} style={({ pressed }) => pressed && styles.pressed}>
          <Card variant="soft" style={styles.inviteCard}>
            <ThemedText type="small" themeColor="textSecondary">
              Código de convite
            </ThemedText>
            <ThemedText type="subtitle" style={styles.code}>
              {wedding.invite_code}
            </ThemedText>
            <ThemedText type="linkPrimary">Compartilhar</ThemedText>
          </Card>
        </Pressable>
      )}

      <ThemedText type="small" themeColor="textSecondary">
        {session?.user.email}
      </ThemedText>
      <Pressable
        onPress={() => supabase.auth.signOut()}
        style={({ pressed }) => pressed && styles.pressed}>
        <ThemedText type="linkPrimary">Sair</ThemedText>
      </Pressable>
    </ScreenPlaceholder>
  );
}

const styles = StyleSheet.create({
  inviteCard: {
    alignItems: 'center',
    paddingHorizontal: Spacing.five,
    marginVertical: Spacing.three,
  },
  code: { letterSpacing: 4 },
  pressed: { opacity: 0.7 },
});

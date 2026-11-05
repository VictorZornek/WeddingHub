import { Pressable, StyleSheet } from 'react-native';

import { ScreenPlaceholder } from '@/components/screen-placeholder';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';

export default function HomeScreen() {
  const { session } = useSession();

  return (
    <ScreenPlaceholder
      title="Início"
      description="Resumo do orçamento: gasto × teto por categoria e total.">
      <ThemedText type="small" themeColor="textSecondary">
        {session?.user.email}
      </ThemedText>
      <Pressable
        onPress={() => supabase.auth.signOut()}
        style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}>
        <ThemedText type="linkPrimary">Sair</ThemedText>
      </Pressable>
    </ScreenPlaceholder>
  );
}

const styles = StyleSheet.create({
  signOut: { marginTop: Spacing.three },
  pressed: { opacity: 0.7 },
});

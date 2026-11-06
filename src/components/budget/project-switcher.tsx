import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { chipLook } from '@/components/chip-look';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  projects: { id: string; name: string }[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

// Horizontal chips to switch between Casamento / Apartamento / Viagem.
export function ProjectSwitcher({ projects, selectedId, onSelect }: Props) {
  const theme = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {projects.map((project) => {
        const isSelected = project.id === selectedId;
        const look = chipLook(theme, isSelected);
        return (
          <Pressable key={project.id} onPress={() => onSelect(project.id)}>
            <View
              style={[
                styles.chip,
                look.container,
              ]}>
              <ThemedText type={isSelected ? 'smallBold' : 'small'} themeColor={look.textColor}>
                {project.name}
              </ThemedText>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: Spacing.two },
  chip: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
  },
});

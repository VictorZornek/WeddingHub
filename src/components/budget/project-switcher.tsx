import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

type Props = {
  projects: { id: string; name: string }[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

// Horizontal chips to switch between Casamento / Apartamento / Viagem.
export function ProjectSwitcher({ projects, selectedId, onSelect }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {projects.map((project) => {
        const isSelected = project.id === selectedId;
        return (
          <Pressable key={project.id} onPress={() => onSelect(project.id)}>
            <ThemedView
              type={isSelected ? 'backgroundSelected' : 'backgroundElement'}
              style={styles.chip}>
              <ThemedText type={isSelected ? 'smallBold' : 'small'} themeColor={isSelected ? 'text' : 'textSecondary'}>
                {project.name}
              </ThemedText>
            </ThemedView>
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
    borderRadius: Spacing.four,
  },
});

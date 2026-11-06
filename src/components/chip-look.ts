import { StyleSheet } from 'react-native';

import type { Colors } from '@/constants/theme';

type Theme = (typeof Colors)['light'] | (typeof Colors)['dark'];

// Shared look for pills that can be selected (filters, groups, categories, status).
// Selected: soft tint with a thin accent line. Not selected: plain with a hairline.
export function chipLook(theme: Theme, selected: boolean) {
  return {
    container: {
      backgroundColor: selected ? theme.accentSoft : theme.backgroundElement,
      borderColor: selected ? theme.accentBorder : theme.border,
      borderWidth: 1,
    },
    textColor: selected ? ('link' as const) : ('textSecondary' as const),
  };
}

export const chipBase = StyleSheet.create({
  pill: { borderRadius: 999, paddingVertical: 6, paddingHorizontal: 14 },
});

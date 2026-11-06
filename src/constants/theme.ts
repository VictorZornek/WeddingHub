/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

// "Verde-água névoa" palette: neutral backgrounds, a calm teal accent
// and thin tinted borders instead of solid color blocks.
export const Colors = {
  light: {
    text: '#1F2A28',
    textSecondary: '#6E7E7A',
    background: '#F7F8F7',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#EEF5F3',
    /** Thin card and divider lines, tinted with the accent. */
    border: '#DCE9E5',
    /** Stronger tinted line for highlighted cards and selected chips. */
    accentBorder: '#A9CCC5',
    accent: '#6FA59B',
    accentSoft: '#EEF5F3',
    /** Text on the highlight card (accentSoft background). */
    onAccent: '#1F3D38',
    onAccentSecondary: '#5F7F79',
    /** Icons and text on a solid accent fill (checkmarks). */
    onAccentFill: '#FFFFFF',
    link: '#3F7F74',
    danger: '#B9472A',
    track: '#DCEAE6',
  },
  dark: {
    text: '#E6ECEA',
    textSecondary: '#8E9C99',
    background: '#111413',
    backgroundElement: '#171B1A',
    backgroundSelected: '#1B2523',
    border: '#243230',
    accentBorder: '#3A5852',
    accent: '#86B5AC',
    accentSoft: '#1B2523',
    onAccent: '#E6ECEA',
    onAccentSecondary: '#9DB3AE',
    onAccentFill: '#111413',
    link: '#9CC7BE',
    danger: '#E8876C',
    track: '#26332F',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

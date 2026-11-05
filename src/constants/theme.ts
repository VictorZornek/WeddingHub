/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

// "Verde-água suave" palette.
export const Colors = {
  light: {
    text: '#1D3A36',
    textSecondary: '#5D857F',
    background: '#F4FAF9',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E2F1EE',
    border: '#D9ECE8',
    accent: '#76B7AC',
    accentSoft: '#E2F1EE',
    onAccent: '#123430',
    onAccentSecondary: '#2E5650',
    link: '#2F7D70',
    danger: '#C4320A',
    track: '#E2F1EE',
  },
  dark: {
    text: '#E5F3F0',
    textSecondary: '#97B4AF',
    background: '#0E1716',
    backgroundElement: '#152321',
    backgroundSelected: '#1C2B29',
    border: '#223432',
    accent: '#A3D9CF',
    accentSoft: '#1C2B29',
    onAccent: '#10302B',
    onAccentSecondary: '#2A4F49',
    link: '#A3D9CF',
    danger: '#FF8A6B',
    track: '#223432',
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

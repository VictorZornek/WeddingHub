import '@/lib/local-storage';

import { Appearance } from 'react-native';

export type ThemePreference = 'auto' | 'light' | 'dark';

const STORAGE_KEY = 'wedding-hub.theme';

export function getThemePreference(): ThemePreference {
  try {
    const stored = globalThis.localStorage?.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'auto';
  } catch {
    return 'auto';
  }
}

// Forces light/dark for the whole app, or follows the phone again with "auto".
// Saved on this device only.
export function setThemePreference(preference: ThemePreference) {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, preference);
  } catch {
    // Not saved, but still applied for this session.
  }
  Appearance.setColorScheme(preference);
}

// Call once at startup so the saved choice wins before the first screen draws.
export function applySavedThemePreference() {
  const preference = getThemePreference();
  if (preference !== 'auto') Appearance.setColorScheme(preference);
}

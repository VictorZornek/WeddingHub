import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { Colors } from '@/constants/theme';
import { applySavedThemePreference } from '@/features/settings/theme-preference';
import '@/lib/page-language';
import { SessionProvider, useSession } from '@/providers/session-provider';
import { useWedding, WeddingProvider } from '@/providers/wedding-provider';

SplashScreen.preventAutoHideAsync();
applySavedThemePreference();

// Navigation colors follow the app palette so screen transitions don't flash white/black.
function navigationTheme(scheme: 'light' | 'dark') {
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const colors = Colors[scheme];
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.link,
      background: colors.background,
      card: colors.backgroundElement,
      text: colors.text,
      border: colors.border,
    },
  };
}

export default function RootLayout() {
  const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return (
    <ThemeProvider value={navigationTheme(colorScheme)}>
      <SessionProvider>
        <WeddingProvider>
          <RootNavigator />
        </WeddingProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { session, isLoading: isSessionLoading } = useSession();
  const { wedding, isLoading: isWeddingLoading } = useWedding();

  // Keep the splash screen until we know where the user should land.
  if (isSessionLoading || isWeddingLoading) return null;

  const isSignedIn = !!session;
  const hasWedding = !!wedding;

  return (
    <>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={isSignedIn && hasWedding}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>

        <Stack.Protected guard={isSignedIn && !hasWedding}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>

        <Stack.Protected guard={!isSignedIn}>
          <Stack.Screen name="sign-in" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

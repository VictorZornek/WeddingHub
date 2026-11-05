import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { SessionProvider, useSession } from '@/providers/session-provider';
import { useWedding, WeddingProvider } from '@/providers/wedding-provider';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
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
          <Stack.Screen name="(tabs)" />
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

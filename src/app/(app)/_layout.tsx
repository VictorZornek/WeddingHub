import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { setupNotificationHandler } from '@/features/notifications/notifications';
import { syncNotifications } from '@/features/notifications/sync';
import { useTheme } from '@/hooks/use-theme';
import { useWedding } from '@/providers/wedding-provider';

setupNotificationHandler();

// Every screen a signed-in member can reach. Screens outside the tabs
// get a themed header; each screen sets its own title.
export default function AppLayout() {
  const theme = useTheme();
  const { wedding } = useWedding();
  const weddingId = wedding?.id;

  // Reschedule this phone's notifications on open and whenever the app comes back,
  // so reminders created on the partner's phone are picked up too.
  useEffect(() => {
    if (!weddingId) return;
    syncNotifications(weddingId);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncNotifications(weddingId);
    });
    return () => subscription.remove();
  }, [weddingId]);

  return (
    <Stack
      screenOptions={{
        headerTintColor: theme.link,
        headerStyle: { backgroundColor: theme.background },
        headerTitleStyle: { color: theme.text },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: theme.background },
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

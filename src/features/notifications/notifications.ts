import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// iOS keeps at most 64 pending local notifications per app; stay below it.
const MAX_SCHEDULED = 60;

export type Notice = { title: string; body: string; date: Date };

// Show notifications as a banner even while the app is open.
export function setupNotificationHandler() {
  if (Platform.OS === 'web') return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function ensureNotificationPermission() {
  if (Platform.OS === 'web') return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  // Already answered "no": asking again shows nothing on iOS, so stop here.
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: false, allowSound: true },
  });
  return requested.granted;
}

// Replaces every scheduled notification with the given list (future ones only, soonest first).
// Notifications live on each phone, so each device rebuilds its own list from the shared data.
export async function replaceScheduledNotifications(notices: Notice[]) {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = Date.now();
  const upcoming = notices
    .filter((n) => n.date.getTime() > now)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, MAX_SCHEDULED);

  for (const notice of upcoming) {
    await Notifications.scheduleNotificationAsync({
      content: { title: notice.title, body: notice.body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: notice.date },
    });
  }
}

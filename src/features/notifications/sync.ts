import { fetchReminders } from '@/features/reminders/reminders';

import { ensureNotificationPermission, replaceScheduledNotifications, type Notice } from './notifications';

async function reminderNotices(weddingId: string): Promise<Notice[]> {
  const reminders = (await fetchReminders(weddingId)) ?? [];
  return reminders
    .filter((r) => !r.done)
    .map((r) => ({ title: r.title, body: r.notes ?? 'Lembrete do casamento', date: new Date(r.remind_at) }));
}

async function runSync(weddingId: string) {
  const allowed = await ensureNotificationPermission();
  if (!allowed) return;
  const notices = await reminderNotices(weddingId);
  await replaceScheduledNotifications(notices);
}

// Calls run one after another so two syncs never schedule duplicates.
let queue: Promise<void> = Promise.resolve();

// Rebuilds this phone's notifications from the shared data. Safe to call often.
export function syncNotifications(weddingId: string) {
  queue = queue.then(() => runSync(weddingId)).catch(() => {});
  return queue;
}

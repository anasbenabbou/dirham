import { getSetting, setSetting } from '../db/settings';

/**
 * Local-notification helpers. expo-notifications is **lazy-loaded** inside each
 * function so it never runs at app startup — that avoids the Expo Go push
 * warning entirely (and works fine in a real build). All calls are guarded.
 */

let _handlerSet = false;
async function getNotifs() {
  const N = await import('expo-notifications');
  if (!_handlerSet) {
    _handlerSet = true;
    N.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false,
      }),
    });
  }
  return N;
}

export function notificationsEnabled(): boolean {
  return getSetting('notificationsEnabled') === '1';
}

export async function setNotificationsEnabled(on: boolean): Promise<boolean> {
  if (on) {
    try {
      const N = await getNotifs();
      const { status } = await N.requestPermissionsAsync();
      if (status !== 'granted') return false;
    } catch { return false; }
  }
  setSetting('notificationsEnabled', on ? '1' : '0');
  return on;
}

export async function notifyNow(title: string, body: string): Promise<void> {
  if (!notificationsEnabled()) return;
  try {
    const N = await getNotifs();
    await N.scheduleNotificationAsync({ content: { title, body }, trigger: null });
  } catch {}
}

export async function notifyAt(title: string, body: string, date: Date): Promise<string | null> {
  if (!notificationsEnabled()) return null;
  if (date.getTime() <= Date.now()) return null;
  try {
    const N = await getNotifs();
    return await N.scheduleNotificationAsync({
      content: { title, body },
      trigger: { type: N.SchedulableTriggerInputTypes.DATE, date },
    });
  } catch { return null; }
}

export async function cancelAll(): Promise<void> {
  try {
    const N = await getNotifs();
    await N.cancelAllScheduledNotificationsAsync();
  } catch {}
}

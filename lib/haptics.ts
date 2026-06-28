import * as Haptics from 'expo-haptics';

/** Thin, crash-proof wrappers around expo-haptics (no-ops if unsupported). */
export const haptic = {
  light: () => { try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {} },
  medium: () => { try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {} },
  success: () => { try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {} },
  warning: () => { try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } catch {} },
  error: () => { try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); } catch {} },
  select: () => { try { Haptics.selectionAsync(); } catch {} },
};

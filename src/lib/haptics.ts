import * as Haptics from 'expo-haptics';

export function light() {
  return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function success() {
  return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

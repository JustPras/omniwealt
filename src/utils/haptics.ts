import { Platform } from 'react-native';

let Haptics: any = null;
try {
  Haptics = require('expo-haptics');
} catch {
  // Node.js test environment or unsupported runtime
}

export const triggerHaptic = (
  type: 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error' = 'light'
) => {
  if (Platform?.OS === 'web' || !Haptics) return;

  try {
    switch (type) {
      case 'light':
        Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle?.Light);
        break;
      case 'medium':
        Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle?.Medium);
        break;
      case 'heavy':
        Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle?.Heavy);
        break;
      case 'selection':
        Haptics.selectionAsync?.();
        break;
      case 'success':
        Haptics.notificationAsync?.(Haptics.NotificationFeedbackType?.Success);
        break;
      case 'warning':
        Haptics.notificationAsync?.(Haptics.NotificationFeedbackType?.Warning);
        break;
      case 'error':
        Haptics.notificationAsync?.(Haptics.NotificationFeedbackType?.Error);
        break;
    }
  } catch {
    // Graceful fallback if device doesn't support vibration
  }
};

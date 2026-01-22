import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

/**
 * Haptic feedback utility for providing tactile feedback throughout the app.
 *
 * Uses expo-haptics for iOS and Android (where supported).
 * Falls back gracefully on web or unsupported devices.
 */

// Check if haptics are available (not available on web)
const isHapticsAvailable = Platform.OS !== "web";

/**
 * Light haptic feedback - for subtle interactions
 * Use for: toggles, small selections, navigation taps
 */
export async function hapticLight() {
  if (!isHapticsAvailable) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Silently fail - haptics not critical
  }
}

/**
 * Medium haptic feedback - for standard interactions
 * Use for: button presses, confirming actions
 */
export async function hapticMedium() {
  if (!isHapticsAvailable) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // Silently fail
  }
}

/**
 * Heavy haptic feedback - for important interactions
 * Use for: completing major actions, errors, warnings
 */
export async function hapticHeavy() {
  if (!isHapticsAvailable) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch {
    // Silently fail
  }
}

/**
 * Selection changed feedback
 * Use for: picker changes, slider movements, segment control
 */
export async function hapticSelection() {
  if (!isHapticsAvailable) return;
  try {
    await Haptics.selectionAsync();
  } catch {
    // Silently fail
  }
}

/**
 * Success notification feedback
 * Use for: successful transactions, task completion, achievements
 */
export async function hapticSuccess() {
  if (!isHapticsAvailable) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Silently fail
  }
}

/**
 * Warning notification feedback
 * Use for: validation errors, low balance warnings
 */
export async function hapticWarning() {
  if (!isHapticsAvailable) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {
    // Silently fail
  }
}

/**
 * Error notification feedback
 * Use for: failed transactions, critical errors
 */
export async function hapticError() {
  if (!isHapticsAvailable) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {
    // Silently fail
  }
}

/**
 * Celebration pattern - for achievements and milestones
 * Plays a series of haptic pulses to celebrate
 */
export async function hapticCelebration() {
  if (!isHapticsAvailable) return;
  try {
    // Pattern: light -> medium -> heavy -> success
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await new Promise((resolve) => setTimeout(resolve, 50));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise((resolve) => setTimeout(resolve, 50));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Silently fail
  }
}

/**
 * Money transfer pattern - for transfers and payments
 */
export async function hapticMoneyTransfer() {
  if (!isHapticsAvailable) return;
  try {
    // Pattern simulating coins/money
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await new Promise((resolve) => setTimeout(resolve, 80));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise((resolve) => setTimeout(resolve, 80));
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Silently fail
  }
}

// Default export with all haptic functions
export const haptics = {
  light: hapticLight,
  medium: hapticMedium,
  heavy: hapticHeavy,
  selection: hapticSelection,
  success: hapticSuccess,
  warning: hapticWarning,
  error: hapticError,
  celebration: hapticCelebration,
  moneyTransfer: hapticMoneyTransfer,
};

export default haptics;

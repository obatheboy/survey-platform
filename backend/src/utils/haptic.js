/**
 * Haptic Feedback Utility
 * Provides tactile feedback for touch interactions
 */

// Pattern constants
const PATTERNS = {
  // Light feedback for minor actions (button presses, toggles)
  LIGHT: [10],
  
  // Medium feedback for standard interactions (form submits, navigation)
  MEDIUM: [15],
  
  // Heavy feedback for important actions (confirmations, errors)
  HEAVY: [25],
  
  // Success pattern (double tap)
  SUCCESS: [10, 50, 10],
  
  // Error pattern (long buzz)
  ERROR: [100],
  
  // Warning pattern (patterned buzz)
  WARNING: [30, 50, 30],
  
  // Selection click (like spinner selection)
  SELECTION: [5]
};

/**
 * Trigger haptic feedback if supported
 * @param {string|number[]} pattern - Pattern name or custom array of durations
 */
export function haptic(pattern = 'MEDIUM') {
  // Check if Vibration API is supported
  if (!navigator.vibrate) {
    return;
  }

  const vibrationPattern = typeof pattern === 'string' ? PATTERNS[pattern] : pattern;

  if (Array.isArray(vibrationPattern)) {
    navigator.vibrate(vibrationPattern);
  }
}

/**
 * Light tap feedback for button presses
 */
export function hapticLight() {
  haptic('LIGHT');
}

/**
 * Medium feedback for standard actions
 */
export function hapticMedium() {
  haptic('MEDIUM');
}

/**
 * Heavy feedback for important actions
 */
export function hapticHeavy() {
  haptic('HEAVY');
}

/**
 * Success feedback (double tap)
 */
export function hapticSuccess() {
  haptic('SUCCESS');
}

/**
 * Error feedback (long buzz)
 */
export function hapticError() {
  haptic('ERROR');
}

/**
 * Warning feedback
 */
export function hapticWarning() {
  haptic('WARNING');
}

/**
 * Selection feedback (subtle click)
 */
export function hapticSelection() {
  haptic('SELECTION');
}

/**
 * Custom vibration pattern
 * @param {number[]} durations - Array of vibration durations in ms
 */
export function hapticCustom(durations) {
  if (Array.isArray(durations) && navigator.vibrate) {
    navigator.vibrate(durations);
  }
}

/**
 * Cancel any ongoing vibration
 */
export function hapticCancel() {
  if (navigator.vibrate) {
    navigator.vibrate(0);
  }
}

/**
 * Check if haptic feedback is available
 * @returns {boolean}
 */
export function isHapticAvailable() {
  return 'vibrate' in navigator;
}

// Hook for React components
export function useHaptic() {
  return {
    light: hapticLight,
    medium: hapticMedium,
    heavy: hapticHeavy,
    success: hapticSuccess,
    error: hapticError,
    warning: hapticWarning,
    selection: hapticSelection,
    cancel: hapticCancel,
    custom: hapticCustom,
    available: isHapticAvailable()
  };
}

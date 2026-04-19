/**
 * Cache Management Utility
 * Handles version checking, storage clearing, and cache busting
 */

const APP_VERSION = '2.0.0';
const STORAGE_KEYS = {
  TOKEN: 'token',
  ADMIN_TOKEN: 'adminToken',
  ACTIVE_PLAN: 'active_plan',
  CACHED_USER: 'cachedUser',
  USER: 'user',
  APP_VERSION: 'app_version',
  // Add any other keys that store cached data
};

const SENSITIVE_KEYS = [
  // Auth
  'token',
  'adminToken',
  'cachedUser',
  'user',
  
  // Plan & Payment
  'active_plan',
  'userData',
  'cachedBalance',
  'paymentData',
  'planFees',
  'pendingActivationRef',
  'pendingPlanKey',
  
  // Login Fee
  'pendingLoginUser',
  'pendingLoginFeeApproval',
  'loginFeeStatus',
  
  // Withdrawal
  'withdrawData',
  
  // Onboarding & UI State
  'showWelcomeBonusOnDashboard',
  'pendingWelcomeBonus',
  'hasSeenInstallPrompt',
  'pwa-install-dismissed',
  'survey_onboarding_completed',
  'termsAccepted',
  
  // Timestamps
  'lastLoginTime',
  
  // Pattern-based keys (these need special handling)
  // 'lastWithdrawClick_*' is handled separately
];

/**
 * Get stored app version
 */
export function getStoredVersion() {
  return localStorage.getItem(STORAGE_KEYS.APP_VERSION);
}

/**
 * Get current app version
 */
export function getCurrentVersion() {
  return APP_VERSION;
}

/**
 * Check if version mismatch exists
 */
export function isVersionMismatch() {
  const storedVersion = getStoredVersion();
  return storedVersion !== APP_VERSION;
}

/**
 * Clear all app-related storage (localStorage + sessionStorage)
 */
export function clearAllAppStorage() {
  // Clear specific sensitive keys from localStorage
  SENSITIVE_KEYS.forEach((key) => {
    localStorage.removeItem(key);
  });

  // Clear pattern-based keys (keys that start with specific prefixes)
  const allKeys = Object.keys(localStorage);
  const patternPrefixes = ['lastWithdrawClick_', 'cached_', 'temp_'];
  allKeys.forEach((key) => {
    if (patternPrefixes.some((prefix) => key.startsWith(prefix))) {
      localStorage.removeItem(key);
    }
  });

  // Clear sessionStorage completely
  sessionStorage.clear();

  // Set new version
  localStorage.setItem(STORAGE_KEYS.APP_VERSION, APP_VERSION);

  console.log('[Cache] All app storage cleared. Version set to:', APP_VERSION);
}

/**
 * Force clear and reload the application
 */
export function refreshApp() {
  clearAllAppStorage();
  // Force page reload, bypassing cache
  window.location.reload(true);
}

/**
 * Initialize cache check on app start
 * Call this in your main App component's useEffect
 */
export function initCacheBusting(onVersionMismatch) {
  // Check version on load
  if (isVersionMismatch()) {
    console.log('[Cache] Version mismatch detected. Clearing old data...');
    clearAllAppStorage();
    if (onVersionMismatch) onVersionMismatch();
  } else {
    // Ensure version is set even if first load
    localStorage.setItem(STORAGE_KEYS.APP_VERSION, APP_VERSION);
  }
}

/**
 * Get cache-busting query parameter for API requests
 */
export function getCacheBuster() {
  return `_v=${APP_VERSION}`;
}

/**
 * Generate URL with cache-busting parameter
 */
export function getVersionedUrl(url) {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${getCacheBuster()}`;
}

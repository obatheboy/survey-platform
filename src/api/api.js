import axios from "axios";
import { getCacheBuster } from "../utils/cache";

/* =====================================================
   🌍 BASE API URL
   (ensure no double /api)
==================================================== */
const RAW_BASE = import.meta.env.VITE_API_URL;
const BASE_URL = RAW_BASE.endsWith("/api") ? RAW_BASE : `${RAW_BASE}/api`;

/* =====================================================
   👤 USER API (COOKIE BASED)
   - All normal users
   - HttpOnly cookies
==================================================== */
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 30000,
});

/* 🔐 ADD TOKEN FROM LOCALSTORAGE (MOBILE FIX) + CACHE BUSTING */
api.interceptors.request.use(
  (config) => {
    config.withCredentials = true;

    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Append version parameter for cache busting
    const urlSeparator = config.url.includes('?') ? '&' : '?';
    config.url = `${config.url}${urlSeparator}${getCacheBuster()}`;

    return config;
  },
  (error) => Promise.reject(error)
);

/* =====================================================
   👑 ADMIN API (BEARER TOKEN)
==================================================== */
export const adminApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
  timeout: 30000,
});

adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Append version parameter for cache busting
    const urlSeparator = config.url.includes('?') ? '&' : '?';
    config.url = `${config.url}${urlSeparator}${getCacheBuster()}`;
    return config;
  },
  (error) => Promise.reject(error)
);

/* =====================================================
   ⚠️ RESPONSE INTERCEPTOR
==================================================== */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;

    if (error?.response?.status === 429) {
      console.warn("Rate limited (429). Please wait before retrying.");
      return Promise.reject({
        ...error,
        isRateLimit: true,
        retryAfter: error.response?.headers?.['retry-after'] || 60
      });
    }

    if (error?.response?.status === 401) {
      console.warn("User request returned 401.", error.response?.data?.message);

      const protectedRoutes = ['/auth/me', '/withdraw/request', '/surveys/select-plan'];
      const isProtectedRoute = protectedRoutes.some(route =>
        originalRequest.url.includes(route)
      );

      if (isProtectedRoute) {
        localStorage.removeItem("token");
      }
    }

    if (!error.response) {
      console.error("Network error or server not responding");
    }

    return Promise.reject(error);
  }
);

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 429) {
      console.warn("Admin API rate limited (429)");
      return Promise.reject({
        ...error,
        isRateLimit: true
      });
    }
    return Promise.reject(error);
  }
);

/* =====================================================
   🚀 REQUEST QUEUE FOR WITHDRAWAL REQUESTS
==================================================== */
let isWithdrawRequestPending = false;
let withdrawRequestQueue = [];

export const queueWithdrawRequest = async (requestFn) => {
  if (isWithdrawRequestPending) {
    return new Promise((resolve, reject) => {
      withdrawRequestQueue.push({ requestFn, resolve, reject });
    });
  }

  isWithdrawRequestPending = true;
  try {
    const result = await requestFn();
    return result;
  } finally {
    isWithdrawRequestPending = false;

    if (withdrawRequestQueue.length > 0) {
      const nextRequest = withdrawRequestQueue.shift();
      setTimeout(() => {
        queueWithdrawRequest(nextRequest.requestFn)
          .then(nextRequest.resolve)
          .catch(nextRequest.reject);
      }, 2000);
    }
  }
};

/* =====================================================
   🛡️ RATE LIMITING UTILITY
==================================================== */
const requestTimestamps = {};

export const canMakeRequest = (endpoint, cooldownMs = 10000) => {
  const now = Date.now();
  const lastRequestTime = requestTimestamps[endpoint] || 0;

  if (now - lastRequestTime < cooldownMs) {
    return false;
  }

  requestTimestamps[endpoint] = now;
  return true;
};

/* =====================================================
   🏆 AFFILIATE API
==================================================== */
export const affiliateApi = {
  getStats: () => api.get("/affiliate/stats"),
  verifyCode: (code) => api.post("/affiliate/verify-code", { referral_code: code })
};

/* =====================================================
   👑 ADMIN AFFILIATE API
==================================================== */
export const adminAffiliateApi = {
  getAllAffiliates: () => adminApi.get("/affiliate/admin/all")
};

/* =====================================================
   🎮 GAMIFICATION API
==================================================== */
export const gamificationApi = {
  getAchievements: () => api.get("/gamification/achievements"),
  getLeaderboard: (type = 'earnings', limit = 10) => api.get(`/gamification/leaderboard?type=${type}&limit=${limit}`),
  checkDailyReward: () => api.get("/gamification/daily-reward"),
  claimDailyReward: () => api.post("/gamification/daily-reward/claim"),
  getUserStats: () => api.get("/gamification/stats")
};

/* =====================================================
    💰 LOGIN FEE API - KSH 95 with Auto-Verification via MegaPay
    - User selects plan (or defaults to login fee)
    - User enters ONLY phone number (no amount input)
    - Amount is KSH 95 automatically
    - Frontend calls /confirm after MegaPay confirms payment
    ==================================================== */
export const loginFeeApi = {
  // Initiate KSH 95 login fee payment via MegaPay STK Push
  initiate: (phoneNumber) => api.post("/login-fee/initiate", { phone_number: phoneNumber }),

  // Confirm payment after MegaPay confirms - updates user login_fee_paid status
  // This should be called when MegaPay returns ResultCode="200" and TransactionStatus="Completed"
  confirm: (data) => api.post("/login-fee/confirm", data),

  // ❌ DEPRECATED: checkStatus is no longer used - replaced by confirm endpoint
  // checkStatus: (params) => api.get("/login-fee/status", { params }),
};

/* =====================================================
   👑 ADMIN LOGIN FEE API (For manual approval if needed)
==================================================== */
export const adminLoginFeeApi = {
  // Get all users with pending payment
  getPending: () => adminApi.get("/login-fee/admin/pending"),

  // Manually approve a user after verifying payment in MegaPay dashboard
  approveUser: (userId, reference, notes) => adminApi.post("/login-fee/admin/approve", { userId, reference, notes })

  // ❌ REMOVED: verifyWithPaystack - Paystack no longer used
};

/* =====================================================
    🚀 MEGAPAY PAYMENT API
    ===================================================================================== */
export const megapayApi = {
  // Initiate STK Push payment via MegaPay
  initiate: (plan, phoneNumber) => api.post("/megapay/initiate", { plan, phone_number: phoneNumber }),

  // Check payment/activation status
  checkStatus: () => api.get("/megapay/status"),

  // Get last payment reference
  getLastReference: () => api.get("/megapay/last-reference"),
};

// Legacy alias for backwards compatibility
export const paynectaApi = megapayApi;

/* =====================================================
     💳 PROGRESSIVE PLAN PAYMENT API
     - 4 plans: Welcome Bonus (KES 100), Regular (KES 100), VIP (KES 200), VVIP (KES 300)
     - Auto-verify via MegaPay polling
     - Sequential payment flow with next-plan linking
     ==================================================== */
export const planPaymentApi = {
  initiate: (plan, phoneNumber) => api.post("/plans/initiate", { plan, phone_number: phoneNumber }),

  confirm: (data) => api.post("/plans/confirm", data),

  getStatus: () => api.get("/plans/status"),

  getNext: () => api.get("/plans/next"),
};

/* =====================================================
    👑 ADMIN MEGAPAY API
    ===================================================================================== */
export const adminMegapayApi = {
  // Get all pending payments for admin verification
  getPending: () => adminApi.get("/megapay/admin/pending"),

  // Get all payments (pending, approved, rejected)
  getAll: () => adminApi.get("/megapay/admin/all"),

  // Manually approve payment after verifying in MegaPay dashboard
  approvePayment: (userId, activationId, notes) => adminApi.post("/megapay/admin/approve", { userId, activationId, notes }),

  // Reject payment
  rejectPayment: (userId, activationId, reason) => adminApi.post("/megapay/admin/reject", { userId, activationId, reason }),

  // Get plan amounts
  getPlanAmounts: () => adminApi.get("/megapay/admin/plan-amounts"),
};

// Legacy alias for backwards compatibility
export const adminPaynectaApi = adminMegapayApi;

/* =====================================================
   📦 DEFAULT EXPORT
==================================================== */
export default api;
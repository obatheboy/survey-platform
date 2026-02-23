import axios from "axios";

/* =====================================================
   🌍 BASE API URL
   (ensure no double /api)
===================================================== */
const RAW_BASE = import.meta.env.VITE_API_URL;
const BASE_URL = RAW_BASE.endsWith("/api") ? RAW_BASE : `${RAW_BASE}/api`;

/* =====================================================
   👤 USER API (COOKIE BASED)
   - All normal users
   - HttpOnly cookies
===================================================== */
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Keep for backward compatibility
  timeout: 30000, // Add timeout to prevent hanging requests
});

/* 🔐 ADD TOKEN FROM LOCALSTORAGE (MOBILE FIX) */
api.interceptors.request.use(
  (config) => {
    config.withCredentials = true;
    
    // Add token from localStorage for mobile compatibility
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

/* =====================================================
   👑 ADMIN API (BEARER TOKEN)
   - No cookies
===================================================== */
export const adminApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
  timeout: 30000,
});

/* 🔐 ADMIN TOKEN ATTACHER */
adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* =====================================================
   ⚠️ RESPONSE INTERCEPTOR - ENHANCED
   - Better error handling for rate limiting
   - Prevent accidental forced logout
===================================================== */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    
    // Handle 429 (Too Many Requests) specifically
    if (error?.response?.status === 429) {
      console.warn("Rate limited (429). Please wait before retrying.");
      
      // Don't auto-retry 429 errors
      return Promise.reject({
        ...error,
        isRateLimit: true,
        retryAfter: error.response?.headers?.['retry-after'] || 60
      });
    }
    
    // Handle 401 (Unauthorized) - only for non-critical routes
    if (error?.response?.status === 401) {
      console.warn(
        "User request returned 401. Do not force logout here.",
        error.response?.data?.message
      );
      
      // Check if this is a protected route that should trigger logout
      const protectedRoutes = ['/auth/me', '/withdraw/request', '/surveys/select-plan'];
      const isProtectedRoute = protectedRoutes.some(route => 
        originalRequest.url.includes(route)
      );
      
      if (isProtectedRoute) {
        // Only clear token if it's a critical route
        localStorage.removeItem("token");
      }
    }
    
    // Handle network errors
    if (!error.response) {
      console.error("Network error or server not responding");
    }
    
    return Promise.reject(error);
  }
);

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle admin API errors
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
   - Prevent multiple simultaneous withdrawal requests
===================================================== */
let isWithdrawRequestPending = false;
let withdrawRequestQueue = [];

export const queueWithdrawRequest = async (requestFn) => {
  if (isWithdrawRequestPending) {
    // Queue the request
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
    
    // Process next request in queue
    if (withdrawRequestQueue.length > 0) {
      const nextRequest = withdrawRequestQueue.shift();
      setTimeout(() => {
        queueWithdrawRequest(nextRequest.requestFn)
          .then(nextRequest.resolve)
          .catch(nextRequest.reject);
      }, 2000); // 2 second delay between queued requests
    }
  }
};

/* =====================================================
   🛡️ RATE LIMITING UTILITY
===================================================== */
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
   📦 EXPORTS
===================================================== */
export default api;

/* =====================================================
   🏆 AFFILIATE API
   - Get affiliate stats
   - Verify referral code
===================================================== */
export const affiliateApi = {
  getStats: () => api.get("/affiliate/stats"),
  verifyCode: (code) => api.post("/affiliate/verify-code", { referral_code: code })
};  
 
/* =====================================================   ?? ADMIN AFFILIATE API   ===================================================== */
export const adminAffiliateApi = {  getAllAffiliates: () => adminApi.get("/affiliate/admin/all")};  

/* =====================================================   🎮 GAMIFICATION API   ===================================================== */
export const gamificationApi = {
  // Achievements
  getAchievements: () => api.get("/gamification/achievements"),
  
  // Leaderboard
  getLeaderboard: (type = 'earnings', limit = 10) => api.get(`/gamification/leaderboard?type=${type}&limit=${limit}`),
  
  // Daily rewards
  checkDailyReward: () => api.get("/gamification/daily-reward"),
  claimDailyReward: () => api.post("/gamification/daily-reward/claim"),
  
  // Stats
  getUserStats: () => api.get("/gamification/stats")
};

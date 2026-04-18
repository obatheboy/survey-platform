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
  withCredentials: true,
  timeout: 30000,
});

/* 🔐 ADD TOKEN FROM LOCALSTORAGE (MOBILE FIX) */
api.interceptors.request.use(
  (config) => {
    config.withCredentials = true;
    
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
===================================================== */
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
    return config;
  },
  (error) => Promise.reject(error)
);

/* =====================================================
   ⚠️ RESPONSE INTERCEPTOR
===================================================== */
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
===================================================== */
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
   🏆 AFFILIATE API
===================================================== */
export const affiliateApi = {
  getStats: () => api.get("/affiliate/stats"),
  verifyCode: (code) => api.post("/affiliate/verify-code", { referral_code: code })
};  

/* =====================================================
   👑 ADMIN AFFILIATE API
===================================================== */
export const adminAffiliateApi = { 
  getAllAffiliates: () => adminApi.get("/affiliate/admin/all")
};  

/* =====================================================
   🎮 GAMIFICATION API
===================================================== */
export const gamificationApi = {
  getAchievements: () => api.get("/gamification/achievements"),
  getLeaderboard: (type = 'earnings', limit = 10) => api.get(`/gamification/leaderboard?type=${type}&limit=${limit}`),
  checkDailyReward: () => api.get("/gamification/daily-reward"),
  claimDailyReward: () => api.post("/gamification/daily-reward/claim"),
  getUserStats: () => api.get("/gamification/stats")
};

/* =====================================================
   💰 LOGIN FEE API - FIXED FOR STK PUSH ONLY
   - Removed submitMpesaCode (manual submission not needed)
   - verify endpoint kept but not used for auto-approval
===================================================== */
export const loginFeeApi = {
  // ✅ Send STK push to user's phone
  initiate: (userId) => api.post("/login-fee/initiate", { userId }),
  
  // ✅ Check if user has been approved (manual approval)
  checkStatus: (userId) => api.get(`/login-fee/status?userId=${userId}`),
  
  // ✅ Verify payment with Paystack (admin can use before approving)
  verify: (reference, userId) => api.post("/login-fee/verify-paystack", { reference, userId }),
  
  // ❌ REMOVED: submitMpesaCode - manual code submission is no longer needed
  // Users pay via STK push only, admin approves manually after checking Paystack
};

/* =====================================================
   👑 ADMIN LOGIN FEE API (For manual approval)
===================================================== */
export const adminLoginFeeApi = {
  // Get all users with pending payment
  getPending: () => adminApi.get("/login-fee/admin/pending"),
  
  // Manually approve a user after verifying payment in Paystack dashboard
  approveUser: (userId, reference, notes) => adminApi.post("/login-fee/admin/approve", { userId, reference, notes }),
  
  // Verify payment reference with Paystack
  verifyWithPaystack: (reference) => adminApi.post("/login-fee/admin/verify-paystack", { reference })
};

/* =====================================================
   📦 DEFAULT EXPORT
===================================================== */
export default api;
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
  withCredentials: true, // ✅ required
});

/* 🔐 FORCE credentials on every request (prevents cookie drop) */
api.interceptors.request.use(
  (config) => {
    config.withCredentials = true;
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
   ⚠️ RESPONSE INTERCEPTOR
   - Prevent accidental forced logout
   - Only throw 401 for ProtectedRoute
===================================================== */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Allow non-critical routes to fail without logging out
    if (error?.response?.status === 401) {
      console.warn(
        "User request returned 401. Do not force logout here.",
        error.response?.data?.message
      );
    }
    return Promise.reject(error);
  }
);

adminApi.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default api;

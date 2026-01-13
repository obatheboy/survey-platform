import axios from "axios";

/* =====================================================
   🌍 BASE API URL
   (ensure no double /api)
===================================================== */
const RAW_BASE = import.meta.env.VITE_API_URL;
const BASE_URL = RAW_BASE.endsWith("/api")
  ? RAW_BASE
  : `${RAW_BASE}/api`;

/* =====================================================
   👤 USER API (COOKIE BASED)
===================================================== */
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // ✅ required
});

/* 🔐 FORCE credentials on every request (IMPORTANT) */
api.interceptors.request.use(
  (config) => {
    config.withCredentials = true; // 👈 prevents cookie drop
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
});

/* =====================================================
   🔐 ADMIN TOKEN ATTACHER
===================================================== */
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
   ❌ NO GLOBAL REDIRECTS — EVER
===================================================== */
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

adminApi.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default api;

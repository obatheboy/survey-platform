import axios from "axios";

/* =====================================================
   🌍 BASE API URL
===================================================== */
const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

/* =====================================================
   👤 USER API (COOKIE BASED)
   - Used by normal users
   - Uses HttpOnly cookies
===================================================== */
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // ✅ user auth cookies
});

/* =====================================================
   👑 ADMIN API (BEARER TOKEN)
   - Used only for admin routes
   - Uses Authorization header
===================================================== */
export const adminApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: false, // ❌ admins do NOT use cookies
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

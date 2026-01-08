import axios from "axios";

/* =====================================================
   🌍 AXIOS INSTANCE (API PREFIX FIXED)
===================================================== */
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`, // ✅ CRITICAL FIX
  withCredentials: true,
});

/* =====================================================
   ❌ NO REDIRECTS HERE — EVER
===================================================== */
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default api;

import axios from "axios";
import { getCacheBuster } from "../utils/cache";

/* ======================================
   🔐 ADMIN AXIOS INSTANCE
====================================== */

export const adminApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  withCredentials: true, // Send cookies if any
});

/* ======================================
   🔑 ATTACH ADMIN TOKEN (JWT) + VERSION
====================================== */

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn("⚠️ No adminToken found in localStorage");
  }

  // Append version parameter for cache busting
  const urlSeparator = config.url.includes('?') ? '&' : '?';
  config.url = `${config.url}${urlSeparator}${getCacheBuster()}`;

  return config;
});

/* ======================================
   🚨 HANDLE ADMIN AUTH ERRORS
====================================== */

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.error("❌ Admin authentication failed:", error.response?.data?.message);
      localStorage.removeItem("adminToken");
    }
    return Promise.reject(error);
  }
);

/* ======================================
    💰 LOGIN FEE ADMIN API
====================================== */

export const loginFeeAdminApi = {
  getAll: () => adminApi.get("/admin/login-fee/all"),
  getPending: () => adminApi.get("/admin/login-fee/pending"),
  approve: (userId) => adminApi.patch(`/admin/login-fee/${userId}/approve`),
  reject: (userId, reason) => adminApi.patch(`/admin/login-fee/${userId}/reject`, { reason })
};


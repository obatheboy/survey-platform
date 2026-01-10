import axios from "axios";

/* ======================================
   🔐 ADMIN AXIOS INSTANCE
====================================== */

export const adminApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
});

/* ======================================
   🔑 ATTACH ADMIN TOKEN (JWT)
====================================== */

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

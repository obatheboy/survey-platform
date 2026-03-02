import axios from "axios";

/* ======================================
   🔐 ADMIN AXIOS INSTANCE
====================================== */

export const adminApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  withCredentials: true, // Send cookies if any
});

/* ======================================
   🔑 ATTACH ADMIN TOKEN (JWT)
====================================== */

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn("⚠️ No adminToken found in localStorage");
  }

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
      // Don't redirect immediately - let component handle it
      // window.location.href = "/admin/login";
    }
    return Promise.reject(error);
  }
);

/* ======================================
   INITIAL ACTIVATION API CALLS
===================================== */

export const getPendingInitialActivations = () => 
  adminApi.get("/initial-activation/pending");

export const getAllInitialActivations = () => 
  adminApi.get("/initial-activation/all");

export const approveInitialActivation = (userId) => 
  adminApi.post("/initial-activation/approve", { userId });

export const rejectInitialActivation = (userId, reason) => 
  adminApi.post("/initial-activation/reject", { userId, reason });


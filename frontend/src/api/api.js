import axios from "axios";

/* =====================================================
   🌍 AXIOS INSTANCE
===================================================== */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // ✅ REQUIRED for HttpOnly cookies
});

/* =====================================================
   🔐 GLOBAL AUTH HANDLER (SAFE)
===================================================== */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || "";

    /**
     * 🔒 Redirect ONLY when session is truly invalid
     * That is ONLY confirmed via /auth/me
     */
    if (status === 401 && url.includes("/auth/me")) {
      const path = window.location.pathname;

      // Prevent infinite redirect loop
      if (!path.startsWith("/auth")) {
        window.location.replace("/auth");
      }
    }

    return Promise.reject(error);
  }
);

export default api;

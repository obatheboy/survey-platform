import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true, // ✅ REQUIRED for HttpOnly cookies
});

/* =====================================================
   🌍 GLOBAL AUTH HANDLER
   - Handles expired / invalid sessions
   - Redirects ONLY when truly unauthenticated
===================================================== */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    // ✅ Redirect only on AUTH failure
    if (status === 401) {
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

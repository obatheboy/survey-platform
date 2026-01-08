import axios from "axios";

/* =====================================================
   🌍 AXIOS INSTANCE
===================================================== */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // ✅ REQUIRED for HttpOnly cookies
});

/* =====================================================
   🚫 NO GLOBAL AUTH REDIRECTS
   - Axios must NEVER decide navigation
   - Pages (Dashboard, Surveys, etc.) handle auth
===================================================== */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // ❌ Do NOT redirect here
    // ❌ Do NOT inspect status codes here
    // ✔ Just forward the error
    return Promise.reject(error);
  }
);

export default api;

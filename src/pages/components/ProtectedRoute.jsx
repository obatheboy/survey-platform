import { useEffect, useState, useRef } from "react";
import { Navigate } from "react-router-dom";
import api from "../api/api";

/* ======================================================
   ProtectedRoute
   - Only logs out if token is expired or invalid (401)
   - Ignores 400/403 errors (like account not activated)
====================================================== */
export default function ProtectedRoute({ children }) {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    const checkAuth = async () => {
      try {
        const res = await api.get("/auth/me");
        if (res.data) {
          setAuthenticated(true);
        }
      } catch (err) {
        const status = err?.response?.status;
        // Only logout if truly unauthorized (expired token)
        if (status === 401) {
          setAuthenticated(false);
        } else {
          console.warn("ProtectedRoute ignored non-auth error:", err?.response?.data?.message || err.message);
          setAuthenticated(true); // Keep user logged in
        }
      } finally {
        setChecking(false);
      }
    };

    checkAuth();
  }, []);

  if (checking) return null; // or loader component

  if (!authenticated) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

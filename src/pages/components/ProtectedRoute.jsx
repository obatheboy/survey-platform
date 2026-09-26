import { useEffect, useState, useRef } from "react";
import { Navigate } from "react-router-dom";
import api from "../api/api";

/* ======================================================
   ProtectedRoute
   - Only logs out if token is truly expired (401)
   - Ignores 403 / 400 from other routes (welcome bonus, surveys, etc)
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
        // Only 401 from /auth/me should logout
        if (status === 401) {
          setAuthenticated(false);
        } else {
          console.warn(
            "Ignored non-critical API error (not logout):",
            err?.response?.data?.message || err.message
          );
          setAuthenticated(true);
        }
      } finally {
        setChecking(false);
      }
    };

    checkAuth();
  }, []);

  if (checking) return null; // loader optional

  if (!authenticated) return <Navigate to="/auth" replace />;

  return children;
}

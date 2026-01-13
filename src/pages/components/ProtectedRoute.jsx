import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../api/api";

/* ======================================================
   ProtectedRoute (FINAL FIX)
   - No premature logout
   - No race conditions
   - Safe for navigation (activation, withdraw, bonus)
====================================================== */
export default function ProtectedRoute({ children }) {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(null); // 🔥 IMPORTANT

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const res = await api.get("/auth/me");

        if (!isMounted) return;

        if (res.data) {
          setAuthenticated(true);
        } else {
          setAuthenticated(false);
        }
      } catch (err) {
        if (!isMounted) return;

        const status = err?.response?.status;

        // 🔐 Only treat 401 as real logout
        if (status === 401) {
          setAuthenticated(false);
        } else {
          // Ignore activation / permission / validation errors
          console.warn(
            "ProtectedRoute ignored non-auth error:",
            err?.response?.data?.message || err.message
          );
          setAuthenticated(true);
        }
      } finally {
        if (isMounted) {
          setChecking(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // ⏳ Still checking — NEVER redirect yet
  if (checking || authenticated === null) {
    return null; // or <Loader />
  }

  // 🔒 Truly logged out
  if (authenticated === false) {
    return <Navigate to="/auth" replace />;
  }

  // ✅ Authenticated
  return children;
}

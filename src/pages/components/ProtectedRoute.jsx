import { useEffect, useState, useRef } from "react";
import { Navigate } from "react-router-dom";
import api from "../api/api";

export default function ProtectedRoute({ children }) {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    api
      .get("/auth/me")
      .then(() => {
        setAuthenticated(true);
      })
      .catch((err) => {
        // 🚨 ONLY logout if backend says UNAUTHORIZED
        if (err?.response?.status === 401) {
          setAuthenticated(false);
        }
      })
      .finally(() => {
        setChecking(false);
      });
  }, []);

  if (checking) return null; // or loader

  if (!authenticated) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

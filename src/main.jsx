import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

const APP_VERSION = "2026-07-06-v2";

let versionCheckDone = false;

function enforceLatestVersion() {
  if (versionCheckDone || typeof window === "undefined") return;
  versionCheckDone = true;

  try {
    const stored = localStorage.getItem("app_version");
    if (stored && stored !== APP_VERSION) {
      localStorage.removeItem("app_version");
      localStorage.removeItem("login_fee_verified_temp");
      localStorage.removeItem("login_fee_verified_at");
      localStorage.removeItem("pendingLoginUser");
      sessionStorage.clear();
      if ("caches" in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        });
      }
      localStorage.setItem("app_version", APP_VERSION);
      return;
    }
    if (!stored) {
      localStorage.setItem("app_version", APP_VERSION);
    }
  } catch {
    // ignore storage errors during version enforcement
  }
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {
    // SW registration failed; continue without offline support
  });
}

enforceLatestVersion();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

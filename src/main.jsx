import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

const APP_VERSION = "2026-07-06-v2";

function enforceLatestVersion() {
  try {
    const stored = localStorage.getItem("app_version");
    if (stored && stored !== APP_VERSION) {
      localStorage.removeItem("app_version");
      localStorage.removeItem("pwa-install-dismissed");
      localStorage.removeItem("hasSeenInstallPrompt");
      localStorage.removeItem("hasInstallPromptShown");
      localStorage.removeItem("login_fee_verified_temp");
      localStorage.removeItem("login_fee_verified_at");
      localStorage.removeItem("pendingLoginUser");
      sessionStorage.clear();
      if ("caches" in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        });
      }
      window.location.reload();
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
  navigator.serviceWorker.register("/sw.js").then((swRegistration) => {
    if (swRegistration) {
      swRegistration.addEventListener("updatefound", () => {
        const newWorker = swRegistration.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              window.location.reload();
            }
          });
        }
      });
    }
  }).catch(() => {
    // SW registration failed; continue without offline support
  });
}

enforceLatestVersion();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

import { useState, useEffect } from 'react';
import './PWAInstallPrompt.css';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstalling(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (!isIOS) {
      setTimeout(() => {
        setIsInstalling(true);
      }, 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      setDeferredPrompt(null);
      return;
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      window.location.href = 'https://wa.me/254752881670?text=Hello,%20I%20need%20help%20installing%20the%20app';
    }
  };

  if (!isInstalling) return null;

  return (
    <div className="pwa-prompt-overlay">
      <div className="pwa-prompt">
        <div className="pwa-icon">📱</div>
        <h3>Installing App...</h3>
        <p>Please wait while we install Survey Platform to your device.</p>
        <div className="pwa-actions">
          <button className="btn-install" onClick={handleInstall}>
            ✓ Install Now
          </button>
        </div>
      </div>
    </div>
  );
}

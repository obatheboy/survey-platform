import { useState, useEffect, useRef } from 'react';
import './PWAInstallPrompt.css';

export default function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const deferredPrompt = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      deferredPrompt.current = e;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    setTimeout(() => {
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
    
    if (deferredPrompt.current) {
      deferredPrompt.current.prompt();
      const { outcome } = await deferredPrompt.current.userChoice;
      if (outcome === 'accepted') {
        console.log('App installed successfully');
      }
    }
  };

  const handleSkip = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="pwa-overlay" onClick={handleSkip}>
      <div className="pwa-card" onClick={(e) => e.stopPropagation()}>
        <button className="pwa-close-btn" onClick={handleSkip}>×</button>
        <div className="pwa-icon">📱</div>
        <h3>Add to Home Screen</h3>
        <p>For quick access and offline use</p>
        <div className="pwa-btns">
          <button className="pwa-install-btn" onClick={handleInstall}>
            Install App
          </button>
          <button className="pwa-skip-btn" onClick={handleSkip}>
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}

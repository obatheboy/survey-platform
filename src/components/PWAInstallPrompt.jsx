import { useState, useEffect } from 'react';
import './PWAInstallPrompt.css';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (!isIOS) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    } else {
      setShowPrompt(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
      setShowPrompt(false);
    } else {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        window.location.href = 'https://wa.me/254752881670?text=Hello,%20I%20need%20help%20installing%20the%20app';
      } else {
        setShowPrompt(false);
      }
    }
  };

  const handleSkip = () => {
    setShowPrompt(false);
  };

  if (isInstalled) return null;
  if (!showPrompt) return null;

  return (
    <div className="pwa-prompt-overlay" onClick={handleSkip}>
      <div className="pwa-prompt" onClick={(e) => e.stopPropagation()}>
        <button className="pwa-close" onClick={handleSkip}>×</button>
        
        <div className="pwa-icon">📱</div>
        
        <h3>Install App</h3>
        <p>Add to home screen for the best experience!</p>

        <div className="pwa-actions">
          <button className="btn-install" onClick={handleInstall}>
            ✓ Install Now
          </button>
          <button className="btn-skip" onClick={handleSkip}>
            Skip - Continue to Website
          </button>
        </div>
      </div>
    </div>
  );
}

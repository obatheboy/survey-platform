import { useState, useEffect } from 'react';
import './PWAInstallPrompt.css';

export default function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(ios);

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    setTimeout(() => {
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    }, 4000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
    
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    }
  };

  const handleSkip = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="pwa-prompt-overlay" onClick={handleSkip}>
      <div className="pwa-prompt" onClick={(e) => e.stopPropagation()}>
        <button className="pwa-close" onClick={handleSkip}>×</button>
        
        <div className="pwa-icon">📱</div>
        
        <h3>Add to Home Screen</h3>
        <p className="pwa-subtitle">
          {isIOS 
            ? 'Tap Share, then "Add to Home Screen"' 
            : 'Tap the menu and select "Add to Home Screen"'}
        </p>

        <div className="pwa-actions">
          <button className="btn-install" onClick={handleInstall}>
            {deferredPrompt ? '📲 Install App' : '✓ Got it!'}
          </button>
          <button className="btn-skip" onClick={handleSkip}>
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}

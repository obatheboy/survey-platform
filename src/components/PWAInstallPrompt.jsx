import { useState, useEffect } from 'react';
import './PWAInstallPrompt.css';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    let shouldShowSoon = false;
    
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      
      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        return;
      }
    } else {
      shouldShowSoon = true;
    }

    // Check if this is a fresh login (within last 24 hours)
    const lastLogin = localStorage.getItem('lastLoginTime');
    const isFreshLogin = lastLogin && (Date.now() - parseInt(lastLogin)) < 24 * 60 * 60 * 1000;

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show immediately for fresh login or first time users, otherwise after delay
      if (isFreshLogin || shouldShowSoon) {
        setTimeout(() => {
          setShowPrompt(true);
        }, 2000);
      } else {
        setTimeout(() => {
          setShowPrompt(true);
        }, 30000);
      }
    };

    // For fresh login without beforeinstallprompt, show after 2 seconds
    if (isFreshLogin || shouldShowSoon) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
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
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }

      setDeferredPrompt(null);
      setShowPrompt(false);
      return;
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      alert('To install: Tap the Share button (⬆️) in Safari, then select "Add to Home Screen"');
      return;
    }

    if (navigator.standalone) {
      return;
    }

    alert('To install this app:\n\n1. Look for the install icon in your browser address bar\nOR\n2. Go to Menu → Install Survey Platform');
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="pwa-prompt-overlay">
      <div className="pwa-prompt">
        <button className="pwa-close" onClick={handleDismiss}>×</button>
        
        <div className="pwa-icon">📱</div>
        
        <h3>Install Survey Platform</h3>
        <p>
          Add our app to your home screen for quick access and a better experience!
        </p>

        <div className="pwa-benefits">
          <div className="benefit">
            <span className="benefit-icon">⚡</span>
            <span>Faster loading</span>
          </div>
          <div className="benefit">
            <span className="benefit-icon">📴</span>
            <span>Works offline</span>
          </div>
          <div className="benefit">
            <span className="benefit-icon">🔔</span>
            <span>Push notifications</span>
          </div>
        </div>

        <div className="pwa-actions">
          <button className="btn-install" onClick={handleInstall}>
            Install App
          </button>
          <button className="btn-later" onClick={handleDismiss}>
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import './PWAInstallPrompt.css';

export default function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredAvailable, setDeferredAvailable] = useState(false);
  const [isFacebookMessenger, setIsFacebookMessenger] = useState(false);
  const deferredPrompt = useRef(null);

  useEffect(() => {
    // Already installed as standalone
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
      return;
    }

    // Detect Facebook Messenger WebView
    const ua = navigator.userAgent || '';
    const isFB = /FB4A|FB_IAB|FBAV|Messenger/i.test(ua) ||
                 /Android.*Chrome\/(?!.*Edge)/i.test(ua) && /FB/i.test(ua);
    setIsFacebookMessenger(isFB);

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      deferredPrompt.current = e;
      setDeferredAvailable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // If no beforeinstallprompt event after 4 seconds, assume not supported
    // (common in Facebook Messenger WebView)
    const fallbackTimer = setTimeout(() => {
      if (!deferredPrompt.current) {
        setDeferredAvailable(false);
      }
    }, 4000);

    // Show prompt after a delay if not standalone and not dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (!dismissed) {
      // Delay showing to let page load
      setTimeout(() => {
        if (!window.matchMedia('(display-mode: standalone)').matches) {
          setShowPrompt(true);
        }
      }, 4000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      clearTimeout(fallbackTimer);
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
    } else if (isFacebookMessenger) {
      // Fallback: show manual instructions
      alert(
        'To install this app in Facebook Messenger:\n\n' +
        '1. Tap the menu (⋮) at the top right\n' +
        '2. Select "Open in Browser" or "Open in Chrome/Safari"\n' +
        '3. Then use your browser\'s "Add to Home Screen" feature\n\n' +
        'Or simply open this link in Chrome/Safari directly.'
      );
    }
  };

  const handleSkip = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  const handleOpenInBrowser = () => {
    // Try to open in external browser
    const url = window.location.href;
    window.open(url, '_blank');
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <div className="pwa-overlay" onClick={handleSkip}>
      <div className="pwa-card" onClick={(e) => e.stopPropagation()}>
        <button className="pwa-close-btn" onClick={handleSkip}>×</button>
        <div className="pwa-icon">📱</div>
        <h3>Add to Home Screen</h3>
        <p>For quick access and offline use</p>

        {isFacebookMessenger && !deferredAvailable && (
          <div className="pwa-messenger-note" style={{
            background: 'rgba(25, 118, 210, 0.15)',
            border: '1px solid rgba(25, 118, 210, 0.4)',
            borderRadius: '8px',
            padding: '10px 12px',
            margin: '8px 0',
            fontSize: '12px',
            color: '#1565c0',
            fontWeight: 600,
            textAlign: 'center',
            lineHeight: 1.5
          }}>
            ⚠️ Facebook Messenger doesn't support direct installation.<br/>
            Tap "Open in Browser" below to install via Chrome/Safari.
          </div>
        )}

        <div className="pwa-btns">
          {isFacebookMessenger && !deferredAvailable ? (
            <>
              <button className="pwa-install-btn" onClick={handleOpenInBrowser}>
                🌐 Open in Browser
              </button>
              <button className="pwa-skip-btn" onClick={handleSkip}>
                Skip
              </button>
            </>
          ) : (
            <>
              <button className="pwa-install-btn" onClick={handleInstall}>
                Install App
              </button>
              <button className="pwa-skip-btn" onClick={handleSkip}>
                Skip
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
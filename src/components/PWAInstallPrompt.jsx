import { useState, useEffect, useRef } from 'react';
import './PWAInstallPrompt.css';

export default function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredAvailable, setDeferredAvailable] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const deferredPrompt = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
      return;
    }

    const ua = navigator.userAgent || '';
    const isFB = /FB4A|FB_IAB|FBAV|Messenger|Instagram|Twitter|Snapchat|LinkedIn|Pinterest|Tiktok|Microsoft-Edge/i.test(ua);
    const isAndroid = /Android/i.test(ua);
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    // Match any Chromium-based browser that fires the beforeinstallprompt
    // event on Android: Chrome, Edge, Samsung Internet, Opera, DuckDuckGo, etc.
    const isChromium = /Chrome|CriOS|Edg|SamsungBrowser|Opera|OPR|DuckDuckGo/i.test(ua);
    const isChrome = /Chrome/i.test(ua) && !/Edg/i.test(ua) && !/SamsungBrowser/i.test(ua) && !/Opera|OPR/i.test(ua);
    const isSafari = /Safari/i.test(ua) && !/Chrome/i.test(ua) && !/FBIAB/i.test(ua);

    const inApp = isFB || (isAndroid && !isChromium) || (isIOS && !isSafari);
    setIsInAppBrowser(inApp);

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      deferredPrompt.current = e;
      setDeferredAvailable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    const fallbackTimer = setTimeout(() => {
      if (!deferredPrompt.current) {
        setDeferredAvailable(false);
      }
    }, 5000);

    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (!dismissed) {
      setTimeout(() => {
        if (!window.matchMedia('(display-mode: standalone)').matches) {
          setShowPrompt(true);
        }
      }, 5000);
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
    }
  };

  const handleSkip = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  const handleCopyLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setToastCopied(true);
      setTimeout(() => setToastCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setToastCopied(true);
      setTimeout(() => setToastCopied(false), 2000);
    }
  };

  const [toastCopied, setToastCopied] = useState(false);

  if (isStandalone || !showPrompt) return null;

  return (
    <div className="pwa-overlay" onClick={handleSkip}>
      <div className="pwa-card" onClick={(e) => e.stopPropagation()}>
        <button className="pwa-close-btn" onClick={handleSkip}>×</button>
        <div className="pwa-icon">📱</div>
        <h3>Add to Home Screen</h3>
        <p>Get quick access and offline use</p>

        {isInAppBrowser && !deferredAvailable && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.2), rgba(25, 118, 210, 0.05))',
            border: '2px solid rgba(25, 118, 210, 0.5)',
            borderRadius: '12px',
            padding: '16px',
            margin: '10px 0',
            fontSize: '13px',
            color: '#1565c0',
            fontWeight: 700,
            textAlign: 'center',
            lineHeight: 1.6
          }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>⚠️</div>
            <strong>This app can't be installed from inside Facebook/Messenger or this browser.</strong><br/>
            <span style={{ fontWeight: 400, fontSize: '12px', color: '#0d47a1' }}>
              Please open this link in Chrome, Edge, or Samsung Internet to install.
            </span>
          </div>
        )}

        <div className="pwa-btns">
          {isInAppBrowser && !deferredAvailable ? (
            <>
              <button
                className="pwa-install-btn"
                onClick={handleCopyLink}
                style={{
                  background: toastCopied
                    ? 'linear-gradient(135deg, #16a34a, #15803d)'
                    : 'linear-gradient(135deg, #1565c0, #0d47a1)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '14px 24px',
                  fontSize: '15px',
                  fontWeight: '800',
                  color: 'white',
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(25, 118, 210, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  transition: 'all 0.3s ease'
                }}
              >
                {toastCopied ? '✅ Link Copied!' : '📋 Copy Link'}
              </button>
              <button
                className="pwa-skip-btn"
                onClick={handleSkip}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '10px',
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'rgba(255,255,255,0.7)',
                  cursor: 'pointer',
                  width: '100%',
                  marginTop: '8px'
                }}
              >
                Maybe Later
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
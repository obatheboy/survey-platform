let deferredPrompt = null;

export function getDeferredPrompt() {
  return deferredPrompt;
}

export function setDeferredPrompt(event) {
  deferredPrompt = event;
}

export function clearDeferredPrompt() {
  deferredPrompt = null;
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });
}

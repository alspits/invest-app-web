/**
 * PWA Utility Functions
 * Helper functions for working with PWA features
 */

/**
 * Check if app is running as installed PWA
 */
export function isInstalled(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

/**
 * Check if app is installable
 */
export function isInstallable(): boolean {
  if (typeof window === 'undefined') return false;

  return 'BeforeInstallPromptEvent' in window;
}

/**
 * Check if Service Worker is supported
 */
export function isServiceWorkerSupported(): boolean {
  if (typeof window === 'undefined') return false;

  return 'serviceWorker' in navigator;
}

/**
 * Check if Push API is supported
 */
export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

/**
 * Check if app is online
 */
export function isOnline(): boolean {
  if (typeof window === 'undefined') return true;

  return navigator.onLine;
}

/**
 * Register online/offline event listeners
 */
export function registerNetworkListeners(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}

/**
 * Get Service Worker registration
 */
export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) {
    return null;
  }

  try {
    return (await navigator.serviceWorker.getRegistration()) || null;
  } catch (error) {
    console.error('[PWA] Failed to get SW registration:', error);
    return null;
  }
}

/**
 * Update Service Worker
 */
export async function updateServiceWorker(): Promise<boolean> {
  const registration = await getServiceWorkerRegistration();

  if (!registration) {
    return false;
  }

  try {
    await registration.update();
    return true;
  } catch (error) {
    console.error('[PWA] Failed to update SW:', error);
    return false;
  }
}

/**
 * Clear all caches
 */
export async function clearAllCaches(): Promise<boolean> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return false;
  }

  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
    return true;
  } catch (error) {
    console.error('[PWA] Failed to clear caches:', error);
    return false;
  }
}

/**
 * Get cache size (approximate)
 */
export async function getCacheSize(): Promise<number> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return 0;
  }

  try {
    const cacheNames = await caches.keys();
    let totalSize = 0;

    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const keys = await cache.keys();

      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
    }

    return totalSize;
  } catch (error) {
    console.error('[PWA] Failed to calculate cache size:', error);
    return 0;
  }
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Math.round(bytes / Math.pow(k, i) * 100) / 100} ${sizes[i]}`;
}

/**
 * Check if notification permission is granted
 */
export function hasNotificationPermission(): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  return Notification.permission === 'granted';
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  try {
    return await Notification.requestPermission();
  } catch (error) {
    console.error('[PWA] Failed to request notification permission:', error);
    return 'denied';
  }
}

/**
 * Show local notification (does not require server)
 */
export async function showLocalNotification(
  title: string,
  options?: NotificationOptions
): Promise<Notification | null> {
  if (!hasNotificationPermission()) {
    console.warn('[PWA] Notification permission not granted');
    return null;
  }

  try {
    const registration = await getServiceWorkerRegistration();

    if (registration) {
      // Use Service Worker notification (persists in background)
      await registration.showNotification(title, {
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        ...options,
      });
      return null;
    } else {
      // Fallback to regular notification
      return new Notification(title, {
        icon: '/icon-192x192.png',
        ...options,
      });
    }
  } catch (error) {
    console.error('[PWA] Failed to show notification:', error);
    return null;
  }
}

/**
 * Get install prompt event
 * Must be called during 'beforeinstallprompt' event
 */
let deferredPrompt: any = null;

export function setupInstallPrompt() {
  if (typeof window === 'undefined') return;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });
}

/**
 * Show install prompt
 */
export async function showInstallPrompt(): Promise<boolean> {
  if (!deferredPrompt) {
    console.warn('[PWA] Install prompt not available');
    return false;
  }

  try {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    return outcome === 'accepted';
  } catch (error) {
    console.error('[PWA] Failed to show install prompt:', error);
    return false;
  }
}

/**
 * Check if install prompt is available
 */
export function isInstallPromptAvailable(): boolean {
  return deferredPrompt !== null;
}

/**
 * Get app display mode
 */
export function getDisplayMode(): 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser' {
  if (typeof window === 'undefined') return 'browser';

  const mqStandalone = window.matchMedia('(display-mode: standalone)');
  const mqFullscreen = window.matchMedia('(display-mode: fullscreen)');
  const mqMinimalUi = window.matchMedia('(display-mode: minimal-ui)');

  if (mqFullscreen.matches) return 'fullscreen';
  if (mqStandalone.matches) return 'standalone';
  if (mqMinimalUi.matches) return 'minimal-ui';

  return 'browser';
}

/**
 * Detect platform
 */
export function getPlatform(): 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown' {
  if (typeof window === 'undefined') return 'unknown';

  const ua = window.navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  if (/windows/.test(ua)) return 'windows';
  if (/mac/.test(ua)) return 'macos';
  if (/linux/.test(ua)) return 'linux';

  return 'unknown';
}

/**
 * Check if running on iOS
 */
export function isIOS(): boolean {
  return getPlatform() === 'ios';
}

/**
 * Check if running on Android
 */
export function isAndroid(): boolean {
  return getPlatform() === 'android';
}

/**
 * Get connection type
 */
export function getConnectionType(): string {
  if (typeof window === 'undefined') return 'unknown';

  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

  if (!connection) return 'unknown';

  return connection.effectiveType || 'unknown';
}

/**
 * Check if connection is slow
 */
export function isSlowConnection(): boolean {
  const type = getConnectionType();
  return type === 'slow-2g' || type === '2g';
}

/**
 * Preload route for instant navigation
 */
export async function preloadRoute(url: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return false;
  }

  try {
    const cache = await caches.open('invest-app-v1.0.0');
    const response = await fetch(url);

    if (response.ok) {
      await cache.put(url, response);
      return true;
    }

    return false;
  } catch (error) {
    console.error('[PWA] Failed to preload route:', error);
    return false;
  }
}

/**
 * Share content using Web Share API
 */
export async function shareContent(data: ShareData): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.share) {
    console.warn('[PWA] Web Share API not supported');
    return false;
  }

  try {
    await navigator.share(data);
    return true;
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      console.error('[PWA] Failed to share:', error);
    }
    return false;
  }
}

/**
 * Copy to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch (error) {
    console.error('[PWA] Failed to copy to clipboard:', error);
    return false;
  }
}

'use client';

import { useEffect, useState } from 'react';

/**
 * PWA Service Worker Registration Component
 * Handles SW registration, updates, and user notifications
 */
export function PWARegistration() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('[PWA] Service Workers not supported');
      return;
    }

    // Register service worker
    registerServiceWorker();

    // Check for updates every hour
    const updateInterval = setInterval(() => {
      checkForUpdates();
    }, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(updateInterval);
  }, []);

  /**
   * Unregister all service workers (for development)
   */
  async function unregisterServiceWorker() {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();

      for (const registration of registrations) {
        await registration.unregister();
        console.log('[PWA] Service Worker unregistered:', registration.scope);
      }

      // Clear all caches
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
        console.log('[PWA] Cache deleted:', cacheName);
      }

      console.log('[PWA] All Service Workers and caches cleared');
    } catch (error) {
      console.error('[PWA] Failed to unregister Service Workers:', error);
    }
  }

  /**
   * Register service worker with error handling
   */
  async function registerServiceWorker() {
    try {
      // CRITICAL: Disable Service Worker in development mode
      // Localhost does not fully support SW features and causes errors
      if (process.env.NODE_ENV === 'development') {
        console.log('[PWA] Development mode - Service Worker disabled');
        console.log('[PWA] Cleaning up any existing Service Workers...');
        await unregisterServiceWorker();
        console.log('[PWA] PWA features will be available in production build');
        return;
      }

      const isProduction = process.env.NODE_ENV === 'production';

      // Register with absolute path (more reliable for Next.js/Turbopack)
      // Add cache-busting parameter to ensure fresh SW fetch
      const swPath = isProduction ? '/sw.js' : `/sw.js?v=${Date.now()}`;
      const registration = await navigator.serviceWorker.register(swPath, {
        scope: '/',
        updateViaCache: 'none', // Always fetch fresh SW in production
      });

      console.log('[PWA] Service Worker registered:', registration.scope);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;

        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available
            console.log('[PWA] New version available');
            setWaitingWorker(newWorker);
            setShowUpdatePrompt(true);
          }
        });
      });

      // Check for updates on page load
      registration.update();
    } catch (error) {
      const err = error as Error;
      console.error('[PWA] Service Worker registration failed:', err.message);

      // Provide helpful error message
      if (process.env.NODE_ENV === 'development') {
        console.log('[PWA] Development tips:');
        console.log('  1. Ensure sw.js exists in /public directory');
        console.log('  2. Restart Next.js dev server after adding sw.js');
        console.log('  3. Clear browser cache and reload');
      }
    }
  }

  /**
   * Check for service worker updates
   */
  async function checkForUpdates() {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
      }
    } catch (error) {
      console.error('[PWA] Update check failed:', error);
    }
  }

  /**
   * Apply update and reload page
   */
  function applyUpdate() {
    if (!waitingWorker) return;

    // Send message to skip waiting
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });

    // Reload when new SW takes control
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }

  /**
   * Dismiss update prompt
   */
  function dismissUpdate() {
    setShowUpdatePrompt(false);
  }

  // Update prompt UI
  if (showUpdatePrompt) {
    return (
      <div className="fixed bottom-4 right-4 max-w-sm bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-4 z-50 animate-slide-up">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg
              className="w-6 h-6 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>

          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white mb-1">
              Доступно обновление
            </h3>
            <p className="text-xs text-slate-300 mb-3">
              Новая версия приложения готова к установке
            </p>

            <div className="flex gap-2">
              <button
                onClick={applyUpdate}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded transition-colors"
              >
                Обновить
              </button>
              <button
                onClick={dismissUpdate}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded transition-colors"
              >
                Позже
              </button>
            </div>
          </div>

          <button
            onClick={dismissUpdate}
            className="flex-shrink-0 text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return null;
}

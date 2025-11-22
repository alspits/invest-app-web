'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

/**
 * Offline fallback page
 * Shows when user is offline and tries to navigate
 */
export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [cachedData, setCachedData] = useState<{
    portfolio?: string;
    lastUpdate?: string;
  }>({});

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Try to load cached portfolio data
    loadCachedData();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Load cached portfolio data from IndexedDB or localStorage
   */
  async function loadCachedData() {
    try {
      // Try to get data from cache
      if ('caches' in window) {
        const cache = await caches.open('invest-app-v1.0.0');
        const response = await cache.match('/api/tinkoff/portfolio');

        if (response) {
          const data = await response.json();
          setCachedData({
            portfolio: JSON.stringify(data, null, 2),
            lastUpdate: new Date().toLocaleString('ru-RU'),
          });
        }
      }
    } catch (error) {
      console.error('[Offline] Failed to load cached data:', error);
    }
  }

  /**
   * Retry connection
   */
  function retryConnection() {
    window.location.reload();
  }

  // Auto-redirect when online
  useEffect(() => {
    if (isOnline) {
      const timer = setTimeout(() => {
        window.location.href = '/';
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Offline indicator */}
        <div className="text-center mb-8">
          {isOnline ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-900/50 border border-green-700 rounded-full text-green-400 mb-4">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium">Подключение восстановлено</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-900/50 border border-orange-700 rounded-full text-orange-400 mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
                />
              </svg>
              <span className="text-sm font-medium">Нет подключения к интернету</span>
            </div>
          )}

          <h1 className="text-4xl font-bold text-white mb-2">
            {isOnline ? 'Подключение восстановлено!' : 'Вы офлайн'}
          </h1>
          <p className="text-slate-400">
            {isOnline
              ? 'Перенаправление на главную страницу...'
              : 'Проверьте подключение к интернету'}
          </p>
        </div>

        {/* Main content card */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl shadow-xl p-6 mb-6">
          {isOnline ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-slate-300">Загрузка актуальных данных...</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-orange-900/50 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-orange-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Режим офлайн</h2>
                  <p className="text-sm text-slate-400">
                    Некоторые функции могут быть недоступны
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-slate-300 mb-2">
                    Доступные функции:
                  </h3>
                  <ul className="space-y-2 text-sm text-slate-400">
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Просмотр кэшированных данных портфеля
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Просмотр сохраненной аналитики
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Обновление данных (требуется подключение)
                    </li>
                  </ul>
                </div>

                {cachedData.portfolio && (
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-slate-300">
                        Кэшированные данные
                      </h3>
                      {cachedData.lastUpdate && (
                        <span className="text-xs text-slate-500">
                          Обновлено: {cachedData.lastUpdate}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      У вас есть сохраненные данные портфеля
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={retryConnection}
                  className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Повторить попытку
                </button>

                <Link
                  href="/"
                  className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg transition-colors"
                >
                  На главную
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Tips section */}
        {!isOnline && (
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-2">Советы:</h3>
            <ul className="space-y-1 text-xs text-slate-400">
              <li>• Проверьте подключение Wi-Fi или мобильные данные</li>
              <li>• Убедитесь, что режим полета отключен</li>
              <li>• Попробуйте перезагрузить роутер</li>
              <li>• Кэшированные данные остаются доступны</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

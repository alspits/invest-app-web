'use client';

import { useEffect, useState } from 'react';
import { useNotificationStore } from '@/stores/notificationStore';

/**
 * Notification Settings Component
 * Allows users to manage push notification preferences
 */
export function NotificationSettings() {
  const {
    permission,
    isSupported,
    subscription,
    settings,
    checkSupport,
    requestPermission,
    subscribe,
    unsubscribe,
    updateSettings,
    sendTestNotification,
  } = useNotificationStore();

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkSupport();
  }, [checkSupport]);

  /**
   * Handle enable notifications
   */
  async function handleEnable() {
    setIsLoading(true);
    try {
      const granted = await requestPermission();
      if (granted) {
        await subscribe();
      }
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Handle disable notifications
   */
  async function handleDisable() {
    setIsLoading(true);
    try {
      await unsubscribe();
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Handle test notification
   */
  async function handleTest() {
    setIsLoading(true);
    try {
      await sendTestNotification();
    } finally {
      setIsLoading(false);
    }
  }

  // Not supported
  if (!isSupported) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-orange-900/50 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-orange-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">
              Уведомления недоступны
            </h3>
            <p className="text-sm text-slate-400">
              Ваш браузер не поддерживает push-уведомления. Попробуйте использовать
              современный браузер (Chrome, Firefox, Safari).
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Permission denied
  if (permission === 'denied') {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-red-900/50 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">
              Уведомления заблокированы
            </h3>
            <p className="text-sm text-slate-400 mb-3">
              Вы заблокировали уведомления для этого сайта. Разблокируйте их в настройках
              браузера, чтобы получать обновления портфеля.
            </p>
            <p className="text-xs text-slate-500">
              Chrome: Настройки → Конфиденциальность → Настройки сайта → Уведомления
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700">
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-900/50 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Push-уведомления
              </h3>
              <p className="text-sm text-slate-400">
                {subscription
                  ? 'Уведомления включены'
                  : 'Получайте обновления портфеля'}
              </p>
            </div>
          </div>

          {/* Enable/Disable toggle */}
          {permission === 'granted' && subscription ? (
            <button
              onClick={handleDisable}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isLoading ? 'Отключение...' : 'Отключить'}
            </button>
          ) : (
            <button
              onClick={handleEnable}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isLoading ? 'Включение...' : 'Включить'}
            </button>
          )}
        </div>
      </div>

      {/* Settings (only if subscribed) */}
      {subscription && (
        <>
          <div className="p-6 space-y-4">
            <h4 className="text-sm font-medium text-slate-300 mb-3">
              Типы уведомлений
            </h4>

            {/* Price alerts */}
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-700 group-hover:bg-slate-600 rounded-lg flex items-center justify-center transition-colors">
                  <svg
                    className="w-4 h-4 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-white">
                    Ценовые оповещения
                  </div>
                  <div className="text-xs text-slate-400">
                    Уведомления о значительных изменениях цен
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.priceAlerts}
                onChange={(e) => updateSettings({ priceAlerts: e.target.checked })}
                className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-0"
              />
            </label>

            {/* Portfolio updates */}
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-700 group-hover:bg-slate-600 rounded-lg flex items-center justify-center transition-colors">
                  <svg
                    className="w-4 h-4 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-white">
                    Обновления портфеля
                  </div>
                  <div className="text-xs text-slate-400">
                    Ежедневные отчеты о состоянии портфеля
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.portfolioUpdates}
                onChange={(e) =>
                  updateSettings({ portfolioUpdates: e.target.checked })
                }
                className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-0"
              />
            </label>

            {/* News alerts */}
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-700 group-hover:bg-slate-600 rounded-lg flex items-center justify-center transition-colors">
                  <svg
                    className="w-4 h-4 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Новости</div>
                  <div className="text-xs text-slate-400">
                    Важные новости о ваших активах
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.newsAlerts}
                onChange={(e) => updateSettings({ newsAlerts: e.target.checked })}
                className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-0"
              />
            </label>

            {/* Goal achievements */}
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-700 group-hover:bg-slate-600 rounded-lg flex items-center justify-center transition-colors">
                  <svg
                    className="w-4 h-4 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-white">
                    Достижение целей
                  </div>
                  <div className="text-xs text-slate-400">
                    Когда вы достигаете инвестиционных целей
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.goalAchievements}
                onChange={(e) =>
                  updateSettings({ goalAchievements: e.target.checked })
                }
                className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-0"
              />
            </label>
          </div>

          {/* Test notification */}
          <div className="p-6 border-t border-slate-700">
            <button
              onClick={handleTest}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {isLoading ? 'Отправка...' : 'Отправить тестовое уведомление'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import {
  isInstalled,
  isServiceWorkerSupported,
  isPushSupported,
  isOnline,
  getCacheSize,
  formatBytes,
  getDisplayMode,
  getPlatform,
  getConnectionType,
  clearAllCaches,
  updateServiceWorker,
  showInstallPrompt,
  isInstallPromptAvailable,
} from '@/lib/pwa-utils';

/**
 * PWA Status Component
 * Shows PWA installation status and diagnostics
 */
export function PWAStatus() {
  const [status, setStatus] = useState({
    installed: false,
    swSupported: false,
    pushSupported: false,
    online: true,
    cacheSize: 0,
    displayMode: 'browser' as ReturnType<typeof getDisplayMode>,
    platform: 'unknown' as ReturnType<typeof getPlatform>,
    connectionType: 'unknown',
    installable: false,
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadStatus();

    // Update online status
    const handleOnline = () => setStatus((s) => ({ ...s, online: true }));
    const handleOffline = () => setStatus((s) => ({ ...s, online: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  async function loadStatus() {
    const cacheSize = await getCacheSize();

    setStatus({
      installed: isInstalled(),
      swSupported: isServiceWorkerSupported(),
      pushSupported: isPushSupported(),
      online: isOnline(),
      cacheSize,
      displayMode: getDisplayMode(),
      platform: getPlatform(),
      connectionType: getConnectionType(),
      installable: isInstallPromptAvailable(),
    });
  }

  async function handleClearCache() {
    setIsLoading(true);
    try {
      await clearAllCaches();
      await loadStatus();
      alert('Кэш успешно очищен');
    } catch (error) {
      alert('Ошибка при очистке кэша');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpdate() {
    setIsLoading(true);
    try {
      await updateServiceWorker();
      alert('Обновление запущено. Перезагрузите страницу.');
    } catch (error) {
      alert('Ошибка при обновлении');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleInstall() {
    const success = await showInstallPrompt();
    if (success) {
      await loadStatus();
    }
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700">
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
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
                d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Статус PWA</h3>
            <p className="text-sm text-slate-400">
              Информация о Progressive Web App
            </p>
          </div>
        </div>
      </div>

      {/* Status Grid */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Installation */}
        <StatusItem
          label="Установлено"
          value={status.installed ? 'Да' : 'Нет'}
          icon={status.installed ? '✅' : '❌'}
          good={status.installed}
        />

        {/* Service Worker */}
        <StatusItem
          label="Service Worker"
          value={status.swSupported ? 'Поддерживается' : 'Не поддерживается'}
          icon={status.swSupported ? '✅' : '❌'}
          good={status.swSupported}
        />

        {/* Push Notifications */}
        <StatusItem
          label="Push-уведомления"
          value={status.pushSupported ? 'Поддерживаются' : 'Не поддерживаются'}
          icon={status.pushSupported ? '✅' : '❌'}
          good={status.pushSupported}
        />

        {/* Online Status */}
        <StatusItem
          label="Подключение"
          value={status.online ? 'Онлайн' : 'Офлайн'}
          icon={status.online ? '🟢' : '🔴'}
          good={status.online}
        />

        {/* Cache Size */}
        <StatusItem
          label="Размер кэша"
          value={formatBytes(status.cacheSize)}
          icon="💾"
        />

        {/* Display Mode */}
        <StatusItem
          label="Режим отображения"
          value={status.displayMode}
          icon="🖥️"
        />

        {/* Platform */}
        <StatusItem label="Платформа" value={status.platform} icon="📱" />

        {/* Connection Type */}
        <StatusItem
          label="Тип соединения"
          value={status.connectionType}
          icon="📡"
        />
      </div>

      {/* Actions */}
      <div className="p-6 border-t border-slate-700 flex flex-wrap gap-3">
        {status.installable && (
          <button
            onClick={handleInstall}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Установить приложение
          </button>
        )}

        {status.swSupported && (
          <button
            onClick={handleUpdate}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {isLoading ? 'Обновление...' : 'Обновить SW'}
          </button>
        )}

        <button
          onClick={handleClearCache}
          disabled={isLoading}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {isLoading ? 'Очистка...' : 'Очистить кэш'}
        </button>

        <button
          onClick={loadStatus}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Обновить статус
        </button>
      </div>

      {/* Info */}
      <div className="p-6 border-t border-slate-700 bg-slate-900/50">
        <p className="text-xs text-slate-400">
          💡 Совет: Установите приложение на домашний экран для лучшего
          пользовательского опыта и быстрого доступа.
        </p>
      </div>
    </div>
  );
}

/**
 * Status Item Component
 */
function StatusItem({
  label,
  value,
  icon,
  good,
}: {
  label: string;
  value: string;
  icon: string;
  good?: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className="text-sm text-slate-400">{label}</span>
      </div>
      <span
        className={`text-sm font-medium ${
          good === undefined
            ? 'text-slate-300'
            : good
            ? 'text-green-400'
            : 'text-orange-400'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

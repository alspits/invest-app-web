'use client';

import { useEffect, useState } from 'react';
import { useAlertStore } from '@/stores/alerts';
import { AlertTriggerEvent } from '@/types/alert';

/**
 * Alert trigger history component
 */
export default function AlertHistory() {
  const {
    triggerHistory,
    isLoadingHistory,
    loadTriggerHistory,
    dismissAlert,
    markEventAsViewed,
  } = useAlertStore();

  const [selectedEvent, setSelectedEvent] = useState<AlertTriggerEvent | null>(null);
  const [filterAction, setFilterAction] = useState<AlertTriggerEvent['userAction'] | 'ALL'>('ALL');

  useEffect(() => {
    loadTriggerHistory(30);
  }, [loadTriggerHistory]);

  const filteredHistory = triggerHistory.filter(
    (event) => filterAction === 'ALL' || event.userAction === filterAction
  );

  const handleDismiss = (eventId: string) => {
    dismissAlert(eventId);
    setSelectedEvent(null);
  };

  const handleView = (event: AlertTriggerEvent) => {
    setSelectedEvent(event);
    if (event.userAction === 'PENDING') {
      markEventAsViewed(event.id);
    }
  };

  const getActionBadge = (action: AlertTriggerEvent['userAction']) => {
    const badges = {
      PENDING: { label: 'Ожидает', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
      VIEWED: { label: 'Просмотрено', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
      DISMISSED: { label: 'Отклонено', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
      SNOOZED: { label: 'Отложено', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
    };

    const { label, className } = badges[action];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${className}`}>
        {label}
      </span>
    );
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 2,
    }).format(price);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    }
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  };

  if (isLoadingHistory) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          История оповещений
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Всего событий: {triggerHistory.length} | Ожидает действия: {triggerHistory.filter(e => e.userAction === 'PENDING').length}
        </p>
      </div>

      {/* Filter */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {(['ALL', 'PENDING', 'VIEWED', 'DISMISSED', 'SNOOZED'] as const).map((action) => (
          <button
            key={action}
            onClick={() => setFilterAction(action)}
            className={`px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap ${
              filterAction === action
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {action === 'ALL' ? 'Все' : getActionBadge(action as AlertTriggerEvent['userAction']).props.children}
          </button>
        ))}
      </div>

      {/* Event List */}
      {filteredHistory.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Нет событий
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            История срабатываний оповещений появится здесь
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredHistory.map((event) => (
            <div
              key={event.id}
              onClick={() => handleView(event)}
              className={`bg-white dark:bg-gray-800 border rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow ${
                event.userAction === 'PENDING'
                  ? 'border-yellow-300 dark:border-yellow-700'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {event.ticker}
                    </span>
                    {getActionBadge(event.userAction)}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(event.triggeredAt)}
                    </span>
                  </div>

                  {/* Trigger Reason */}
                  <p className="text-sm text-gray-900 dark:text-white font-medium mb-2">
                    {event.triggerReason}
                  </p>

                  {/* Conditions Met */}
                  {event.conditionsMet.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {event.conditionsMet.map((condition, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded"
                        >
                          {condition}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Market Data */}
                  <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400">
                    <span>Цена: {formatPrice(event.priceAtTrigger)}</span>
                    {event.volumeAtTrigger && (
                      <span>Объем: {formatVolume(event.volumeAtTrigger)}</span>
                    )}
                    {event.newsCount !== undefined && (
                      <span>Новости: {event.newsCount}</span>
                    )}
                    {event.sentiment !== undefined && (
                      <span
                        className={
                          event.sentiment > 0
                            ? 'text-green-600 dark:text-green-400'
                            : event.sentiment < 0
                            ? 'text-red-600 dark:text-red-400'
                            : ''
                        }
                      >
                        Настроение: {event.sentiment > 0 ? '+' : ''}{event.sentiment.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {event.userAction === 'PENDING' && (
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDismiss(event.id);
                      }}
                      className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                      title="Отклонить"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Детали оповещения
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {selectedEvent.ticker} • {formatDate(selectedEvent.triggeredAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Причина срабатывания
                </h4>
                <p className="text-gray-900 dark:text-white">
                  {selectedEvent.triggerReason}
                </p>
              </div>

              {selectedEvent.conditionsMet.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Выполненные условия
                  </h4>
                  <ul className="space-y-1">
                    {selectedEvent.conditionsMet.map((condition, i) => (
                      <li
                        key={i}
                        className="flex items-center text-sm text-gray-700 dark:text-gray-300"
                      >
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {condition}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Цена
                  </h4>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatPrice(selectedEvent.priceAtTrigger)}
                  </p>
                </div>
                {selectedEvent.volumeAtTrigger && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Объем
                    </h4>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatVolume(selectedEvent.volumeAtTrigger)}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                {getActionBadge(selectedEvent.userAction)}
                {selectedEvent.actionAt && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Обработано: {formatDate(selectedEvent.actionAt)}
                  </span>
                )}
              </div>

              {selectedEvent.userAction === 'PENDING' && (
                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    onClick={() => handleDismiss(selectedEvent.id)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Отклонить
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

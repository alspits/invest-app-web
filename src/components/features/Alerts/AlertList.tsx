'use client';

import { useEffect, useState } from 'react';
import { useAlertStore } from '@/stores/alerts';
import { Alert, AlertStatus } from '@/types/alert';
import AlertBuilder from './AlertBuilder';

/**
 * Alert list and management component
 */
export default function AlertList() {
  const {
    alerts,
    isLoadingAlerts,
    error,
    loadAlerts,
    toggleAlert,
    deleteAlert,
    snoozeAlert,
  } = useAlertStore();

  const [showBuilder, setShowBuilder] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | undefined>();
  const [filterStatus, setFilterStatus] = useState<AlertStatus | 'ALL'>('ALL');

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const filteredAlerts = alerts.filter(
    (alert) => filterStatus === 'ALL' || alert.status === filterStatus
  );

  const handleEdit = (alert: Alert) => {
    setEditingAlert(alert);
    setShowBuilder(true);
  };

  const handleCreate = () => {
    setEditingAlert(undefined);
    setShowBuilder(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Удалить это оповещение?')) {
      deleteAlert(id);
    }
  };

  const getStatusBadge = (status: AlertStatus) => {
    const badges: Record<AlertStatus, { label: string; className: string }> = {
      ACTIVE: { label: 'Активно', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      TRIGGERED: { label: 'Сработало', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
      SNOOZED: { label: 'Отложено', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
      DISMISSED: { label: 'Отклонено', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
      EXPIRED: { label: 'Истекло', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
      DISABLED: { label: 'Отключено', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
    };

    const { label, className } = badges[status];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${className}`}>
        {label}
      </span>
    );
  };

  const getPriorityBadge = (priority: Alert['priority']) => {
    const badges = {
      LOW: { label: 'Низкий', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
      MEDIUM: { label: 'Средний', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
      HIGH: { label: 'Высокий', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
      CRITICAL: { label: 'Критический', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    };

    const { label, className } = badges[priority];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${className}`}>
        {label}
      </span>
    );
  };

  const getTypeLabel = (type: Alert['type']) => {
    const labels = {
      THRESHOLD: 'Пороговое',
      MULTI_CONDITION: 'Мультиусловие',
      NEWS_TRIGGERED: 'Новостное',
      ANOMALY: 'Аномалия',
    };
    return labels[type];
  };

  if (isLoadingAlerts) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">Ошибка: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Оповещения
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Всего: {alerts.length} | Активных: {alerts.filter(a => a.status === 'ACTIVE').length}
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Создать оповещение</span>
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {(['ALL', 'ACTIVE', 'TRIGGERED', 'SNOOZED', 'DISABLED'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap ${
              filterStatus === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {status === 'ALL' ? 'Все' : getStatusBadge(status as AlertStatus).props.children}
          </button>
        ))}
      </div>

      {/* Alert List */}
      {filteredAlerts.length === 0 ? (
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
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Нет оповещений
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Создайте первое оповещение, чтобы отслеживать важные изменения
          </p>
          <button
            onClick={handleCreate}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Создать оповещение
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {alert.ticker}
                    </span>
                    {getStatusBadge(alert.status)}
                    {getPriorityBadge(alert.priority)}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {getTypeLabel(alert.type)}
                    </span>
                  </div>

                  {/* Name & Description */}
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                    {alert.name}
                  </h3>
                  {alert.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {alert.description}
                    </p>
                  )}

                  {/* Conditions Summary */}
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    {alert.conditionGroups.map((group, i) => (
                      <div key={group.id}>
                        {group.conditions.map((cond, j) => (
                          <span key={cond.id}>
                            {cond.field} {cond.operator === 'GREATER_THAN' ? '>' : cond.operator === 'LESS_THAN' ? '<' : cond.operator} {cond.value}
                            {j < group.conditions.length - 1 && ` ${group.logic} `}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>Срабатываний: {alert.triggeredCount}</span>
                    {alert.lastTriggeredAt && (
                      <span>
                        Последнее: {new Date(alert.lastTriggeredAt).toLocaleDateString('ru-RU')}
                      </span>
                    )}
                    <span>Макс/день: {alert.frequency.maxPerDay}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => toggleAlert(alert.id)}
                    className={`p-2 rounded-lg ${
                      alert.status === 'ACTIVE'
                        ? 'text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                        : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                    }`}
                    title={alert.status === 'ACTIVE' ? 'Отключить' : 'Включить'}
                  >
                    {alert.status === 'ACTIVE' ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </button>

                  <button
                    onClick={() => handleEdit(alert)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                    title="Редактировать"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>

                  <button
                    onClick={() => handleDelete(alert.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    title="Удалить"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Alert Builder Modal */}
      {showBuilder && (
        <AlertBuilder
          onClose={() => {
            setShowBuilder(false);
            setEditingAlert(undefined);
          }}
          editingAlert={editingAlert}
        />
      )}
    </div>
  );
}

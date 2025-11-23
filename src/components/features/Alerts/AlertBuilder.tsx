'use client';

import { useState } from 'react';
import {
  Alert,
  AlertCondition,
  AlertConditionGroup,
  AlertTriggerType,
  AlertPriority,
  AlertConditionField,
  AlertOperator,
  AlertLogic,
  createAlert,
  createConditionGroup,
  createAlertCondition,
  DEFAULT_ALERT_FREQUENCY,
  DEFAULT_DND_SETTINGS,
  DEFAULT_ANOMALY_CONFIG,
} from '@/types/alert';
import { useAlertStore } from '@/stores/alerts';

interface AlertBuilderProps {
  onClose: () => void;
  initialTicker?: string;
  editingAlert?: Alert;
}

/**
 * Visual alert builder component
 * Allows users to create complex multi-condition alerts with a UI
 */
export default function AlertBuilder({
  onClose,
  initialTicker = '',
  editingAlert,
}: AlertBuilderProps) {
  const { addAlert, updateAlert } = useAlertStore();

  // Form state
  const [ticker, setTicker] = useState(editingAlert?.ticker || initialTicker);
  const [name, setName] = useState(editingAlert?.name || '');
  const [description, setDescription] = useState(editingAlert?.description || '');
  const [alertType, setAlertType] = useState<AlertTriggerType>(
    editingAlert?.type || 'THRESHOLD'
  );
  const [priority, setPriority] = useState<AlertPriority>(
    editingAlert?.priority || 'MEDIUM'
  );

  // Conditions
  const [conditionGroups, setConditionGroups] = useState<AlertConditionGroup[]>(
    editingAlert?.conditionGroups || [
      createConditionGroup('AND', [
        createAlertCondition('PRICE', 'GREATER_THAN', 0),
      ]),
    ]
  );

  // Frequency settings
  const [maxPerDay, setMaxPerDay] = useState(
    editingAlert?.frequency.maxPerDay || DEFAULT_ALERT_FREQUENCY.maxPerDay
  );
  const [cooldownMinutes, setCooldownMinutes] = useState(
    editingAlert?.frequency.cooldownMinutes || DEFAULT_ALERT_FREQUENCY.cooldownMinutes
  );

  // DND settings
  const [dndEnabled, setDndEnabled] = useState(
    editingAlert?.dndSettings.enabled || DEFAULT_DND_SETTINGS.enabled
  );
  const [dndStartTime, setDndStartTime] = useState(
    editingAlert?.dndSettings.startTime || DEFAULT_DND_SETTINGS.startTime
  );
  const [dndEndTime, setDndEndTime] = useState(
    editingAlert?.dndSettings.endTime || DEFAULT_DND_SETTINGS.endTime
  );

  // Notification settings
  const [notifyViaApp, setNotifyViaApp] = useState(
    editingAlert?.notifyViaApp ?? true
  );
  const [notifyViaPush, setNotifyViaPush] = useState(
    editingAlert?.notifyViaPush ?? true
  );

  // Anomaly config (if type === ANOMALY)
  const [priceChangeThreshold, setPriceChangeThreshold] = useState(
    editingAlert?.anomalyConfig?.priceChangeThreshold ||
      DEFAULT_ANOMALY_CONFIG.priceChangeThreshold
  );
  const [volumeSpikeMultiplier, setVolumeSpikeMultiplier] = useState(
    editingAlert?.anomalyConfig?.volumeSpikeMultiplier ||
      DEFAULT_ANOMALY_CONFIG.volumeSpikeMultiplier
  );

  // Add new condition to group
  const addCondition = (groupId: string) => {
    setConditionGroups((groups) =>
      groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              conditions: [
                ...group.conditions,
                createAlertCondition('PRICE', 'GREATER_THAN', 0),
              ],
            }
          : group
      )
    );
  };

  // Remove condition from group
  const removeCondition = (groupId: string, conditionId: string) => {
    setConditionGroups((groups) =>
      groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              conditions: group.conditions.filter((c) => c.id !== conditionId),
            }
          : group
      )
    );
  };

  // Update condition
  const updateCondition = (
    groupId: string,
    conditionId: string,
    updates: Partial<AlertCondition>
  ) => {
    setConditionGroups((groups) =>
      groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              conditions: group.conditions.map((c) =>
                c.id === conditionId ? { ...c, ...updates } : c
              ),
            }
          : group
      )
    );
  };

  // Add new condition group
  const addConditionGroup = () => {
    setConditionGroups([
      ...conditionGroups,
      createConditionGroup('AND', [
        createAlertCondition('PRICE', 'GREATER_THAN', 0),
      ]),
    ]);
  };

  // Save alert
  const handleSave = () => {
    if (!ticker || !name) {
      alert('Заполните тикер и название оповещения');
      return;
    }

    const alertData = createAlert(ticker, name, alertType, conditionGroups);

    const fullAlert = {
      ...alertData,
      description,
      priority,
      frequency: {
        maxPerDay,
        cooldownMinutes,
        batchingEnabled: DEFAULT_ALERT_FREQUENCY.batchingEnabled,
        batchingWindowMinutes: DEFAULT_ALERT_FREQUENCY.batchingWindowMinutes,
      },
      dndSettings: {
        enabled: dndEnabled,
        startTime: dndStartTime,
        endTime: dndEndTime,
        days: DEFAULT_DND_SETTINGS.days,
      },
      notifyViaApp,
      notifyViaPush,
      notifyViaEmail: false,
      ...(alertType === 'ANOMALY' && {
        anomalyConfig: {
          priceChangeThreshold,
          volumeSpikeMultiplier,
          statisticalSigma: DEFAULT_ANOMALY_CONFIG.statisticalSigma,
          requiresNoNews: DEFAULT_ANOMALY_CONFIG.requiresNoNews,
          newsLookbackHours: DEFAULT_ANOMALY_CONFIG.newsLookbackHours,
        },
      }),
    };

    if (editingAlert) {
      updateAlert(editingAlert.id, fullAlert);
    } else {
      addAlert(fullAlert);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {editingAlert ? 'Редактировать оповещение' : 'Создать оповещение'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <section>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Основная информация
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Тикер
                </label>
                <input
                  type="text"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder="SBER"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Название
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ценовое оповещение"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Описание (опционально)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Уведомить когда цена достигнет целевого уровня"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Тип оповещения
                </label>
                <select
                  value={alertType}
                  onChange={(e) => setAlertType(e.target.value as AlertTriggerType)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="THRESHOLD">Пороговое значение</option>
                  <option value="MULTI_CONDITION">Мультиусловие</option>
                  <option value="NEWS_TRIGGERED">Новостное</option>
                  <option value="ANOMALY">Детектор аномалий</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Приоритет
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as AlertPriority)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="LOW">Низкий</option>
                  <option value="MEDIUM">Средний</option>
                  <option value="HIGH">Высокий</option>
                  <option value="CRITICAL">Критический</option>
                </select>
              </div>
            </div>
          </section>

          {/* Conditions (for THRESHOLD and MULTI_CONDITION) */}
          {(alertType === 'THRESHOLD' || alertType === 'MULTI_CONDITION') && (
            <section>
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Условия срабатывания
              </h3>

              {conditionGroups.map((group, groupIndex) => (
                <div
                  key={group.id}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 mb-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Группа условий #{groupIndex + 1}
                    </span>
                    <select
                      value={group.logic}
                      onChange={(e) =>
                        setConditionGroups((groups) =>
                          groups.map((g) =>
                            g.id === group.id
                              ? { ...g, logic: e.target.value as AlertLogic }
                              : g
                          )
                        )
                      }
                      className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                    >
                      <option value="AND">ВСЕ условия (AND)</option>
                      <option value="OR">ЛЮБОЕ условие (OR)</option>
                    </select>
                  </div>

                  {group.conditions.map((condition) => (
                    <div
                      key={condition.id}
                      className="grid grid-cols-[2fr_1fr_2fr_auto] gap-2 mb-2"
                    >
                      <select
                        value={condition.field}
                        onChange={(e) =>
                          updateCondition(group.id, condition.id, {
                            field: e.target.value as AlertConditionField,
                          })
                        }
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-sm"
                      >
                        <option value="PRICE">Цена</option>
                        <option value="PRICE_CHANGE">Изменение цены %</option>
                        <option value="VOLUME">Объем</option>
                        <option value="VOLUME_RATIO">Коэф. объема</option>
                        <option value="PE_RATIO">P/E</option>
                        <option value="RSI">RSI</option>
                        <option value="MOVING_AVG_50">MA 50</option>
                        <option value="MOVING_AVG_200">MA 200</option>
                      </select>

                      <select
                        value={condition.operator}
                        onChange={(e) =>
                          updateCondition(group.id, condition.id, {
                            operator: e.target.value as AlertOperator,
                          })
                        }
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-sm"
                      >
                        <option value="GREATER_THAN">&gt;</option>
                        <option value="LESS_THAN">&lt;</option>
                        <option value="GREATER_THAN_EQUAL">≥</option>
                        <option value="LESS_THAN_EQUAL">≤</option>
                        <option value="EQUAL">=</option>
                      </select>

                      <input
                        type="number"
                        value={condition.value}
                        onChange={(e) =>
                          updateCondition(group.id, condition.id, {
                            value: parseFloat(e.target.value) || 0,
                          })
                        }
                        step="0.01"
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-sm"
                      />

                      <button
                        onClick={() => removeCondition(group.id, condition.id)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={() => addCondition(group.id)}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    + Добавить условие
                  </button>
                </div>
              ))}

              {alertType === 'MULTI_CONDITION' && (
                <button
                  onClick={addConditionGroup}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  + Добавить группу условий
                </button>
              )}
            </section>
          )}

          {/* Anomaly Config */}
          {alertType === 'ANOMALY' && (
            <section>
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Настройки детектора аномалий
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Порог изменения цены (%)
                  </label>
                  <input
                    type="number"
                    value={priceChangeThreshold}
                    onChange={(e) => setPriceChangeThreshold(parseFloat(e.target.value))}
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Множитель объема
                  </label>
                  <input
                    type="number"
                    value={volumeSpikeMultiplier}
                    onChange={(e) => setVolumeSpikeMultiplier(parseFloat(e.target.value))}
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </section>
          )}

          {/* Frequency Settings */}
          <section>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Частота уведомлений
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Макс. в день
                </label>
                <input
                  type="number"
                  value={maxPerDay}
                  onChange={(e) => setMaxPerDay(parseInt(e.target.value))}
                  min="1"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Задержка (мин)
                </label>
                <input
                  type="number"
                  value={cooldownMinutes}
                  onChange={(e) => setCooldownMinutes(parseInt(e.target.value))}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </section>

          {/* DND Settings */}
          <section>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Не беспокоить
            </h3>
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                checked={dndEnabled}
                onChange={(e) => setDndEnabled(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Включить режим "Не беспокоить"
              </label>
            </div>
            {dndEnabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Начало
                  </label>
                  <input
                    type="time"
                    value={dndStartTime}
                    onChange={(e) => setDndStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Окончание
                  </label>
                  <input
                    type="time"
                    value={dndEndTime}
                    onChange={(e) => setDndEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            )}
          </section>

          {/* Notification Channels */}
          <section>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Каналы уведомлений
            </h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={notifyViaApp}
                  onChange={(e) => setNotifyViaApp(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  В приложении
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={notifyViaPush}
                  onChange={(e) => setNotifyViaPush(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Push-уведомления
                </label>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {editingAlert ? 'Сохранить' : 'Создать оповещение'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

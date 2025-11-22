'use client';

import { useMemo } from 'react';
import { useFilteredPatterns, usePatternRecommendations } from '@/stores/patternStore';
import type { EmotionalTrigger, TriggerType } from '@/types/trading-pattern';

// ============================================================================
// Emotional Triggers Component
// ============================================================================

export function EmotionalTriggers() {
  const patterns = useFilteredPatterns();
  const recommendations = usePatternRecommendations();

  // Aggregate all triggers from patterns
  const triggers = useMemo(() => {
    const allTriggers: EmotionalTrigger[] = [];

    patterns.forEach((pattern) => {
      allTriggers.push(...pattern.triggers);
    });

    return allTriggers;
  }, [patterns]);

  // Group triggers by type
  const triggerStats = useMemo(() => {
    const stats = new Map<TriggerType, { count: number; severity: Record<string, number> }>();

    triggers.forEach((trigger) => {
      if (!stats.has(trigger.type)) {
        stats.set(trigger.type, {
          count: 0,
          severity: { low: 0, medium: 0, high: 0 },
        });
      }

      const stat = stats.get(trigger.type)!;
      stat.count++;
      stat.severity[trigger.severity]++;
    });

    return Array.from(stats.entries())
      .map(([type, data]) => ({ type, ...data }))
      .sort((a, b) => b.count - a.count);
  }, [triggers]);

  if (triggers.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <p className="text-gray-500 dark:text-gray-400 text-center">
          Эмоциональные триггеры не обнаружены.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className={`rounded-lg border p-4 ${
                rec.severity === 'critical'
                  ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                  : rec.severity === 'warning'
                  ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
                  : 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">
                  {rec.severity === 'critical' ? '⚠️' : rec.severity === 'warning' ? '⚡' : 'ℹ️'}
                </span>
                <div className="flex-1">
                  <h4
                    className={`font-semibold mb-1 ${
                      rec.severity === 'critical'
                        ? 'text-red-800 dark:text-red-200'
                        : rec.severity === 'warning'
                        ? 'text-yellow-800 dark:text-yellow-200'
                        : 'text-blue-800 dark:text-blue-200'
                    }`}
                  >
                    Рекомендация
                  </h4>
                  <p
                    className={`text-sm ${
                      rec.severity === 'critical'
                        ? 'text-red-700 dark:text-red-300'
                        : rec.severity === 'warning'
                        ? 'text-yellow-700 dark:text-yellow-300'
                        : 'text-blue-700 dark:text-blue-300'
                    }`}
                  >
                    {rec.message}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trigger Statistics */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Анализ эмоциональных триггеров
        </h3>

        <div className="space-y-4">
          {triggerStats.map((stat) => (
            <TriggerStatItem key={stat.type} stat={stat} />
          ))}
        </div>
      </div>

      {/* Recent Triggers Timeline */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Последние триггеры
        </h3>

        <div className="space-y-3">
          {triggers
            .slice()
            .sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime())
            .slice(0, 10)
            .map((trigger, index) => (
              <TriggerItem key={index} trigger={trigger} />
            ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Trigger Stat Item Component
// ============================================================================

interface TriggerStatItemProps {
  stat: {
    type: TriggerType;
    count: number;
    severity: Record<string, number>;
  };
}

function TriggerStatItem({ stat }: TriggerStatItemProps) {
  const typeLabels: Record<TriggerType, string> = {
    panic: 'Паника',
    fomo: 'FOMO (страх упустить)',
    price_drop: 'Падение цены',
    price_spike: 'Рост цены',
    news: 'Новости',
    volatility: 'Волатильность',
  };

  const typeIcons: Record<TriggerType, string> = {
    panic: '😱',
    fomo: '🔥',
    price_drop: '📉',
    price_spike: '📈',
    news: '📰',
    volatility: '📊',
  };

  const label = typeLabels[stat.type] || stat.type;
  const icon = typeIcons[stat.type] || '🔔';

  const highPercent = (stat.severity.high / stat.count) * 100;
  const mediumPercent = (stat.severity.medium / stat.count) * 100;
  const lowPercent = (stat.severity.low / stat.count) * 100;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">{label}</h4>
        </div>
        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {stat.count}
        </span>
      </div>

      {/* Severity Distribution Bar */}
      <div className="flex h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
        {stat.severity.high > 0 && (
          <div
            className="bg-red-500"
            style={{ width: `${highPercent}%` }}
            title={`Высокая: ${stat.severity.high}`}
          />
        )}
        {stat.severity.medium > 0 && (
          <div
            className="bg-yellow-500"
            style={{ width: `${mediumPercent}%` }}
            title={`Средняя: ${stat.severity.medium}`}
          />
        )}
        {stat.severity.low > 0 && (
          <div
            className="bg-blue-500"
            style={{ width: `${lowPercent}%` }}
            title={`Низкая: ${stat.severity.low}`}
          />
        )}
      </div>

      {/* Severity Counts */}
      <div className="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
        {stat.severity.high > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-red-500 rounded-full" />
            Высокая: {stat.severity.high}
          </span>
        )}
        {stat.severity.medium > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-yellow-500 rounded-full" />
            Средняя: {stat.severity.medium}
          </span>
        )}
        {stat.severity.low > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-blue-500 rounded-full" />
            Низкая: {stat.severity.low}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Trigger Item Component
// ============================================================================

interface TriggerItemProps {
  trigger: EmotionalTrigger;
}

function TriggerItem({ trigger }: TriggerItemProps) {
  const formattedDate = new Date(trigger.detectedAt).toLocaleDateString('ru-RU', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg ${
        trigger.severity === 'high'
          ? 'bg-red-50 dark:bg-red-900/20'
          : trigger.severity === 'medium'
          ? 'bg-yellow-50 dark:bg-yellow-900/20'
          : 'bg-blue-50 dark:bg-blue-900/20'
      }`}
    >
      <span
        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
          trigger.severity === 'high'
            ? 'bg-red-500 text-white'
            : trigger.severity === 'medium'
            ? 'bg-yellow-500 text-white'
            : 'bg-blue-500 text-white'
        }`}
      >
        !
      </span>

      <div className="flex-1">
        <p
          className={`text-sm font-medium ${
            trigger.severity === 'high'
              ? 'text-red-800 dark:text-red-200'
              : trigger.severity === 'medium'
              ? 'text-yellow-800 dark:text-yellow-200'
              : 'text-blue-800 dark:text-blue-200'
          }`}
        >
          {trigger.description}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formattedDate}</p>
      </div>
    </div>
  );
}

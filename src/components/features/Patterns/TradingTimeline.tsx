'use client';

import { useMemo } from 'react';
import { useFilteredPatterns } from '@/stores/patternStore';
import { formatPatternCategory, getPatternCategoryColor } from '@/lib/intelligence/pattern-recognition';
import type { TradingPattern } from '@/types/trading-pattern';

// ============================================================================
// Trading Timeline Component
// ============================================================================

export function TradingTimeline() {
  const patterns = useFilteredPatterns();

  // Sort patterns by date (most recent first)
  const sortedPatterns = useMemo(() => {
    return [...patterns].sort((a, b) => {
      const dateA = new Date(a.detectedAt).getTime();
      const dateB = new Date(b.detectedAt).getTime();
      return dateB - dateA;
    });
  }, [patterns]);

  if (sortedPatterns.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <p className="text-gray-500 dark:text-gray-400 text-center">
          Паттерны не обнаружены. Выберите счёт с историей операций.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Хронология торговых паттернов
        </h3>

        <div className="space-y-4">
          {sortedPatterns.map((pattern) => (
            <TimelineItem key={pattern.id} pattern={pattern} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Timeline Item Component
// ============================================================================

interface TimelineItemProps {
  pattern: TradingPattern;
}

function TimelineItem({ pattern }: TimelineItemProps) {
  const categoryLabel = formatPatternCategory(pattern.category);
  const categoryColor = getPatternCategoryColor(pattern.category);

  const formattedDate = new Date(pattern.detectedAt).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const isProfitable = pattern.metrics.profitLoss > 0;
  const isLoss = pattern.metrics.profitLoss < 0;

  return (
    <div className="flex gap-4">
      {/* Timeline Indicator */}
      <div className="flex flex-col items-center">
        <div
          className={`w-3 h-3 rounded-full ${
            isProfitable
              ? 'bg-green-500'
              : isLoss
              ? 'bg-red-500'
              : 'bg-gray-400'
          }`}
        />
        <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 mt-2" />
      </div>

      {/* Pattern Details */}
      <div className="flex-1 pb-6">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h4 className={`font-semibold ${categoryColor}`}>{categoryLabel}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">{formattedDate}</p>
          </div>

          <div className="text-right">
            <p
              className={`text-lg font-bold ${
                isProfitable
                  ? 'text-green-500'
                  : isLoss
                  ? 'text-red-500'
                  : 'text-gray-500'
              }`}
            >
              {pattern.metrics.profitLoss > 0 ? '+' : ''}
              {pattern.metrics.profitLoss.toFixed(2)}%
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {pattern.metrics.timeToComplete > 0
                ? `${pattern.metrics.timeToComplete.toFixed(0)} дн.`
                : 'Не закрыта'}
            </p>
          </div>
        </div>

        {/* Instrument Info */}
        {pattern.ticker && (
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
            <span className="font-medium">{pattern.ticker}</span>
            {pattern.instrumentName && (
              <span className="text-gray-500 dark:text-gray-400">
                {' '}
                · {pattern.instrumentName}
              </span>
            )}
          </p>
        )}

        {/* Operations Count */}
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          Операций: {pattern.operations.length}
        </p>

        {/* Triggers */}
        {pattern.triggers.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {pattern.triggers.map((trigger, index) => (
              <span
                key={index}
                className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                  trigger.severity === 'high'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    : trigger.severity === 'medium'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                }`}
              >
                {trigger.description}
              </span>
            ))}
          </div>
        )}

        {/* Confidence */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Уверенность:
          </span>
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-[200px]">
            <div
              className={`h-2 rounded-full ${
                pattern.confidence > 70
                  ? 'bg-green-500'
                  : pattern.confidence > 50
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${pattern.confidence}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {pattern.confidence}%
          </span>
        </div>
      </div>
    </div>
  );
}

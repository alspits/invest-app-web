'use client';

import { useEffect } from 'react';
import { usePatternStore, usePatternStats, usePatternSummary } from '@/stores/patternStore';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { formatPatternCategory, getPatternCategoryColor } from '@/lib/intelligence/patterns';
import type { PatternCategory } from '@/types/trading-pattern';

// ============================================================================
// Pattern Insights Component
// ============================================================================

export function PatternInsights() {
  const selectedAccountId = usePortfolioStore((state) => state.selectedAccountId);
  const loadPatterns = usePatternStore((state) => state.loadPatterns);
  const isLoading = usePatternStore((state) => state.isLoading);
  const error = usePatternStore((state) => state.error);

  const stats = usePatternStats();
  const summary = usePatternSummary();

  // Auto-load patterns when account changes
  useEffect(() => {
    if (selectedAccountId) {
      loadPatterns(selectedAccountId);
    }
  }, [selectedAccountId, loadPatterns]);

  // Loading state
  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6">
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
          Ошибка загрузки паттернов
        </h3>
        <p className="text-red-600 dark:text-red-300">{error}</p>
      </div>
    );
  }

  // No data
  if (!summary || stats.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <p className="text-gray-500 dark:text-gray-400 text-center">
          Нет данных для анализа. Выберите счёт с историей операций.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Обзор торговых паттернов
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Patterns */}
          <div className="space-y-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">Всего паттернов</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {summary.totalPatterns}
            </p>
          </div>

          {/* Risk Score */}
          <div className="space-y-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">Риск-балл</p>
            <div className="flex items-baseline gap-2">
              <p
                className={`text-2xl font-bold ${
                  summary.riskScore > 60
                    ? 'text-red-500'
                    : summary.riskScore > 30
                    ? 'text-yellow-500'
                    : 'text-green-500'
                }`}
              >
                {summary.riskScore.toFixed(0)}
              </p>
              <span className="text-sm text-gray-500 dark:text-gray-400">/ 100</span>
            </div>
          </div>

          {/* Average P&L */}
          <div className="space-y-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">Средний P&L</p>
            <p
              className={`text-2xl font-bold ${
                summary.overallProfitLoss > 0
                  ? 'text-green-500'
                  : summary.overallProfitLoss < 0
                  ? 'text-red-500'
                  : 'text-gray-500'
              }`}
            >
              {summary.overallProfitLoss > 0 ? '+' : ''}
              {summary.overallProfitLoss.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Pattern Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.map((stat) => (
          <PatternStatCard key={stat.category} stat={stat} />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Pattern Stat Card Component
// ============================================================================

interface PatternStatCardProps {
  stat: {
    category: PatternCategory;
    totalCount: number;
    successCount: number;
    failureCount: number;
    breakEvenCount: number;
    successRate: number | null;
    averageProfitLoss: number;
  };
}

function PatternStatCard({ stat }: PatternStatCardProps) {
  const setSelectedCategory = usePatternStore((state) => state.setSelectedCategory);

  const categoryColor = getPatternCategoryColor(stat.category);
  const categoryLabel = formatPatternCategory(stat.category);

  return (
    <button
      onClick={() => setSelectedCategory(stat.category)}
      className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 hover:border-blue-300 dark:hover:border-blue-700 transition-colors text-left"
    >
      <div className="flex items-start justify-between mb-4">
        <h4 className={`text-lg font-semibold ${categoryColor}`}>{categoryLabel}</h4>
        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {stat.totalCount}
        </span>
      </div>

      <div className="space-y-2">
        {/* Success Rate */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Успешность</span>
          {stat.successRate !== null ? (
            <span
              className={`font-medium ${
                stat.successRate > 60
                  ? 'text-green-500'
                  : stat.successRate > 40
                  ? 'text-yellow-500'
                  : 'text-red-500'
              }`}
            >
              {stat.successRate.toFixed(0)}%
            </span>
          ) : (
            <span className="font-medium text-gray-400 dark:text-gray-500">Н/Д</span>
          )}
        </div>

        {/* Average P&L */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Средний P&L</span>
          <span
            className={`font-medium ${
              stat.averageProfitLoss > 0
                ? 'text-green-500'
                : stat.averageProfitLoss < 0
                ? 'text-red-500'
                : 'text-gray-500'
            }`}
          >
            {stat.averageProfitLoss > 0 ? '+' : ''}
            {stat.averageProfitLoss.toFixed(1)}%
          </span>
        </div>

        {/* Win/Loss/Break-Even Count */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            Прибыль / Убыток / Ноль
          </span>
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {stat.successCount} / {stat.failureCount} / {stat.breakEvenCount}
          </span>
        </div>
      </div>
    </button>
  );
}

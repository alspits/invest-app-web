'use client';

/**
 * Ticker Recommendation Card Component
 * Displays personalized ticker suggestions based on risk profile
 */

import { useEffect } from 'react';
import { useRecommendationsStore } from '@/stores/recommendations';
import { formatCurrency } from '@/lib/scenario-calculations';

export function TickerRecommendationCard() {
  const {
    riskProfile,
    tickerRecommendations,
    isLoadingTickers,
    lastUpdated,
    fetchTickerRecommendations,
    dismissTickerRecommendation,
  } = useRecommendationsStore();

  // Auto-fetch recommendations when risk profile changes
  useEffect(() => {
    if (riskProfile) {
      fetchTickerRecommendations();
    }
    // Only re-fetch when riskProfile changes, not on length change
  }, [riskProfile, fetchTickerRecommendations]);

  // No risk profile selected
  if (!riskProfile) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Рекомендации по активам</h3>
        <div className="text-center py-8">
          <span className="text-4xl mb-3 block">📊</span>
          <p className="text-gray-600">
            Выберите профиль риска выше, чтобы получить персонализированные рекомендации
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoadingTickers) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Рекомендации по активам</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Генерируем рекомендации...</span>
        </div>
      </div>
    );
  }

  // Empty state
  if (tickerRecommendations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Рекомендации по активам</h3>
        <div className="text-center py-8">
          <span className="text-4xl mb-3 block">✅</span>
          <p className="text-gray-600">
            Ваш портфель хорошо сбалансирован для выбранного профиля риска
          </p>
          <p className="text-sm text-gray-500 mt-2">Новые рекомендации появятся при изменениях</p>
        </div>
      </div>
    );
  }

  // Category icons & colors with fallback
  const defaultCategoryConfig = { icon: '📊', color: 'text-gray-600', bg: 'bg-gray-50' };

  const categoryConfig: Record<string, { icon: string; color: string; bg: string }> = {
    stock: { icon: '📈', color: 'text-blue-600', bg: 'bg-blue-50' },
    bond: { icon: '🏦', color: 'text-green-600', bg: 'bg-green-50' },
    etf: { icon: '📦', color: 'text-purple-600', bg: 'bg-purple-50' },
    alternative: { icon: '💎', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Рекомендации по активам</h3>
          <p className="text-sm text-gray-500">
            Профиль: {riskProfile} | {tickerRecommendations.length} рекомендаций
          </p>
        </div>
        {lastUpdated && (
          <button
            onClick={() => fetchTickerRecommendations()}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Обновить
          </button>
        )}
      </div>

      {/* Recommendations List */}
      <div className="space-y-3">
        {tickerRecommendations.map((rec) => {
          const config = categoryConfig[rec.category] || defaultCategoryConfig;
          const priorityStars = '⭐'.repeat(rec.priority);

          return (
            <div
              key={rec.ticker}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className={`text-2xl ${config.bg} p-2 rounded-lg`}>{config.icon}</span>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {rec.ticker} - {rec.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {rec.category.toUpperCase()} | Приоритет: {priorityStars}
                    </div>
                  </div>
                </div>

                {/* Dismiss Button */}
                <button
                  onClick={() => dismissTickerRecommendation(rec.ticker)}
                  className="text-gray-400 hover:text-gray-600"
                  title="Скрыть рекомендацию"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Rationale */}
              <p className="text-sm text-gray-700 mb-3">{rec.rationale}</p>

              {/* Metrics */}
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Рекомендуемая сумма:</span>
                  <span className="ml-1 font-medium text-gray-900">
                    {formatCurrency(rec.suggestedAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Ожидаемая волатильность:</span>
                  <span className="ml-1 font-medium text-gray-900">
                    {(rec.expectedVolatility * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => {
                    // TODO: Implement add to watchlist functionality
                    console.log('Add to watchlist:', rec.ticker);
                  }}
                  className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  aria-label={`Добавить ${rec.ticker} в список наблюдения`}
                >
                  Добавить в список
                </button>
                <button
                  onClick={() => dismissTickerRecommendation(rec.ticker)}
                  className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label={`Скрыть рекомендацию ${rec.ticker}`}
                >
                  Скрыть
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500 text-center">
          Обновлено: {new Date(lastUpdated).toLocaleString('ru-RU')}
        </div>
      )}
    </div>
  );
}

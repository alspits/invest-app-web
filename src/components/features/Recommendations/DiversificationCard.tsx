'use client';

import { useEffect } from 'react';
import { useRecommendationsStore } from '@/stores/recommendations';
import { AlertTriangle, PieChart, TrendingDown, X, RefreshCw } from 'lucide-react';

/**
 * DiversificationCard Component
 *
 * Displays portfolio diversification analysis with overloaded sectors
 */
export function DiversificationCard() {
  const { analysis, isLoading, error, refresh, dismissRecommendation } =
    useRecommendationsStore();

  // Auto-refresh on mount (only once)
  useEffect(() => {
    if (!analysis && !isLoading && !error) {
      refresh();
    }
    // Only run on mount or when states change in a meaningful way
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border-2 border-gray-200 p-5">
        <div
          className="flex items-center justify-center py-8"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
          <span className="ml-2 text-sm text-gray-600">Анализ диверсификации...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-lg border-2 border-red-200 p-5">
        <div className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="w-5 h-5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
        <button
          onClick={refresh}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
        >
          Повторить попытку
        </button>
      </div>
    );
  }

  // No analysis data
  if (!analysis || analysis.overloadedSectors.length === 0) {
    return (
      <div className="bg-white rounded-lg border-2 border-green-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <PieChart className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-gray-900 text-lg">Диверсификация</h3>
        </div>
        <p className="text-sm text-gray-700">
          Ваш портфель хорошо диверсифицирован! Перегруженных секторов не обнаружено.
        </p>
        {analysis && (
          <div className="mt-3 text-xs text-gray-500">
            Оценка диверсификации: {analysis.diversificationScore}/100
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border-2 border-yellow-200 p-5 hover:shadow-lg transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <PieChart className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900 text-lg">
              Перегруженные сектора ({analysis.overloadedSectors.length})
            </h3>
          </div>
          <span className="text-xs text-gray-500 font-medium">
            Сектора с весом более 50%
          </span>
        </div>

        {/* Score Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-100">
          <AlertTriangle className="w-4 h-4 text-yellow-700" />
          <span className="text-xs font-semibold text-yellow-700">
            Оценка: {analysis.diversificationScore}/100
          </span>
        </div>
      </div>

      {/* Overloaded Sectors List */}
      <div className="space-y-3 mb-4">
        {analysis.overloadedSectors.map((sector) => (
          <div
            key={sector.sector}
            className="bg-yellow-50 rounded-lg p-4 border border-yellow-200"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1 capitalize">
                  {sector.sector}
                </h4>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  <span>
                    {Math.round(sector.currentWeight * 100)}% → {Math.round(sector.targetWeight * 100)}%
                  </span>
                </div>
              </div>
              <button
                onClick={() => dismissRecommendation(sector.sector)}
                className="p-1.5 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
                title="Отклонить"
                aria-label={`Отклонить рекомендацию для сектора ${sector.sector}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-gray-700 mt-2">{sector.recommendation}</p>
          </div>
        ))}
      </div>

      {/* Metadata */}
      <div className="pt-3 border-t border-gray-100 text-xs text-gray-500">
        <div className="flex justify-between items-center">
          <span>Уверенность: {analysis.confidence}%</span>
          <span>
            Обновлено: {new Date(analysis.timestamp).toLocaleTimeString('ru-RU')}
          </span>
        </div>
      </div>
    </div>
  );
}

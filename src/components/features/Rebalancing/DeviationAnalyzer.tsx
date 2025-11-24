'use client';

/**
 * Deviation Analyzer Component
 * Displays current vs target allocation and highlights deviations
 */

import { useEffect } from 'react';
import { useRebalancingStore } from '@/stores/rebalancing';
import type { CategoryDeviation } from '@/lib/rebalancing';

export function DeviationAnalyzer() {
  const {
    targetAllocation,
    currentDeviations,
    analyzeDeviations,
    isAnalyzing,
    error,
  } = useRebalancingStore();

  useEffect(() => {
    if (targetAllocation && !currentDeviations) {
      analyzeDeviations();
    }
  }, [targetAllocation, currentDeviations, analyzeDeviations]);

  if (!targetAllocation) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">
          Сначала установите целевую аллокацию
        </p>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <span className="ml-3 text-gray-600">Анализирую отклонения...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">Ошибка: {error}</p>
      </div>
    );
  }

  if (!currentDeviations) {
    return null;
  }

  const { categoryDeviations, highPriorityCount, needsRebalancing, estimatedImpact } =
    currentDeviations;

  const sortedDeviations = [...categoryDeviations].sort(
    (a, b) => Math.abs(b.deviationPercent) - Math.abs(a.deviationPercent)
  );

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Анализ отклонений</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Статус</div>
            <div
              className={`text-lg font-semibold ${
                needsRebalancing ? 'text-orange-600' : 'text-green-600'
              }`}
            >
              {needsRebalancing ? 'Требуется ребалансировка' : 'В пределах нормы'}
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Критические отклонения</div>
            <div className="text-lg font-semibold text-red-600">
              {highPriorityCount}
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Ожидаемое улучшение</div>
            <div className="text-lg font-semibold text-blue-600">
              Риск -{estimatedImpact.riskReduction}%
            </div>
          </div>
        </div>

        {/* Estimated Impact */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">
            Ожидаемое влияние ребалансировки
          </h4>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• Снижение риска: {estimatedImpact.riskReduction}%</li>
            <li>
              • Улучшение диверсификации: +
              {estimatedImpact.diversificationImprovement} баллов
            </li>
          </ul>
        </div>
      </div>

      {/* Deviations Table */}
      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Детальный анализ отклонений</h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Категория
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Тип
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                  Текущий %
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                  Целевой %
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                  Отклонение
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">
                  Приоритет
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">
                  Действие
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedDeviations.map((deviation, idx) => (
                <tr
                  key={idx}
                  className={`border-b border-gray-100 ${
                    deviation.priority === 1 ? 'bg-red-50' : ''
                  }`}
                >
                  <td className="px-4 py-3 text-sm capitalize">
                    {deviation.category}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                    {getDimensionLabel(deviation.dimension)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {(deviation.currentWeight * 100).toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {(deviation.targetWeight * 100).toFixed(1)}%
                  </td>
                  <td
                    className={`px-4 py-3 text-sm text-right font-medium ${getDeviationColor(
                      deviation.deviationPercent
                    )}`}
                  >
                    {deviation.deviationPercent > 0 ? '+' : ''}
                    {(deviation.deviationPercent * 100).toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-center">
                    {renderPriorityBadge(deviation.priority)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {renderRecommendationBadge(deviation.recommendation)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Helper components
function getDimensionLabel(dimension: CategoryDeviation['dimension']): string {
  const labels = {
    sector: 'Сектор',
    geography: 'География',
    assetType: 'Тип актива',
  };
  return labels[dimension];
}

function getDeviationColor(deviationPercent: number): string {
  const abs = Math.abs(deviationPercent);
  if (abs > 0.05) return 'text-red-600';
  if (abs > 0.02) return 'text-yellow-600';
  return 'text-green-600';
}

function renderPriorityBadge(priority: number) {
  const colors = {
    1: 'bg-red-100 text-red-800',
    2: 'bg-yellow-100 text-yellow-800',
    3: 'bg-green-100 text-green-800',
  };

  const labels = {
    1: 'Высокий',
    2: 'Средний',
    3: 'Низкий',
  };

  return (
    <span
      className={`px-2 py-1 text-xs rounded-full ${
        colors[priority as keyof typeof colors]
      }`}
    >
      {labels[priority as keyof typeof labels]}
    </span>
  );
}

function renderRecommendationBadge(recommendation: CategoryDeviation['recommendation']) {
  const config = {
    BUY: { color: 'bg-green-100 text-green-800', label: 'Покупать' },
    SELL: { color: 'bg-red-100 text-red-800', label: 'Продавать' },
    HOLD: { color: 'bg-gray-100 text-gray-800', label: 'Держать' },
  };

  const { color, label } = config[recommendation];

  return <span className={`px-2 py-1 text-xs rounded-full ${color}`}>{label}</span>;
}

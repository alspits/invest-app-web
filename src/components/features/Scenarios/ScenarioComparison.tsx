'use client';

/**
 * ScenarioComparison Component
 *
 * Side-by-side comparison of current portfolio vs. scenario.
 * Shows metrics differences with visual indicators.
 */

import { useMemo } from 'react';
import { useScenarioStore } from '@/stores/scenarioStore';
import {
  formatCurrency,
  formatPercentage,
  getInstrumentTypeLabel,
} from '@/lib/scenario-calculations';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  PieChart,
  Target,
  DollarSign,
  BarChart3,
} from 'lucide-react';

export function ScenarioComparison() {
  const { comparison, currentMetrics, scenarioMetrics } = useScenarioStore();

  // Format sector allocation for display
  const sectorComparison = useMemo(() => {
    if (!comparison) return [];

    const sectors = new Set([
      ...Object.keys(comparison.current.sectorAllocation),
      ...Object.keys(comparison.scenario.sectorAllocation),
    ]);

    return Array.from(sectors).map((sector) => {
      const current = comparison.current.sectorAllocation[sector] || {
        value: 0,
        percentage: 0,
        count: 0,
      };
      const scenario = comparison.scenario.sectorAllocation[sector] || {
        value: 0,
        percentage: 0,
        count: 0,
      };

      return {
        sector,
        label: getInstrumentTypeLabel(sector),
        current,
        scenario,
        diff: {
          value: scenario.value - current.value,
          percentage: scenario.percentage - current.percentage,
          count: scenario.count - current.count,
        },
      };
    });
  }, [comparison]);

  if (!comparison || !currentMetrics || !scenarioMetrics) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center">
          Создайте изменения в портфеле для просмотра сравнения
        </p>
      </div>
    );
  }

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-4 h-4" />;
    if (value < 0) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = (value: number, inverse = false) => {
    if (inverse) {
      if (value > 0) return 'text-red-600 bg-red-50 border-red-200';
      if (value < 0) return 'text-green-600 bg-green-50 border-green-200';
      return 'text-gray-600 bg-gray-50 border-gray-200';
    }
    if (value > 0) return 'text-green-600 bg-green-50 border-green-200';
    if (value < 0) return 'text-red-600 bg-red-50 border-red-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          Сравнение сценариев
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Текущий портфель vs. сценарий
        </p>
      </div>

      {/* Key Metrics Comparison */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Value */}
        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 text-gray-600 mb-3">
            <DollarSign className="w-5 h-5" />
            <h3 className="font-medium">Общая стоимость</h3>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-500">Текущая</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(comparison.current.totalValue)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Сценарий</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(comparison.scenario.totalValue)}
              </p>
            </div>
            <div
              className={`flex items-center gap-2 p-2 rounded border ${getTrendColor(
                comparison.diff.totalValue
              )}`}
            >
              {getTrendIcon(comparison.diff.totalValue)}
              <div className="flex-1">
                <p className="text-xs font-medium">Изменение</p>
                <p className="text-sm font-semibold">
                  {formatCurrency(comparison.diff.totalValue)} (
                  {formatPercentage(comparison.diff.totalValuePercent)})
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Diversification Score */}
        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 text-gray-600 mb-3">
            <Target className="w-5 h-5" />
            <h3 className="font-medium">Диверсификация</h3>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-500">Текущая</p>
              <p className="text-lg font-semibold text-gray-900">
                {(comparison.current.diversificationScore * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Сценарий</p>
              <p className="text-lg font-semibold text-gray-900">
                {(comparison.scenario.diversificationScore * 100).toFixed(1)}%
              </p>
            </div>
            <div
              className={`flex items-center gap-2 p-2 rounded border ${getTrendColor(
                comparison.diff.diversificationScore
              )}`}
            >
              {getTrendIcon(comparison.diff.diversificationScore)}
              <div className="flex-1">
                <p className="text-xs font-medium">Изменение</p>
                <p className="text-sm font-semibold">
                  {comparison.diff.diversificationScore > 0 ? '+' : ''}
                  {(comparison.diff.diversificationScore * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* HHI */}
        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 text-gray-600 mb-3">
            <BarChart3 className="w-5 h-5" />
            <h3 className="font-medium">Индекс концентрации (HHI)</h3>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-500">Текущий</p>
              <p className="text-lg font-semibold text-gray-900">
                {comparison.current.hhi}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Сценарий</p>
              <p className="text-lg font-semibold text-gray-900">
                {comparison.scenario.hhi}
              </p>
            </div>
            <div
              className={`flex items-center gap-2 p-2 rounded border ${getTrendColor(
                comparison.diff.hhi,
                true
              )}`}
            >
              {getTrendIcon(comparison.diff.hhi)}
              <div className="flex-1">
                <p className="text-xs font-medium">Изменение</p>
                <p className="text-sm font-semibold">
                  {comparison.diff.hhi > 0 ? '+' : ''}
                  {comparison.diff.hhi}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Position Count */}
        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 text-gray-600 mb-3">
            <PieChart className="w-5 h-5" />
            <h3 className="font-medium">Количество позиций</h3>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-500">Текущее</p>
              <p className="text-lg font-semibold text-gray-900">
                {comparison.current.positionCount}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Сценарий</p>
              <p className="text-lg font-semibold text-gray-900">
                {comparison.scenario.positionCount}
              </p>
            </div>
            <div
              className={`flex items-center gap-2 p-2 rounded border ${getTrendColor(
                comparison.diff.positionCount
              )}`}
            >
              {getTrendIcon(comparison.diff.positionCount)}
              <div className="flex-1">
                <p className="text-xs font-medium">Изменение</p>
                <p className="text-sm font-semibold">
                  {comparison.diff.positionCount > 0 ? '+' : ''}
                  {comparison.diff.positionCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cash Impact */}
        <div className="p-4 border border-gray-200 rounded-lg md:col-span-2">
          <div className="flex items-center gap-2 text-gray-600 mb-3">
            <DollarSign className="w-5 h-5" />
            <h3 className="font-medium">Влияние на денежные средства</h3>
          </div>
          <div
            className={`p-3 rounded border ${getTrendColor(
              comparison.diff.cashImpact,
              true
            )}`}
          >
            <div className="flex items-center gap-2">
              {getTrendIcon(comparison.diff.cashImpact)}
              <div>
                <p className="text-sm font-medium">
                  {comparison.diff.cashImpact > 0
                    ? 'Требуется средств'
                    : comparison.diff.cashImpact < 0
                    ? 'Высвобождается средств'
                    : 'Без изменений'}
                </p>
                <p className="text-lg font-semibold">
                  {formatCurrency(Math.abs(comparison.diff.cashImpact))}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sector Allocation Comparison */}
      <div className="p-6 border-t border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-4">
          Распределение по секторам
        </h3>
        <div className="space-y-3">
          {sectorComparison.map((sector) => (
            <div key={sector.sector} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-900">
                  {sector.label}
                </span>
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <span>
                    Текущее: {sector.current.percentage.toFixed(1)}% (
                    {sector.current.count})
                  </span>
                  <span>
                    Сценарий: {sector.scenario.percentage.toFixed(1)}% (
                    {sector.scenario.count})
                  </span>
                  <span
                    className={
                      sector.diff.percentage > 0
                        ? 'text-green-600'
                        : sector.diff.percentage < 0
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }
                  >
                    {sector.diff.percentage > 0 ? '+' : ''}
                    {sector.diff.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                {/* Current bar */}
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${sector.current.percentage}%` }}
                  />
                </div>
                {/* Scenario bar */}
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${sector.scenario.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

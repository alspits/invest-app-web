'use client';

/**
 * ValueComparisonBarChart Component
 *
 * Grouped bar chart comparing key metrics between current and scenario portfolios.
 * Displays total value, diversification score, and HHI with visual comparison.
 */

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ScenarioMetrics } from '@/types/scenario';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ValueComparisonBarChartProps {
  currentMetrics: ScenarioMetrics;
  scenarioMetrics: ScenarioMetrics;
}

interface ChartDataItem {
  name: string;
  current: number;
  scenario: number;
  unit: string;
  displayFormatter: (value: number) => string;
  inverse?: boolean; // For HHI where lower is better
}

export function ValueComparisonBarChart({
  currentMetrics,
  scenarioMetrics,
}: ValueComparisonBarChartProps) {
  // Prepare chart data
  const chartData = useMemo((): ChartDataItem[] => {
    return [
      {
        name: 'Общая стоимость',
        current: currentMetrics.totalValue,
        scenario: scenarioMetrics.totalValue,
        unit: 'RUB',
        displayFormatter: (value: number) =>
          new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(value),
      },
      {
        name: 'Диверсификация',
        current: currentMetrics.diversificationScore * 100,
        scenario: scenarioMetrics.diversificationScore * 100,
        unit: '%',
        displayFormatter: (value: number) => `${value.toFixed(1)}%`,
      },
      {
        name: 'Индекс HHI',
        current: currentMetrics.hhi,
        scenario: scenarioMetrics.hhi,
        unit: '',
        displayFormatter: (value: number) => value.toFixed(0),
        inverse: true,
      },
    ];
  }, [currentMetrics, scenarioMetrics]);

  // Calculate differences for each metric
  const metricDifferences = useMemo(() => {
    return chartData.map((item) => ({
      name: item.name,
      diff: item.scenario - item.current,
      percentDiff:
        item.current !== 0
          ? ((item.scenario - item.current) / item.current) * 100
          : 0,
      inverse: item.inverse,
    }));
  }, [chartData]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const metricItem = chartData.find((item) => item.name === label);
    if (!metricItem) return null;

    const currentValue = payload[0].value;
    const scenarioValue = payload[1].value;
    const diff = scenarioValue - currentValue;
    const percentDiff =
      currentValue !== 0 ? ((diff / currentValue) * 100).toFixed(1) : '0.0';

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
        <p className="font-semibold text-gray-900 mb-3">{label}</p>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-blue-500 rounded-sm flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">Текущее значение</p>
              <p className="text-sm font-medium text-gray-900">
                {metricItem.displayFormatter(currentValue)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-sm flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">Сценарий</p>
              <p className="text-sm font-medium text-gray-900">
                {metricItem.displayFormatter(scenarioValue)}
              </p>
            </div>
          </div>
          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500">Изменение</p>
            <p
              className={`text-sm font-semibold ${
                metricItem.inverse
                  ? diff < 0
                    ? 'text-green-600'
                    : diff > 0
                    ? 'text-red-600'
                    : 'text-gray-600'
                  : diff > 0
                  ? 'text-green-600'
                  : diff < 0
                  ? 'text-red-600'
                  : 'text-gray-600'
              }`}
            >
              {diff > 0 ? '+' : ''}
              {metricItem.displayFormatter(diff)} ({percentDiff}%)
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Custom legend
  const renderLegend = () => {
    return (
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-sm" />
          <span className="text-sm text-gray-700">Текущий портфель</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-sm" />
          <span className="text-sm text-gray-700">Сценарий</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Сравнение метрик
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Ключевые показатели портфеля: текущий vs. сценарий
        </p>
      </div>

      {/* Chart */}
      <div className="p-6">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              angle={-15}
              textAnchor="end"
              height={80}
              interval={0}
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={renderLegend} />
            <Bar
              dataKey="current"
              fill="#3b82f6"
              name="Текущий портфель"
              radius={[4, 4, 0, 0]}
              maxBarSize={80}
            />
            <Bar
              dataKey="scenario"
              fill="#10b981"
              name="Сценарий"
              radius={[4, 4, 0, 0]}
              maxBarSize={80}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Metric Changes Summary */}
      <div className="px-6 pb-6 border-t border-gray-200">
        <h4 className="font-medium text-gray-900 mb-4">Изменения метрик</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {metricDifferences.map((metric, index) => {
            const isPositive = metric.inverse
              ? metric.diff < 0
              : metric.diff > 0;
            const isNegative = metric.inverse
              ? metric.diff > 0
              : metric.diff < 0;
            const isNeutral = metric.diff === 0;

            const chartItem = chartData[index];

            return (
              <div
                key={metric.name}
                className={`p-4 border rounded-lg ${
                  isPositive
                    ? 'bg-green-50 border-green-200'
                    : isNegative
                    ? 'bg-red-50 border-red-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h5 className="font-medium text-gray-900 text-sm">
                    {metric.name}
                  </h5>
                  {isPositive && (
                    <TrendingUp className="w-4 h-4 text-green-600 flex-shrink-0" />
                  )}
                  {isNegative && (
                    <TrendingDown className="w-4 h-4 text-red-600 flex-shrink-0" />
                  )}
                  {isNeutral && (
                    <Minus className="w-4 h-4 text-gray-600 flex-shrink-0" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-gray-600">Текущее:</span>
                    <span className="font-medium text-gray-900">
                      {chartItem.displayFormatter(chartItem.current)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-gray-600">Сценарий:</span>
                    <span className="font-medium text-gray-900">
                      {chartItem.displayFormatter(chartItem.scenario)}
                    </span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-gray-200">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-gray-600">Изменение:</span>
                      <span
                        className={`text-sm font-semibold ${
                          isPositive
                            ? 'text-green-700'
                            : isNegative
                            ? 'text-red-700'
                            : 'text-gray-700'
                        }`}
                      >
                        {metric.diff > 0 ? '+' : ''}
                        {chartItem.displayFormatter(metric.diff)}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-xs text-gray-600">В процентах:</span>
                      <span
                        className={`text-xs font-medium ${
                          isPositive
                            ? 'text-green-700'
                            : isNegative
                            ? 'text-red-700'
                            : 'text-gray-700'
                        }`}
                      >
                        {metric.percentDiff > 0 ? '+' : ''}
                        {metric.percentDiff.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interpretation Guide */}
      <div className="px-6 pb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="font-medium text-blue-900 mb-2 text-sm">
            Интерпретация результатов
          </h5>
          <ul className="space-y-1 text-xs text-blue-800">
            <li className="flex items-start gap-2">
              <span className="mt-0.5">•</span>
              <span>
                <strong>Общая стоимость:</strong> увеличение обычно положительно, но
                требует дополнительных инвестиций
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">•</span>
              <span>
                <strong>Диверсификация:</strong> более высокий процент означает лучшее
                распределение рисков
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">•</span>
              <span>
                <strong>Индекс HHI:</strong> меньшее значение указывает на более
                диверсифицированный портфель (0-10000)
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

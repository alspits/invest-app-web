'use client';

/**
 * Geography Exposure Component
 *
 * Visualizes portfolio geographic allocation with benchmark comparison
 */

import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { GeographyExposure as GeographyExposureType, GeographyType } from '@/types/analytics';

// ============================================================================
// Constants
// ============================================================================

const GEOGRAPHY_COLORS: Record<GeographyType, string> = {
  russia: '#0ea5e9',    // Sky Blue - Russia
  usa: '#ef4444',       // Red - USA
  europe: '#8b5cf6',    // Purple - Europe
  asia: '#f59e0b',      // Amber - Asia
  other: '#6b7280',     // Gray - Other
};

const GEOGRAPHY_NAMES: Record<GeographyType, string> = {
  russia: 'Россия',
  usa: 'США',
  europe: 'Европа',
  asia: 'Азия',
  other: 'Прочее',
};

const GEOGRAPHY_EMOJI: Record<GeographyType, string> = {
  russia: '🇷🇺',
  usa: '🇺🇸',
  europe: '🇪🇺',
  asia: '🌏',
  other: '🌍',
};

// ============================================================================
// Component Props
// ============================================================================

interface GeographyExposureProps {
  data: GeographyExposureType[];
  showBenchmark?: boolean;
  viewMode?: 'pie' | 'bar';
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)} млрд ₽`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)} млн ₽`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K ₽`;
  }
  return `${value.toFixed(0)} ₽`;
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

// ============================================================================
// Subcomponents
// ============================================================================

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload[0]) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <p className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
        <span className="text-xl">{GEOGRAPHY_EMOJI[data.geography as GeographyType]}</span>
        {GEOGRAPHY_NAMES[data.geography as GeographyType]}
      </p>
      <div className="space-y-1 text-sm">
        <p className="text-gray-700 dark:text-gray-300">
          Стоимость: <span className="font-medium">{formatCurrency(data.value)}</span>
        </p>
        <p className="text-gray-700 dark:text-gray-300">
          Доля: <span className="font-medium">{formatPercent(data.weight)}</span>
        </p>
        <p className="text-gray-700 dark:text-gray-300">
          Позиций: <span className="font-medium">{data.count}</span>
        </p>
        {data.benchmarkWeight !== undefined && (
          <>
            <div className="border-t border-gray-200 dark:border-gray-600 my-1 pt-1">
              <p className="text-gray-600 dark:text-gray-400 text-xs">Бенчмарк (MOEX):</p>
            </div>
            <p className="text-gray-700 dark:text-gray-300">
              Доля в MOEX: <span className="font-medium">{formatPercent(data.benchmarkWeight)}</span>
            </p>
            <p className={`${data.deviation! > 0 ? 'text-green-600' : 'text-red-600'}`}>
              Отклонение: <span className="font-medium">
                {data.deviation! > 0 ? '+' : ''}{formatPercent(data.deviation!)}
              </span>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

const DeviationIndicator = ({ deviation }: { deviation: number }) => {
  const isOverweight = deviation > 0;
  const significance = Math.abs(deviation);

  if (significance < 2) return null;

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
      isOverweight
        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    }`}>
      {isOverweight ? '↑' : '↓'} {formatPercent(Math.abs(deviation))}
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export default function GeographyExposure({
  data,
  showBenchmark = true,
  viewMode = 'pie',
}: GeographyExposureProps) {
  // Prepare chart data
  const pieData = useMemo(() => {
    return data.map(item => ({
      name: GEOGRAPHY_NAMES[item.geography],
      value: item.weight,
      ...item,
    }));
  }, [data]);

  const barData = useMemo(() => {
    if (!showBenchmark) {
      return data.map(item => ({
        name: GEOGRAPHY_NAMES[item.geography],
        portfolio: item.weight,
      }));
    }

    return data.map(item => ({
      name: GEOGRAPHY_NAMES[item.geography],
      portfolio: item.weight,
      benchmark: item.benchmarkWeight || 0,
    }));
  }, [data, showBenchmark]);

  // Calculate totals
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  const totalPositions = data.reduce((sum, item) => sum + item.count, 0);

  // Diversification assessment
  const russiaWeight = data.find(d => d.geography === 'russia')?.weight || 0;
  const foreignWeight = 100 - russiaWeight;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Географическое распределение
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {data.length} регионов • {totalPositions} позиций • {formatCurrency(totalValue)}
          </p>
        </div>
      </div>

      {/* Diversification Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🇷🇺</span>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
              Российские активы
            </p>
          </div>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
            {formatPercent(russiaWeight)}
          </p>
        </div>
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🌍</span>
            <p className="text-sm font-medium text-purple-900 dark:text-purple-300">
              Зарубежные активы
            </p>
          </div>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">
            {formatPercent(foreignWeight)}
          </p>
        </div>
      </div>

      {/* Chart */}
      {viewMode === 'pie' ? (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={GEOGRAPHY_COLORS[entry.geography]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis
                dataKey="name"
                className="text-sm fill-gray-600 dark:fill-gray-400"
              />
              <YAxis
                label={{ value: 'Доля (%)', angle: -90, position: 'insideLeft' }}
                className="text-sm fill-gray-600 dark:fill-gray-400"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="portfolio" fill="#3b82f6" name="Портфель" />
              {showBenchmark && (
                <Bar dataKey="benchmark" fill="#9ca3af" name="MOEX" />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Geography List with Deviations */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Детализация по регионам
        </h4>
        <div className="grid grid-cols-1 gap-2">
          {data
            .sort((a, b) => b.weight - a.weight)
            .map(item => (
              <div
                key={item.geography}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{GEOGRAPHY_EMOJI[item.geography]}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {GEOGRAPHY_NAMES[item.geography]}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.count} {item.count === 1 ? 'позиция' : 'позиций'} • {formatCurrency(item.value)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatPercent(item.weight)}
                  </span>
                  {showBenchmark && item.deviation !== undefined && (
                    <DeviationIndicator deviation={item.deviation} />
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
          💡 Анализ географической диверсификации
        </h4>
        <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          {russiaWeight > 95 && (
            <p>
              • Высокая концентрация в российских активах ({formatPercent(russiaWeight)}).
              Рассмотрите добавление зарубежных активов для снижения страновых рисков.
            </p>
          )}
          {foreignWeight > 50 && (
            <p>
              • Значительная доля зарубежных активов ({formatPercent(foreignWeight)}).
              Учитывайте валютные и геополитические риски.
            </p>
          )}
          {russiaWeight >= 70 && russiaWeight <= 90 && (
            <p>
              • Сбалансированная аллокация с фокусом на российский рынок.
              Хорошее соотношение доступности и диверсификации.
            </p>
          )}
          {foreignWeight >= 20 && foreignWeight <= 40 && (
            <p>
              • Умеренная международная диверсификация ({formatPercent(foreignWeight)}).
              Снижает страновые риски, сохраняя фокус на локальном рынке.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

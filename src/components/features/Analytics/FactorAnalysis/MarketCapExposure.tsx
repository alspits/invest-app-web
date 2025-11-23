'use client';

/**
 * Market Cap Exposure Component
 *
 * Visualizes portfolio market cap distribution (Large/Mid/Small cap)
 */

import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { MarketCapExposure as MarketCapExposureType, MarketCapType } from '@/types/analytics';

// ============================================================================
// Constants
// ============================================================================

const MARKET_CAP_COLORS: Record<MarketCapType, string> = {
  large: '#3b82f6',   // Blue - Large Cap
  mid: '#10b981',     // Green - Mid Cap
  small: '#f59e0b',   // Amber - Small Cap
};

const MARKET_CAP_NAMES: Record<MarketCapType, string> = {
  large: 'Large Cap',
  mid: 'Mid Cap',
  small: 'Small Cap',
};

const MARKET_CAP_DESCRIPTIONS: Record<MarketCapType, string> = {
  large: '> 200 млрд ₽',
  mid: '10-200 млрд ₽',
  small: '< 10 млрд ₽',
};

// ============================================================================
// Component Props
// ============================================================================

interface MarketCapExposureProps {
  data: MarketCapExposureType[];
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
      <p className="font-semibold text-gray-900 dark:text-white mb-2">
        {MARKET_CAP_NAMES[data.marketCap as MarketCapType]}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        {MARKET_CAP_DESCRIPTIONS[data.marketCap as MarketCapType]}
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
      </div>
    </div>
  );
};

const RiskIndicator = ({ marketCap, weight }: { marketCap: MarketCapType; weight: number }) => {
  // Risk assessment based on market cap distribution
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  let riskText = '';

  if (marketCap === 'small' && weight > 30) {
    riskLevel = 'high';
    riskText = 'Высокий риск';
  } else if (marketCap === 'small' && weight > 15) {
    riskLevel = 'medium';
    riskText = 'Средний риск';
  } else if (marketCap === 'large' && weight > 70) {
    riskLevel = 'medium';
    riskText = 'Низкая диверсификация';
  }

  if (!riskText) return null;

  const colors = {
    low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${colors[riskLevel]}`}>
      {riskText}
    </span>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export default function MarketCapExposure({
  data,
  viewMode = 'pie',
}: MarketCapExposureProps) {
  // Prepare chart data
  const pieData = useMemo(() => {
    return data.map(item => ({
      name: MARKET_CAP_NAMES[item.marketCap],
      value: item.weight,
      ...item,
    }));
  }, [data]);

  const barData = useMemo(() => {
    return data.map(item => ({
      name: MARKET_CAP_NAMES[item.marketCap],
      weight: item.weight,
      value: item.value,
    }));
  }, [data]);

  // Calculate totals
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  const totalPositions = data.reduce((sum, item) => sum + item.count, 0);

  // Risk assessment
  const smallCapWeight = data.find(d => d.marketCap === 'small')?.weight || 0;
  const largeCapWeight = data.find(d => d.marketCap === 'large')?.weight || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Распределение по капитализации
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {totalPositions} позиций • {formatCurrency(totalValue)}
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
                  <Cell key={`cell-${index}`} fill={MARKET_CAP_COLORS[entry.marketCap]} />
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
              <Bar dataKey="weight" fill="#3b82f6" name="Доля портфеля" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Market Cap Breakdown */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Детализация по капитализации
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {data.map(item => (
            <div
              key={item.marketCap}
              className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: MARKET_CAP_COLORS[item.marketCap] }}
                  />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {MARKET_CAP_NAMES[item.marketCap]}
                  </span>
                </div>
                <RiskIndicator marketCap={item.marketCap} weight={item.weight} />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                {MARKET_CAP_DESCRIPTIONS[item.marketCap]}
              </p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Доля:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatPercent(item.weight)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Стоимость:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(item.value)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Позиций:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {item.count}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
          💡 Рекомендации по капитализации
        </h4>
        <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          {largeCapWeight > 70 && (
            <p>
              • Высокая концентрация в Large Cap ({formatPercent(largeCapWeight)}).
              Рассмотрите добавление Mid/Small Cap для повышения потенциальной доходности.
            </p>
          )}
          {smallCapWeight > 30 && (
            <p>
              • Высокая доля Small Cap ({formatPercent(smallCapWeight)}).
              Это увеличивает риск, но может дать более высокую доходность.
            </p>
          )}
          {smallCapWeight < 5 && largeCapWeight > 80 && (
            <p>
              • Консервативный портфель с фокусом на Large Cap.
              Стабильный, но с ограниченным потенциалом роста.
            </p>
          )}
          {smallCapWeight >= 10 && smallCapWeight <= 30 && (
            <p>
              • Сбалансированное распределение по капитализации.
              Хорошее соотношение риска и доходности.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

/**
 * Currency Exposure Component
 *
 * Visualizes portfolio currency denomination breakdown
 */

import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { CurrencyExposure as CurrencyExposureType, CurrencyType } from '@/types/analytics';

// ============================================================================
// Constants
// ============================================================================

const CURRENCY_COLORS: Record<CurrencyType, string> = {
  RUB: '#0ea5e9',    // Sky Blue - Ruble
  USD: '#22c55e',    // Green - Dollar
  EUR: '#8b5cf6',    // Purple - Euro
  CNY: '#ef4444',    // Red - Yuan
  other: '#6b7280',  // Gray - Other
};

const CURRENCY_NAMES: Record<CurrencyType, string> = {
  RUB: 'Российский рубль',
  USD: 'Доллар США',
  EUR: 'Евро',
  CNY: 'Китайский юань',
  other: 'Прочие валюты',
};

const CURRENCY_SYMBOLS: Record<CurrencyType, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
  CNY: '¥',
  other: '💱',
};

// ============================================================================
// Component Props
// ============================================================================

interface CurrencyExposureProps {
  data: CurrencyExposureType[];
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
        <span className="text-xl">{CURRENCY_SYMBOLS[data.currency as CurrencyType]}</span>
        {CURRENCY_NAMES[data.currency as CurrencyType]}
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

const RiskIndicator = ({ currency, weight }: { currency: CurrencyType; weight: number }) => {
  // Currency risk assessment
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  let riskText = '';

  if (currency === 'USD' && weight > 50) {
    riskLevel = 'high';
    riskText = 'Высокий валютный риск';
  } else if (currency === 'USD' && weight > 30) {
    riskLevel = 'medium';
    riskText = 'Средний валютный риск';
  } else if (currency === 'EUR' && weight > 30) {
    riskLevel = 'medium';
    riskText = 'Валютный риск EUR';
  } else if (currency === 'RUB' && weight > 95) {
    riskLevel = 'medium';
    riskText = 'Нет валютной диверсификации';
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

export default function CurrencyExposure({
  data,
  viewMode = 'pie',
}: CurrencyExposureProps) {
  // Prepare chart data
  const pieData = useMemo(() => {
    return data.map(item => ({
      name: `${CURRENCY_SYMBOLS[item.currency]} ${item.currency}`,
      value: item.weight,
      ...item,
    }));
  }, [data]);

  const barData = useMemo(() => {
    return data.map(item => ({
      name: `${CURRENCY_SYMBOLS[item.currency]} ${item.currency}`,
      weight: item.weight,
      value: item.value,
    }));
  }, [data]);

  // Calculate totals
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  const totalPositions = data.reduce((sum, item) => sum + item.count, 0);

  // Currency risk assessment
  const rubWeight = data.find(d => d.currency === 'RUB')?.weight || 0;
  const foreignCurrencyWeight = 100 - rubWeight;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Валютное распределение
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {data.length} валют • {totalPositions} позиций • {formatCurrency(totalValue)}
          </p>
        </div>
      </div>

      {/* Currency Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">₽</span>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
              Рублевые активы
            </p>
          </div>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
            {formatPercent(rubWeight)}
          </p>
        </div>
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">💱</span>
            <p className="text-sm font-medium text-green-900 dark:text-green-300">
              Иностранная валюта
            </p>
          </div>
          <p className="text-2xl font-bold text-green-900 dark:text-green-300">
            {formatPercent(foreignCurrencyWeight)}
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
                  <Cell key={`cell-${index}`} fill={CURRENCY_COLORS[entry.currency]} />
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

      {/* Currency List */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Детализация по валютам
        </h4>
        <div className="grid grid-cols-1 gap-2">
          {data
            .sort((a, b) => b.weight - a.weight)
            .map(item => (
              <div
                key={item.currency}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold text-white"
                    style={{ backgroundColor: CURRENCY_COLORS[item.currency] }}
                  >
                    {CURRENCY_SYMBOLS[item.currency]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {CURRENCY_NAMES[item.currency]}
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
                  <RiskIndicator currency={item.currency} weight={item.weight} />
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Currency Risk Analysis */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
          💡 Анализ валютных рисков
        </h4>
        <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          {rubWeight > 95 && (
            <p>
              • Портфель полностью в рублях ({formatPercent(rubWeight)}).
              Нет защиты от девальвации рубля. Рассмотрите добавление валютных активов.
            </p>
          )}
          {foreignCurrencyWeight > 60 && (
            <p>
              • Высокая доля иностранной валюты ({formatPercent(foreignCurrencyWeight)}).
              Сильная зависимость от курса рубля. Валютная переоценка может значительно влиять на доходность.
            </p>
          )}
          {rubWeight >= 60 && rubWeight <= 80 && (
            <p>
              • Сбалансированное валютное распределение.
              Умеренная защита от девальвации при сохранении рублевой базы.
            </p>
          )}
          {foreignCurrencyWeight >= 20 && foreignCurrencyWeight <= 40 && (
            <p>
              • Умеренная валютная диверсификация ({formatPercent(foreignCurrencyWeight)}).
              Хороший баланс между защитой от девальвации и валютными рисками.
            </p>
          )}
          <p className="pt-2 border-t border-blue-200 dark:border-blue-700">
            <strong>Напоминание:</strong> Валютные активы подвержены колебаниям курса.
            При укреплении рубля стоимость валютных активов может снижаться.
          </p>
        </div>
      </div>
    </div>
  );
}

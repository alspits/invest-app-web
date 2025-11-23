'use client';

import { useMemo } from 'react';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { useAnalyticsStore } from '@/stores/analytics';
import { useGoalStore } from '@/stores/goalStore';
import { moneyValueToNumber, quotationToNumber } from '@/lib/tinkoff-api';
import {
  TrendingUp,
  TrendingDown,
  Target,
  PieChart,
  Calendar,
  Minus,
} from 'lucide-react';

interface PerformanceMetric {
  label: string;
  value: string;
  change?: string;
  changePercent?: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'green' | 'red' | 'gray' | 'blue' | 'purple';
}

export function PerformanceSummary() {
  const { portfolio } = usePortfolioStore();
  const { snapshots, metrics } = useAnalyticsStore();
  const { goals, goalProgresses } = useGoalStore();

  // Calculate total portfolio value
  const totalValue = useMemo(() => {
    if (!portfolio) return 0;

    let total = 0;
    portfolio.positions.forEach((position) => {
      const quantity = quotationToNumber(position.quantity);
      const price = position.currentPrice
        ? moneyValueToNumber(position.currentPrice)
        : 0;
      total += quantity * price;
    });

    return total;
  }, [portfolio]);

  // Calculate weekly change
  const weeklyChange = useMemo(() => {
    if (!snapshots || snapshots.length < 2) {
      return { absolute: 0, percent: 0 };
    }

    // Find snapshot from ~7 days ago
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Find the closest snapshot to 7 days ago
    let weekSnapshot = snapshots[0];
    let minDiff = Math.abs(weekSnapshot.timestamp.getTime() - weekAgo.getTime());

    for (const snapshot of snapshots) {
      const diff = Math.abs(snapshot.timestamp.getTime() - weekAgo.getTime());
      if (diff < minDiff) {
        minDiff = diff;
        weekSnapshot = snapshot;
      }
    }

    const weekValue = weekSnapshot.totalValue;
    const absolute = totalValue - weekValue;
    const percent = weekValue !== 0 ? (absolute / weekValue) * 100 : 0;

    return { absolute, percent };
  }, [snapshots, totalValue]);

  // Find best and worst performing assets
  const { bestAsset, worstAsset } = useMemo(() => {
    if (!portfolio || !portfolio.positions || portfolio.positions.length === 0) {
      return { bestAsset: null, worstAsset: null };
    }

    let best = portfolio.positions[0];
    let worst = portfolio.positions[0];
    let bestYield = quotationToNumber(best.expectedYield);
    let worstYield = quotationToNumber(worst.expectedYield);

    portfolio.positions.forEach((position) => {
      const yieldValue = quotationToNumber(position.expectedYield);
      if (yieldValue > bestYield) {
        bestYield = yieldValue;
        best = position;
      }
      if (yieldValue < worstYield) {
        worstYield = yieldValue;
        worst = position;
      }
    });

    return { bestAsset: best, worstAsset: worst };
  }, [portfolio]);

  // Calculate sector allocation (by instrument type as proxy)
  const sectorAllocation = useMemo(() => {
    if (!portfolio || !portfolio.positions || portfolio.positions.length === 0) {
      return [];
    }

    const allocation: Record<string, number> = {};
    let total = 0;

    portfolio.positions.forEach((position) => {
      const quantity = quotationToNumber(position.quantity);
      const price = position.currentPrice
        ? moneyValueToNumber(position.currentPrice)
        : 0;
      const value = quantity * price;

      const type = position.instrumentType || 'Unknown';
      allocation[type] = (allocation[type] || 0) + value;
      total += value;
    });

    // Convert to percentages and sort by value
    return Object.entries(allocation)
      .map(([type, value]) => ({
        type: formatInstrumentType(type),
        value,
        percentage: total !== 0 ? (value / total) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [portfolio]);

  // Calculate goal completion rate
  const goalCompletionRate = useMemo(() => {
    if (goals.length === 0) return 0;

    let totalProgress = 0;
    goals.forEach((goal) => {
      const progress = goalProgresses.get(goal.id);
      if (progress) {
        totalProgress += Math.min(progress.progress, 100);
      }
    });

    return totalProgress / goals.length;
  }, [goals, goalProgresses]);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format percentage
  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Format instrument type
  function formatInstrumentType(type: string): string {
    const mapping: Record<string, string> = {
      share: 'Акции',
      bond: 'Облигации',
      etf: 'ETF',
      currency: 'Валюта',
      futures: 'Фьючерсы',
    };
    return mapping[type.toLowerCase()] || type;
  }

  // Build metrics array
  const performanceMetrics: PerformanceMetric[] = [
    {
      label: 'Стоимость портфеля',
      value: formatCurrency(totalValue),
      change: weeklyChange.absolute !== 0 ? formatCurrency(weeklyChange.absolute) : undefined,
      changePercent: weeklyChange.percent,
      icon: TrendingUp,
      color: weeklyChange.percent >= 0 ? 'green' : 'red',
    },
    {
      label: 'ROI',
      value: metrics ? `${metrics.roi.toFixed(2)}%` : '—',
      change: metrics ? formatCurrency(metrics.roiAbsolute) : undefined,
      changePercent: metrics?.roi,
      icon: TrendingUp,
      color: (metrics?.roi || 0) >= 0 ? 'green' : 'red',
    },
    {
      label: 'Выполнение целей',
      value: `${goalCompletionRate.toFixed(1)}%`,
      change: goals.length > 0 ? `${goals.length} ${goals.length === 1 ? 'цель' : 'целей'}` : undefined,
      icon: Target,
      color: goalCompletionRate >= 80 ? 'green' : goalCompletionRate >= 50 ? 'blue' : 'gray',
    },
  ];

  // Determine trend icon and color
  const getTrendIcon = (changePercent?: number) => {
    if (!changePercent) return Minus;
    if (changePercent > 0) return TrendingUp;
    if (changePercent < 0) return TrendingDown;
    return Minus;
  };

  const getColorClasses = (color: string) => {
    const colorMap = {
      green: {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200',
        icon: 'text-green-600',
      },
      red: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        icon: 'text-red-600',
      },
      blue: {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        icon: 'text-blue-600',
      },
      purple: {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200',
        icon: 'text-purple-600',
      },
      gray: {
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        border: 'border-gray-200',
        icon: 'text-gray-600',
      },
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.gray;
  };

  if (!portfolio) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Обзор производительности</h2>
        <Calendar className="w-5 h-5 text-gray-400" />
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {performanceMetrics.map((metric, index) => {
          const colors = getColorClasses(metric.color);
          const TrendIcon = getTrendIcon(metric.changePercent);
          const MetricIcon = metric.icon;

          return (
            <div
              key={index}
              className={`p-4 rounded-lg border ${colors.border} ${colors.bg}`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm text-gray-600">{metric.label}</span>
                <MetricIcon className={`w-4 h-4 ${colors.icon}`} />
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                {metric.change && (
                  <div className={`flex items-center gap-1 text-sm ${colors.text}`}>
                    <TrendIcon className="w-3 h-3" />
                    <span>{metric.change}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Best/Worst Performers */}
      {bestAsset && worstAsset && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Best Performer */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Лучший актив</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {bestAsset.ticker || bestAsset.figi}
            </p>
            <p className="text-sm text-gray-600">{bestAsset.name || '—'}</p>
            <p className="text-lg font-semibold text-green-700 mt-1">
              {formatPercent(quotationToNumber(bestAsset.expectedYield) * 100)}
            </p>
          </div>

          {/* Worst Performer */}
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">Худший актив</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {worstAsset.ticker || worstAsset.figi}
            </p>
            <p className="text-sm text-gray-600">{worstAsset.name || '—'}</p>
            <p className="text-lg font-semibold text-red-700 mt-1">
              {formatPercent(quotationToNumber(worstAsset.expectedYield) * 100)}
            </p>
          </div>
        </div>
      )}

      {/* Sector Allocation */}
      {sectorAllocation.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-900">Распределение по типам</h3>
          </div>
          <div className="space-y-2">
            {sectorAllocation.map((sector, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{sector.type}</span>
                  <span className="font-medium text-gray-900">
                    {sector.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${sector.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

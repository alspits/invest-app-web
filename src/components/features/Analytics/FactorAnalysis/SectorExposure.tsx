'use client';

/**
 * Sector Exposure Component
 *
 * Visualizes portfolio sector allocation with benchmark comparison
 */

import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { SectorExposure as SectorExposureType, SectorType } from '@/types/analytics';

// ============================================================================
// Constants
// ============================================================================

const SECTOR_COLORS: Record<SectorType, string> = {
  finance: '#3b82f6',      // Blue
  energy: '#f59e0b',       // Amber
  materials: '#84cc16',    // Lime
  tech: '#8b5cf6',         // Purple
  telecom: '#ec4899',      // Pink
  consumer: '#10b981',     // Emerald
  utilities: '#06b6d4',    // Cyan
  industrial: '#6366f1',   // Indigo
  healthcare: '#f97316',   // Orange
  realestate: '#14b8a6',   // Teal
  other: '#6b7280',        // Gray
};

const SECTOR_NAMES: Record<SectorType, string> = {
  finance: 'Финансы',
  energy: 'Энергетика',
  materials: 'Материалы',
  tech: 'Технологии',
  telecom: 'Телеком',
  consumer: 'Потребительский',
  utilities: 'Коммунальные',
  industrial: 'Промышленность',
  healthcare: 'Здравоохранение',
  realestate: 'Недвижимость',
  other: 'Прочее',
};

// ============================================================================
// Component Props
// ============================================================================

interface SectorExposureProps {
  data: SectorExposureType[];
  showBenchmark?: boolean;
  viewMode?: 'pie' | 'bar';
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M ₽`;
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
        {SECTOR_NAMES[data.sector as SectorType]}
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

export default function SectorExposure({
  data,
  showBenchmark = true,
  viewMode = 'pie',
}: SectorExposureProps) {
  // Prepare chart data
  const pieData = useMemo(() => {
    return data.map(item => ({
      name: SECTOR_NAMES[item.sector],
      value: item.weight,
      ...item,
    }));
  }, [data]);

  const barData = useMemo(() => {
    if (!showBenchmark) {
      return data.map(item => ({
        name: SECTOR_NAMES[item.sector],
        portfolio: item.weight,
      }));
    }

    return data.map(item => ({
      name: SECTOR_NAMES[item.sector],
      portfolio: item.weight,
      benchmark: item.benchmarkWeight || 0,
    }));
  }, [data, showBenchmark]);

  // Calculate totals
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  const totalPositions = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Распределение по секторам
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {data.length} секторов • {totalPositions} позиций • {formatCurrency(totalValue)}
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
                  <Cell key={`cell-${index}`} fill={SECTOR_COLORS[entry.sector]} />
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
                angle={-45}
                textAnchor="end"
                height={100}
                className="text-xs fill-gray-600 dark:fill-gray-400"
              />
              <YAxis
                label={{ value: 'Доля (%)', angle: -90, position: 'insideLeft' }}
                className="text-xs fill-gray-600 dark:fill-gray-400"
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

      {/* Sector List with Deviations */}
      {showBenchmark && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Отклонения от бенчмарка
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {data
              .filter(item => item.deviation !== undefined && Math.abs(item.deviation) >= 2)
              .sort((a, b) => Math.abs(b.deviation!) - Math.abs(a.deviation!))
              .map(item => (
                <div
                  key={item.sector}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: SECTOR_COLORS[item.sector] }}
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {SECTOR_NAMES[item.sector]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatPercent(item.weight)}
                    </span>
                    <DeviationIndicator deviation={item.deviation!} />
                  </div>
                </div>
              ))}
          </div>
          {data.filter(item => item.deviation !== undefined && Math.abs(item.deviation) >= 2).length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              Нет значительных отклонений от бенчмарка (&gt; 2%)
            </p>
          )}
        </div>
      )}
    </div>
  );
}

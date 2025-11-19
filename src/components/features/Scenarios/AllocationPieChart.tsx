'use client';

/**
 * AllocationPieChart Component
 *
 * Dual pie charts showing sector allocation comparison.
 * Displays current portfolio vs. scenario portfolio side-by-side.
 */

import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ScenarioMetrics } from '@/types/scenario';
import { getInstrumentTypeLabel } from '@/lib/scenario-calculations';
import { ArrowLeftRight } from 'lucide-react';

interface AllocationPieChartProps {
  currentMetrics: ScenarioMetrics;
  scenarioMetrics: ScenarioMetrics;
}

// Color palette for sectors (consistent across both charts)
const COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // green-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
];

interface ChartDataItem {
  sector: string;
  label: string;
  value: number;
  percentage: number;
  count: number;
  [key: string]: string | number; // Index signature for Recharts compatibility
}

export function AllocationPieChart({
  currentMetrics,
  scenarioMetrics,
}: AllocationPieChartProps) {
  const [viewMode, setViewMode] = useState<'side-by-side' | 'toggle'>('side-by-side');
  const [activeChart, setActiveChart] = useState<'current' | 'scenario'>('current');

  // Prepare data for current portfolio
  const currentData = useMemo((): ChartDataItem[] => {
    return Object.entries(currentMetrics.sectorAllocation)
      .filter(([_, data]) => data.value > 0)
      .map(([sector, data]) => ({
        sector,
        label: getInstrumentTypeLabel(sector),
        value: data.value,
        percentage: data.percentage,
        count: data.count,
      }))
      .sort((a, b) => b.value - a.value);
  }, [currentMetrics.sectorAllocation]);

  // Prepare data for scenario portfolio
  const scenarioData = useMemo((): ChartDataItem[] => {
    return Object.entries(scenarioMetrics.sectorAllocation)
      .filter(([_, data]) => data.value > 0)
      .map(([sector, data]) => ({
        sector,
        label: getInstrumentTypeLabel(sector),
        value: data.value,
        percentage: data.percentage,
        count: data.count,
      }))
      .sort((a, b) => b.value - a.value);
  }, [scenarioMetrics.sectorAllocation]);

  // Create unified color mapping
  const colorMap = useMemo(() => {
    const allSectors = new Set([
      ...currentData.map((d) => d.sector),
      ...scenarioData.map((d) => d.sector),
    ]);
    const map: Record<string, string> = {};
    Array.from(allSectors).forEach((sector, index) => {
      map[sector] = COLORS[index % COLORS.length];
    });
    return map;
  }, [currentData, scenarioData]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload as ChartDataItem;
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-gray-900 mb-2">{data.label}</p>
        <div className="space-y-1 text-sm">
          <p className="text-gray-700">
            Стоимость:{' '}
            <span className="font-medium">
              {new Intl.NumberFormat('ru-RU', {
                style: 'currency',
                currency: 'RUB',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(data.value)}
            </span>
          </p>
          <p className="text-gray-700">
            Доля: <span className="font-medium">{data.percentage.toFixed(1)}%</span>
          </p>
          <p className="text-gray-700">
            Позиций: <span className="font-medium">{data.count}</span>
          </p>
        </div>
      </div>
    );
  };

  // Custom legend
  const renderLegend = (data: ChartDataItem[]) => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
        {data.map((item) => (
          <div key={item.sector} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: colorMap[item.sector] }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-900 truncate">{item.label}</p>
              <p className="text-xs text-gray-500">
                {item.percentage.toFixed(1)}% ({item.count})
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            Распределение по секторам
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('side-by-side')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                viewMode === 'side-by-side'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Рядом
            </button>
            <button
              onClick={() => setViewMode('toggle')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                viewMode === 'toggle'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Переключение
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          Сравнение распределения активов по типам инструментов
        </p>
      </div>

      {/* Charts */}
      <div className="p-6">
        {viewMode === 'side-by-side' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Current Portfolio Chart */}
            <div>
              <div className="mb-4 text-center">
                <h4 className="font-medium text-gray-900">Текущий портфель</h4>
                <p className="text-xs text-gray-500 mt-1">
                  {new Intl.NumberFormat('ru-RU', {
                    style: 'currency',
                    currency: 'RUB',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(currentMetrics.totalValue)}
                </p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={currentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    label={(props: any) => `${props.percent ? (props.percent * 100).toFixed(0) : 0}%`}
                  >
                    {currentData.map((entry) => (
                      <Cell
                        key={`cell-${entry.sector}`}
                        fill={colorMap[entry.sector]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {renderLegend(currentData)}
            </div>

            {/* Scenario Portfolio Chart */}
            <div>
              <div className="mb-4 text-center">
                <h4 className="font-medium text-gray-900">Сценарий</h4>
                <p className="text-xs text-gray-500 mt-1">
                  {new Intl.NumberFormat('ru-RU', {
                    style: 'currency',
                    currency: 'RUB',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(scenarioMetrics.totalValue)}
                </p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={scenarioData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    label={(props: any) => `${props.percent ? (props.percent * 100).toFixed(0) : 0}%`}
                  >
                    {scenarioData.map((entry) => (
                      <Cell
                        key={`cell-${entry.sector}`}
                        fill={colorMap[entry.sector]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {renderLegend(scenarioData)}
            </div>
          </div>
        ) : (
          <div>
            {/* Toggle View */}
            <div className="mb-6 flex items-center justify-center gap-4">
              <button
                onClick={() => setActiveChart('current')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeChart === 'current'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Текущий портфель
              </button>
              <ArrowLeftRight className="w-5 h-5 text-gray-400" />
              <button
                onClick={() => setActiveChart('scenario')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeChart === 'scenario'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Сценарий
              </button>
            </div>

            {/* Single Chart */}
            <div className="max-w-lg mx-auto">
              <div className="mb-4 text-center">
                <h4 className="font-medium text-gray-900">
                  {activeChart === 'current' ? 'Текущий портфель' : 'Сценарий'}
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  {new Intl.NumberFormat('ru-RU', {
                    style: 'currency',
                    currency: 'RUB',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(
                    activeChart === 'current'
                      ? currentMetrics.totalValue
                      : scenarioMetrics.totalValue
                  )}
                </p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={activeChart === 'current' ? currentData : scenarioData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    label={(props: any) => `${props.percent ? (props.percent * 100).toFixed(0) : 0}%`}
                  >
                    {(activeChart === 'current' ? currentData : scenarioData).map(
                      (entry) => (
                        <Cell
                          key={`cell-${entry.sector}`}
                          fill={colorMap[entry.sector]}
                        />
                      )
                    )}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {renderLegend(activeChart === 'current' ? currentData : scenarioData)}
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="px-6 pb-6 pt-2 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500 mb-1">Позиций</p>
            <p className="font-semibold text-gray-900">
              {currentMetrics.positionCount} → {scenarioMetrics.positionCount}
            </p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Секторов</p>
            <p className="font-semibold text-gray-900">
              {currentData.length} → {scenarioData.length}
            </p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Диверсификация</p>
            <p className="font-semibold text-gray-900">
              {(currentMetrics.diversificationScore * 100).toFixed(1)}% →{' '}
              {(scenarioMetrics.diversificationScore * 100).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">HHI</p>
            <p className="font-semibold text-gray-900">
              {currentMetrics.hhi} → {scenarioMetrics.hhi}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

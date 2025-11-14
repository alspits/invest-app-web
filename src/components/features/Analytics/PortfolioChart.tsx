'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAnalyticsStore } from '@/stores/analyticsStore';
import { getPositionWeights } from '@/lib/analytics';

// Predefined color palette for the pie chart
const COLORS = [
  '#3b82f6', // blue-500
  '#ef4444', // red-500
  '#10b981', // green-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#6366f1', // indigo-500
  '#14b8a6', // teal-500
];

interface ChartData {
  name: string;
  value: number;
}

const PortfolioChart: React.FC = () => {
  const { metrics, snapshots, loading } = useAnalyticsStore();

  // Show loading spinner
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Portfolio Allocation</h2>
        <div className="flex items-center justify-center h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  // Show empty state if no metrics
  if (!metrics || !snapshots || snapshots.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Portfolio Allocation</h2>
        <div className="flex items-center justify-center h-[300px] text-gray-500">
          <p>No portfolio data available</p>
        </div>
      </div>
    );
  }

  // Get current snapshot (last item from snapshots array)
  const currentSnapshot = snapshots[snapshots.length - 1];

  // Get positions with weights
  const positionsWithWeights = getPositionWeights(currentSnapshot.positions);

  // Filter out positions with 0 weight
  const filteredPositions = positionsWithWeights.filter((pos) => pos.weight > 0);

  // Show empty state if no positions
  if (filteredPositions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Portfolio Allocation</h2>
        <div className="flex items-center justify-center h-[300px] text-gray-500">
          <p>No portfolio data available</p>
        </div>
      </div>
    );
  }

  // Transform to chart data format
  const chartData: ChartData[] = filteredPositions.map((pos) => ({
    name: pos.symbol, // Using symbol as the position name
    value: parseFloat(pos.weight.toFixed(2)), // Weight as percentage, rounded to 2 decimals
  }));

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
          <p className="font-semibold">{payload[0].name}</p>
          <p className="text-sm text-gray-600">
            {payload[0].value}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">Portfolio Allocation</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            startAngle={0}
            endAngle={360}
            label={({ name, percent }) =>
              `${name} ${(percent * 100).toFixed(1)}%`
            }
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            layout={chartData.length > 4 ? 'vertical' : 'horizontal'}
            verticalAlign="bottom"
            align="center"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PortfolioChart;

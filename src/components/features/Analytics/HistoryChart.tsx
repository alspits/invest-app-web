import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { useAnalyticsStore } from '../../../stores/analyticsStore';

const HistoryChart: React.FC = () => {
  const { snapshots, loading } = useAnalyticsStore();

  // Loading state
  if (loading && (!snapshots || snapshots.length === 0)) {
    return (
      <div className="w-full bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Portfolio Value Over Time</h3>
        <p className="text-sm text-gray-600 mb-2">Last 30 days</p>
        <div className="flex items-center justify-center h-80">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!snapshots || snapshots.length === 0) {
    return (
      <div className="w-full bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Portfolio Value Over Time</h3>
        <p className="text-sm text-gray-600 mb-2">Last 30 days</p>
        <div className="flex items-center justify-center h-80 text-gray-400">
          <p>No historical data available</p>
        </div>
      </div>
    );
  }

  // Transform snapshots to chart data (memoized)
  const chartData = useMemo(() => {
    return snapshots
      .slice(-30) // Keep last 30 snapshots
      .map((snapshot) => {
        const timestamp = new Date(snapshot.timestamp);
        return {
          date: format(timestamp, 'MMM dd'),
          fullDate: format(timestamp, 'MMM dd, HH:mm'),
          value: Number(snapshot.totalValue.toFixed(2)),
          currency: snapshot.currency,
        };
      });
  }, [snapshots]);

  // Currency symbol mapping
  const getCurrencySymbol = (currency: string): string => {
    const symbols: Record<string, string> = {
      RUB: '₽',
      USD: '$',
      EUR: '€',
    };
    return symbols[currency] || currency;
  };

  // Get currency from first snapshot
  const currency = chartData[0]?.currency || 'USD';
  const currencySymbol = getCurrencySymbol(currency);

  // Custom Y-axis tick formatter with "rub" suffix
  const formatYAxis = (value: number) => {
    return `${value.toLocaleString()} rub`;
  };

  // Custom tooltip formatter
  interface ChartDataPoint {
    date: string;
    fullDate: string;
    value: number;
    currency: string;
  }

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartDataPoint;
      return (
        <div className="bg-white border border-gray-300 rounded p-2 shadow-lg">
          <p className="text-sm font-medium">
            {data.fullDate}: {data.value.toLocaleString()} {getCurrencySymbol(data.currency)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-sm p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Portfolio Value Over Time</h3>
      <p className="text-sm text-gray-600 mb-2">Last 30 days</p>

      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              style={{ fontSize: '12px' }}
              angle={-45}
              textAnchor="end"
              height={40}
            />
            <YAxis
              width={60}
              tickFormatter={formatYAxis}
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              name="Portfolio Value"
              stroke="#3b82f6"
              strokeWidth={1}
              dot={{ r: 3, fill: '#3b82f6' }}
              activeDot={{ r: 5, fill: '#1e40af' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HistoryChart;

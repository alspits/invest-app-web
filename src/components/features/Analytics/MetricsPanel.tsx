import React from 'react';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { useAnalyticsStore } from '@/stores/analytics';
import type { PortfolioMetrics } from '../../../lib/analytics';

interface MetricCardProps {
  label: string;
  value: string;
  unit?: string;
  color: string;
  infoText?: string;
  icon?: React.ReactNode;
  isNegative?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  color,
  infoText,
  icon,
  isNegative,
}) => {
  const colorClasses: Record<string, string> = {
    green: 'text-green-600',
    red: 'text-red-600',
    blue: 'text-blue-600',
    orange: 'text-orange-600',
    purple: 'text-purple-600',
  };

  const textColorClass = colorClasses[color] || 'text-gray-900';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm md:text-base font-bold text-gray-700 dark:text-gray-300">{label}</h3>
        {icon && <span className={textColorClass}>{icon}</span>}
      </div>

      <div className="flex items-baseline gap-1 mb-1">
        <span className={`text-2xl md:text-3xl font-bold ${textColorClass}`}>
          {value}
        </span>
        {unit && (
          <span className={`text-lg md:text-xl font-semibold ${textColorClass}`}>
            {unit}
          </span>
        )}
      </div>

      {infoText && (
        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-2">{infoText}</p>
      )}
    </div>
  );
};

const MetricsPanel: React.FC = () => {
  const { metrics, loading, error } = useAnalyticsStore();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-600 text-white rounded-lg p-4 shadow-md">
        <p className="font-semibold">Error loading metrics</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const roi = metrics.roi;
  const isRoiNegative = roi < 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* ROI Card */}
      <MetricCard
        label="ROI"
        value={roi.toFixed(2)}
        unit="%"
        color={isRoiNegative ? 'red' : 'green'}
        icon={
          isRoiNegative ? (
            <TrendingDown className="w-5 h-5 md:w-6 md:h-6" />
          ) : (
            <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />
          )
        }
        isNegative={isRoiNegative}
      />

      {/* Sharpe Ratio Card */}
      <MetricCard
        label="Sharpe Ratio"
        value={metrics.sharpeRatio.toFixed(2)}
        color="blue"
        infoText="Risk-adjusted return"
      />

      {/* Volatility Card */}
      <MetricCard
        label="Volatility"
        value={metrics.volatility.toFixed(2)}
        unit="%"
        color="orange"
        infoText="Annualized"
      />

      {/* Diversification Card */}
      <MetricCard
        label="Diversification"
        value={(metrics.diversificationScore * 100).toFixed(1)}
        unit="%"
        color="purple"
        infoText="Portfolio concentration"
      />
    </div>
  );
};

export default MetricsPanel;

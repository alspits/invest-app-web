'use client';

import { MarketIndex } from '@/lib/market-api';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface IndexCardProps {
  index: MarketIndex;
}

export function IndexCard({ index }: IndexCardProps) {
  const {
    name,
    ticker,
    currentValue,
    changePercent,
    changeAbsolute,
    dayHigh,
    dayLow,
  } = index;

  const isPositive = changePercent > 0;
  const isNeutral = changePercent === 0;

  const colorClass = isPositive
    ? 'text-green-600'
    : isNeutral
    ? 'text-gray-600'
    : 'text-red-600';

  const bgColorClass = isPositive
    ? 'bg-green-50'
    : isNeutral
    ? 'bg-gray-50'
    : 'bg-red-50';

  const TrendIcon = isPositive ? TrendingUp : isNeutral ? Minus : TrendingDown;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">{name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{ticker}</p>
        </div>
        <div className={`p-1.5 rounded-full ${bgColorClass}`}>
          <TrendIcon className={`w-4 h-4 ${colorClass}`} />
        </div>
      </div>

      {/* Current Value */}
      <div className="mb-2">
        <p className="text-2xl font-bold text-gray-900">
          {currentValue.toLocaleString('ru-RU', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      </div>

      {/* Change */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-sm font-medium ${colorClass}`}>
          {isPositive ? '+' : ''}
          {changeAbsolute.toFixed(2)}
        </span>
        <span className={`text-sm font-medium ${colorClass}`}>
          ({isPositive ? '+' : ''}
          {changePercent.toFixed(2)}%)
        </span>
      </div>

      {/* Day Range */}
      {(dayHigh !== undefined && dayLow !== undefined) && (
        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Диапазон дня:</span>
            <span className="font-medium text-gray-700">
              {dayLow.toFixed(2)} - {dayHigh.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

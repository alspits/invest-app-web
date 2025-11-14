'use client';

import { usePortfolioStore } from '@/stores/portfolioStore';
import { moneyValueToNumber, quotationToNumber } from '@/lib/tinkoff-api';

function PositionSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="flex-1 space-y-3">
          <div className="h-5 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
        <div className="text-right space-y-3">
          <div className="h-6 bg-gray-200 rounded w-24 ml-auto"></div>
          <div className="h-4 bg-gray-200 rounded w-16 ml-auto"></div>
        </div>
      </div>
    </div>
  );
}

export function PositionList() {
  const { portfolio, isLoadingPortfolio } = usePortfolioStore();

  // Show skeleton loaders while loading
  if (isLoadingPortfolio) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Позиции</h2>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <PositionSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!portfolio || !portfolio.positions || portfolio.positions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Позиции</h2>
        <div className="text-center py-12">
          <div className="text-gray-400 mb-2">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <p className="text-gray-600">Позиций пока нет</p>
          <p className="text-sm text-gray-500 mt-1">
            Начните инвестировать, чтобы увидеть свои позиции здесь
          </p>
        </div>
      </div>
    );
  }

  // Map instrument types to Russian names
  const getInstrumentTypeName = (type: string): string => {
    const typeMap: Record<string, string> = {
      'share': 'Акция',
      'bond': 'Облигация',
      'etf': 'ETF',
      'currency': 'Валюта',
      'future': 'Фьючерс',
    };
    return typeMap[type.toLowerCase()] || type;
  };

  // Format currency
  const formatCurrency = (value: number, currency: string = 'RUB'): string => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Format number
  const formatNumber = (value: number, decimals: number = 2): string => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Позиции ({portfolio.positions.length})
      </h2>

      <div className="space-y-4">
        {portfolio.positions.map((position, index) => {
          // Debug: Log position data to console
          console.log('Position data:', {
            figi: position.figi,
            ticker: position.ticker,
            name: position.name,
            instrumentType: position.instrumentType,
          });

          const quantity = quotationToNumber(position.quantity);
          const currentPrice = moneyValueToNumber(position.currentPrice);
          const averagePrice = moneyValueToNumber(position.averagePositionPrice);
          const currentValue = currentPrice * quantity;
          const yieldValue = quotationToNumber(position.expectedYield);
          const yieldPercent = averagePrice > 0 ? (yieldValue / (averagePrice * quantity)) * 100 : 0;

          return (
            <div
              key={`${position.figi}-${index}`}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                {/* Left side: Ticker and Type */}
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {position.name || position.ticker || position.figi}
                    </h3>
                    {position.ticker && (
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                        {position.ticker}
                      </span>
                    )}
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                      {getInstrumentTypeName(position.instrumentType)}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <p>
                      Количество: <span className="font-medium text-gray-900">{formatNumber(quantity, 0)} шт.</span>
                    </p>
                    <p>
                      Средняя цена: <span className="font-medium text-gray-900">{formatCurrency(averagePrice, position.averagePositionPrice.currency)}</span>
                    </p>
                    <p>
                      Текущая цена: <span className="font-medium text-gray-900">{formatCurrency(currentPrice, position.currentPrice.currency)}</span>
                    </p>
                  </div>
                </div>

                {/* Right side: Value and Yield */}
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(currentValue, position.currentPrice.currency)}
                  </p>
                  <div className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    yieldValue >= 0
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    <span>
                      {yieldValue >= 0 ? '+' : ''}{formatCurrency(yieldValue, position.currentPrice.currency)}
                    </span>
                    <span className="ml-2">
                      ({yieldValue >= 0 ? '+' : ''}{formatNumber(yieldPercent, 2)}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress bar showing gain/loss */}
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      yieldValue >= 0 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{
                      width: `${Math.min(Math.abs(yieldPercent), 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

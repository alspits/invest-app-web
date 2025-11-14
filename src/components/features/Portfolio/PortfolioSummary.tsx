'use client';

import { usePortfolioStore } from '@/stores/portfolioStore';
import { moneyValueToNumber, quotationToNumber } from '@/lib/tinkoff-api';

export function PortfolioSummary() {
  const { portfolio, isLoadingPortfolio } = usePortfolioStore();

  if (isLoadingPortfolio) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return null;
  }

  // Calculate total portfolio value
  const totalShares = moneyValueToNumber(portfolio.totalAmountShares);
  const totalBonds = moneyValueToNumber(portfolio.totalAmountBonds);
  const totalEtf = moneyValueToNumber(portfolio.totalAmountEtf);
  const totalCurrencies = moneyValueToNumber(portfolio.totalAmountCurrencies);
  const totalFutures = moneyValueToNumber(portfolio.totalAmountFutures);

  const totalValue = totalShares + totalBonds + totalEtf + totalCurrencies + totalFutures;
  const expectedYield = quotationToNumber(portfolio.expectedYield);
  const expectedYieldPercent = totalValue > 0 ? (expectedYield / totalValue) * 100 : 0;

  // Calculate allocation percentages
  const allocations = [
    { name: 'Акции', value: totalShares, color: 'bg-blue-500' },
    { name: 'Облигации', value: totalBonds, color: 'bg-green-500' },
    { name: 'ETF', value: totalEtf, color: 'bg-purple-500' },
    { name: 'Валюта', value: totalCurrencies, color: 'bg-yellow-500' },
    { name: 'Фьючерсы', value: totalFutures, color: 'bg-red-500' },
  ].filter((a) => a.value > 0);

  // Format currency
  const formatCurrency = (value: number, currency: string = 'RUB'): string => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Format percentage
  const formatPercent = (value: number): string => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 100);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Сводка портфеля</h2>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Value */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
          <p className="text-sm text-blue-600 font-medium mb-1">Общая стоимость</p>
          <p className="text-3xl font-bold text-blue-900">
            {formatCurrency(totalValue, portfolio.totalAmountShares.currency)}
          </p>
        </div>

        {/* Expected Yield */}
        <div className={`rounded-lg p-4 ${expectedYield >= 0 ? 'bg-gradient-to-br from-green-50 to-green-100' : 'bg-gradient-to-br from-red-50 to-red-100'}`}>
          <p className={`text-sm font-medium mb-1 ${expectedYield >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            Ожидаемая доходность
          </p>
          <p className={`text-3xl font-bold ${expectedYield >= 0 ? 'text-green-900' : 'text-red-900'}`}>
            {formatCurrency(expectedYield, portfolio.totalAmountShares.currency)}
          </p>
        </div>

        {/* Yield Percentage */}
        <div className={`rounded-lg p-4 ${expectedYieldPercent >= 0 ? 'bg-gradient-to-br from-green-50 to-green-100' : 'bg-gradient-to-br from-red-50 to-red-100'}`}>
          <p className={`text-sm font-medium mb-1 ${expectedYieldPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            Доходность %
          </p>
          <p className={`text-3xl font-bold ${expectedYieldPercent >= 0 ? 'text-green-900' : 'text-red-900'}`}>
            {expectedYieldPercent >= 0 ? '+' : ''}{formatPercent(expectedYieldPercent)}
          </p>
        </div>
      </div>

      {/* Asset Allocation */}
      {allocations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Распределение активов</h3>
          <div className="space-y-3">
            {allocations.map((allocation) => {
              const percentage = (allocation.value / totalValue) * 100;
              return (
                <div key={allocation.name}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">{allocation.name}</span>
                    <span className="text-sm text-gray-600">
                      {formatCurrency(allocation.value, portfolio.totalAmountShares.currency)} ({formatPercent(percentage)})
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${allocation.color} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import { useMarketStore } from '@/stores/marketStore';
import { IndexCard } from './IndexCard';
import { RefreshCw, BarChart3 } from 'lucide-react';

export function MarketContext() {
  const {
    indices,
    isLoadingMarket,
    marketError,
    loadMarketIndices,
    isCacheValid,
  } = useMarketStore();

  // Load market indices on mount
  useEffect(() => {
    loadMarketIndices();
  }, [loadMarketIndices]);

  // Auto-refresh every 15 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isCacheValid()) {
        loadMarketIndices();
      }
    }, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(interval);
  }, [loadMarketIndices, isCacheValid]);

  // Handle manual refresh
  const handleRefresh = () => {
    loadMarketIndices(true); // Force refresh
  };

  // Loading state
  if (isLoadingMarket && indices.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
            <p className="text-sm text-gray-600">Загрузка рыночных индексов...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (marketError && indices.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold mb-2 text-sm">
            Ошибка загрузки индексов
          </h3>
          <p className="text-red-600 text-sm mb-3">{marketError}</p>
          <button
            onClick={handleRefresh}
            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Повторить попытку
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-bold text-gray-900">Рыночный контекст</h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Cache Status */}
          {isCacheValid() && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>Обновляется каждые 15 мин</span>
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isLoadingMarket}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
            title="Обновить индексы"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoadingMarket ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Indices Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {indices.map((index) => (
          <IndexCard key={index.ticker} index={index} />
        ))}
      </div>

      {/* Error Banner (if error but we have cached data) */}
      {marketError && indices.length > 0 && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            Не удалось обновить данные. Показаны кешированные данные.
          </p>
        </div>
      )}
    </div>
  );
}

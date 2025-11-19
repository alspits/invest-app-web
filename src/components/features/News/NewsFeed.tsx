'use client';

import { useEffect, useState } from 'react';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { useNewsStore } from '@/stores/newsStore';
import { NewsList } from './NewsList';
import { RefreshCw, Search } from 'lucide-react';

export function NewsFeed() {
  const { portfolio } = usePortfolioStore();
  const {
    news,
    isLoadingNews,
    newsError,
    loadNews,
    loadTickerNews,
    isCacheValid,
  } = useNewsStore();

  const [searchTicker, setSearchTicker] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);

  // Extract tickers from portfolio
  const portfolioTickers = portfolio?.positions
    .map((position) => position.ticker)
    .filter((ticker): ticker is string => !!ticker) || [];

  // Load news on mount or when portfolio changes
  useEffect(() => {
    if (portfolioTickers.length > 0 && !isSearchMode) {
      loadNews(portfolioTickers);
    }
  }, [portfolioTickers.join(','), isSearchMode]); // Dependency on ticker string to avoid infinite loops

  // Handle refresh
  const handleRefresh = () => {
    if (isSearchMode && searchTicker) {
      loadTickerNews(searchTicker);
    } else {
      loadNews(portfolioTickers, true); // Force refresh
    }
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTicker.trim()) {
      setIsSearchMode(true);
      loadTickerNews(searchTicker.trim());
    }
  };

  // Handle clear search
  const handleClearSearch = () => {
    setIsSearchMode(false);
    setSearchTicker('');
    if (portfolioTickers.length > 0) {
      loadNews(portfolioTickers);
    }
  };

  // Show message if no portfolio loaded
  if (!portfolio || portfolioTickers.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-yellow-800 font-semibold mb-2">
          Портфель не загружен
        </h3>
        <p className="text-yellow-700">
          Загрузите портфель, чтобы видеть новости по вашим активам
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Search and Refresh */}
      <div className="flex items-center gap-4">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTicker}
              onChange={(e) => setSearchTicker(e.target.value.toUpperCase())}
              placeholder="Поиск новостей по тикеру..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {isSearchMode && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Очистить
            </button>
          )}
          <button
            type="submit"
            disabled={!searchTicker.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Найти
          </button>
        </form>

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={isLoadingNews}
          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
          title="Обновить новости"
        >
          <RefreshCw
            className={`w-5 h-5 ${isLoadingNews ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      {/* Cache Status */}
      {!isSearchMode && isCacheValid() && (
        <div className="text-xs text-gray-500 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span>Новости актуальны (кеш обновляется каждый час)</span>
        </div>
      )}

      {/* Search Mode Indicator */}
      {isSearchMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            Показаны новости по тикеру: <strong>{searchTicker}</strong>
          </p>
        </div>
      )}

      {/* News List */}
      <NewsList
        news={news}
        isLoading={isLoadingNews}
        error={newsError}
        onRetry={handleRefresh}
      />
    </div>
  );
}

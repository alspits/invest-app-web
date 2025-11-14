'use client';

import { useEffect } from 'react';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { AccountSelector } from './AccountSelector';
import { PortfolioSummary } from './PortfolioSummary';
import { PositionList } from './PositionList';

export function Portfolio() {
  const {
    accounts,
    selectedAccountId,
    isLoadingAccounts,
    accountsError,
    portfolio,
    isLoadingPortfolio,
    portfolioError,
    loadAccounts,
  } = usePortfolioStore();

  // Load accounts on mount
  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Show loading state for initial accounts fetch
  if (isLoadingAccounts && accounts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Загрузка счетов...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error if accounts failed to load
  if (accountsError) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-red-800 font-semibold mb-2">
              Ошибка загрузки счетов
            </h3>
            <p className="text-red-600">{accountsError}</p>
            <button
              onClick={() => loadAccounts()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Повторить попытку
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show message if no accounts found
  if (accounts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-yellow-800 font-semibold mb-2">
              Счета не найдены
            </h3>
            <p className="text-yellow-700">
              У вас пока нет активных брокерских счетов в Tinkoff Investments.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Инвестиционный портфель
            </h1>
            <p className="text-gray-600 mt-1">
              Управляйте своими инвестициями Tinkoff
            </p>
          </div>
          <AccountSelector />
        </div>

        {/* Portfolio Summary */}
        <PortfolioSummary />

        {/* Error Message */}
        {portfolioError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{portfolioError}</p>
          </div>
        )}

        {/* Position List */}
        <PositionList />
      </div>
    </div>
  );
}

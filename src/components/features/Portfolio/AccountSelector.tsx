'use client';

import { usePortfolioStore } from '@/stores/portfolioStore';

export function AccountSelector() {
  const { accounts, selectedAccountId, switchAccount } = usePortfolioStore();

  if (accounts.length === 0) {
    return null;
  }

  // Map account type to Russian names
  const getAccountTypeName = (type: string): string => {
    const typeMap: Record<string, string> = {
      'ACCOUNT_TYPE_TINKOFF': 'Брокерский счёт',
      'ACCOUNT_TYPE_TINKOFF_IIS': 'ИИС',
      'ACCOUNT_TYPE_INVEST_BOX': 'Инвесткопилка',
    };
    return typeMap[type] || type;
  };

  // Map account status to Russian names
  const getAccountStatusBadge = (status: string): string => {
    const statusMap: Record<string, string> = {
      'ACCOUNT_STATUS_OPEN': 'Активен',
      'ACCOUNT_STATUS_CLOSED': 'Закрыт',
    };
    return statusMap[status] || status;
  };

  return (
    <div className="relative">
      <label htmlFor="account-select" className="block text-sm font-medium text-gray-700 mb-1">
        Выберите счёт
      </label>
      <select
        id="account-select"
        value={selectedAccountId || ''}
        onChange={(e) => switchAccount(e.target.value)}
        className="block w-full px-4 py-2 pr-8 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
      >
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name} ({getAccountTypeName(account.type)}) - {getAccountStatusBadge(account.status)}
          </option>
        ))}
      </select>
    </div>
  );
}

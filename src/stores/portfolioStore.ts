import { create } from 'zustand';
import { Account, PortfolioResponse } from '@/lib/tinkoff-api';

interface PortfolioState {
  // Accounts state
  accounts: Account[];
  selectedAccountId: string | null;
  isLoadingAccounts: boolean;
  accountsError: string | null;

  // Portfolio state
  portfolio: PortfolioResponse | null;
  isLoadingPortfolio: boolean;
  portfolioError: string | null;

  // Actions
  setAccounts: (accounts: Account[]) => void;
  setSelectedAccountId: (accountId: string | null) => void;
  setIsLoadingAccounts: (isLoading: boolean) => void;
  setAccountsError: (error: string | null) => void;

  setPortfolio: (portfolio: PortfolioResponse | null) => void;
  setIsLoadingPortfolio: (isLoading: boolean) => void;
  setPortfolioError: (error: string | null) => void;

  loadAccounts: () => Promise<void>;
  switchAccount: (accountId: string) => void;
  loadPortfolio: (accountId: string) => Promise<void>;
  reset: () => void;
}

const initialState = {
  accounts: [],
  selectedAccountId: null,
  isLoadingAccounts: false,
  accountsError: null,

  portfolio: null,
  isLoadingPortfolio: false,
  portfolioError: null,
};

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  ...initialState,

  // Setters
  setAccounts: (accounts) => set({ accounts }),
  setSelectedAccountId: (accountId) => set({ selectedAccountId: accountId }),
  setIsLoadingAccounts: (isLoading) => set({ isLoadingAccounts: isLoading }),
  setAccountsError: (error) => set({ accountsError: error }),

  setPortfolio: (portfolio) => set({ portfolio }),
  setIsLoadingPortfolio: (isLoading) => set({ isLoadingPortfolio: isLoading }),
  setPortfolioError: (error) => set({ portfolioError: error }),

  // Load accounts from API
  loadAccounts: async () => {
    set({ isLoadingAccounts: true, accountsError: null });

    try {
      // Check if in development mode without API token
      const isDev = process.env.NODE_ENV === 'development';
      const hasToken = !!process.env.NEXT_PUBLIC_TINKOFF_API_TOKEN || !!process.env.TINKOFF_API_TOKEN;

      // Use mock data in development without API token
      if (isDev && !hasToken) {
        console.log('🔧 Development mode: Using mock accounts data');

        const mockAccounts: Account[] = [
          {
            id: 'mock-account-1',
            type: 'ACCOUNT_TYPE_TINKOFF',
            name: 'Брокерский счёт',
            status: 'ACCOUNT_STATUS_OPEN',
            openedDate: '2023-01-15T00:00:00Z',
            accessLevel: 'ACCOUNT_ACCESS_LEVEL_FULL_ACCESS',
          },
          {
            id: 'mock-account-2',
            type: 'ACCOUNT_TYPE_TINKOFF_IIS',
            name: 'ИИС',
            status: 'ACCOUNT_STATUS_OPEN',
            openedDate: '2023-03-20T00:00:00Z',
            accessLevel: 'ACCOUNT_ACCESS_LEVEL_FULL_ACCESS',
          },
        ];

        set({
          accounts: mockAccounts,
          isLoadingAccounts: false,
          accountsError: null,
        });

        // Auto-select first account if none selected
        if (!get().selectedAccountId) {
          get().switchAccount(mockAccounts[0].id);
        }

        return;
      }

      // Production logic: Fetch from API
      const response = await fetch('/api/tinkoff/accounts');

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch accounts');
      }

      const data = await response.json();
      const accounts = data.accounts || [];

      set({
        accounts,
        isLoadingAccounts: false,
        accountsError: null,
      });

      // Auto-select first account if none selected
      if (accounts.length > 0 && !get().selectedAccountId) {
        get().switchAccount(accounts[0].id);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
      set({
        isLoadingAccounts: false,
        accountsError: (error as Error).message,
        accounts: [],
      });
    }
  },

  // Switch to a different account
  switchAccount: (accountId) => {
    set({ selectedAccountId: accountId });
    // Automatically load portfolio for the new account
    get().loadPortfolio(accountId);
  },

  // Load portfolio for specific account
  loadPortfolio: async (accountId) => {
    set({ isLoadingPortfolio: true, portfolioError: null });

    try {
      // Check if in development mode without API token
      const isDev = process.env.NODE_ENV === 'development';
      const hasToken = !!process.env.NEXT_PUBLIC_TINKOFF_API_TOKEN || !!process.env.TINKOFF_API_TOKEN;

      // Use mock data in development without API token
      if (isDev && !hasToken) {
        console.log('🔧 Development mode: Using mock portfolio data for account', accountId);

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        const mockPortfolio: PortfolioResponse = {
          totalAmountShares: { currency: 'rub', units: '150000', nano: 0 },
          totalAmountBonds: { currency: 'rub', units: '50000', nano: 0 },
          totalAmountEtf: { currency: 'rub', units: '30000', nano: 0 },
          totalAmountCurrencies: { currency: 'rub', units: '10000', nano: 0 },
          totalAmountFutures: { currency: 'rub', units: '0', nano: 0 },
          expectedYield: { units: '12000', nano: 500000000 }, // 12000.5
          positions: [
            {
              figi: 'BBG004730N88',
              instrumentType: 'share',
              quantity: { units: '10', nano: 0 },
              averagePositionPrice: { currency: 'rub', units: '2500', nano: 0 },
              expectedYield: { units: '500', nano: 0 },
              currentPrice: { currency: 'rub', units: '2550', nano: 0 },
              ticker: 'SBER',
              name: 'Сбербанк',
            },
            {
              figi: 'BBG004731032',
              instrumentType: 'share',
              quantity: { units: '5', nano: 0 },
              averagePositionPrice: { currency: 'rub', units: '12000', nano: 0 },
              expectedYield: { units: '1000', nano: 0 },
              currentPrice: { currency: 'rub', units: '12200', nano: 0 },
              ticker: 'GAZP',
              name: 'Газпром',
            },
            {
              figi: 'BBG000BPH459',
              instrumentType: 'etf',
              quantity: { units: '20', nano: 0 },
              averagePositionPrice: { currency: 'rub', units: '1500', nano: 0 },
              expectedYield: { units: '600', nano: 0 },
              currentPrice: { currency: 'rub', units: '1530', nano: 0 },
              ticker: 'TMOS',
              name: 'Тинькофф iMOEX',
            },
          ],
        };

        set({
          portfolio: mockPortfolio,
          isLoadingPortfolio: false,
          portfolioError: null,
        });

        return;
      }

      // Production logic: Fetch from API
      const response = await fetch(`/api/tinkoff/portfolio?accountId=${accountId}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch portfolio');
      }

      const portfolio = await response.json();

      set({
        portfolio,
        isLoadingPortfolio: false,
        portfolioError: null,
      });
    } catch (error) {
      console.error('Error loading portfolio:', error);
      set({
        isLoadingPortfolio: false,
        portfolioError: (error as Error).message,
        portfolio: null,
      });
    }
  },

  // Reset store to initial state
  reset: () => set(initialState),
}));

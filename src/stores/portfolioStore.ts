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

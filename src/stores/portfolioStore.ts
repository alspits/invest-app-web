import { create } from 'zustand';
import { Account, PortfolioResponse } from '@/lib/tinkoff-api';
import { MOCK_ACCOUNT_PREFIX } from '@/lib/constants';

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
      const isDev = process.env.NODE_ENV === 'development';

      // Always try to fetch from API first (server will handle token check)
      if (isDev) console.log('🔵 Fetching accounts from API...');

      const response = await fetch('/api/tinkoff/accounts');

      if (!response.ok) {
        const errorData = await response.json();
        if (isDev) {
          console.error('❌ Failed to fetch accounts:', {
            status: response.status,
            error: errorData.error,
          });
        }
        throw new Error(errorData.error || 'Failed to fetch accounts');
      }

      const data = await response.json();
      const accounts = data.accounts || [];

      if (isDev) {
        console.log('✅ Accounts received:', { count: accounts.length });
      }

      // TODO: Remove client-side filtering once API excludes mocks
      // Filter out mock accounts (only keep real ones)
      const realAccounts = accounts.filter(
        (acc: Account) => !acc.id.startsWith(MOCK_ACCOUNT_PREFIX)
      );

      if (isDev) {
        console.log('✅ Real accounts (after filtering):', {
          count: realAccounts.length,
        });
      }

      set({
        accounts: realAccounts,
        isLoadingAccounts: false,
        accountsError: null,
      });

      // Auto-select first account if none selected OR if selected account was filtered out
      const currentSelectedId = get().selectedAccountId;
      const selectedAccountExists = realAccounts.some((a) => a.id === currentSelectedId);

      if (realAccounts.length > 0 && (!currentSelectedId || !selectedAccountExists)) {
        if (isDev) console.log('🔄 Auto-selecting first account:', realAccounts[0].id);
        get().switchAccount(realAccounts[0].id);
      }
    } catch (error) {
      const isDev = process.env.NODE_ENV === 'development';
      if (isDev) console.error('❌ Error loading accounts:', error);

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
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) console.log('📂 Loading portfolio for account:', accountId);
    set({ isLoadingPortfolio: true, portfolioError: null });

    try {
      // Always fetch from API (server will handle token check)
      if (isDev) console.log('🔵 Fetching portfolio from API');

      const response = await fetch(`/api/tinkoff/portfolio?accountId=${accountId}`);

      if (!response.ok) {
        const errorData = await response.json();
        if (isDev) {
          console.error('❌ Failed to fetch portfolio:', {
            status: response.status,
            error: errorData.error,
          });
        }
        throw new Error(errorData.error || 'Failed to fetch portfolio');
      }

      const portfolio = await response.json();
      if (isDev) {
        console.log('✅ Portfolio loaded:', {
          positionsCount: portfolio.positions?.length || 0,
        });
      }

      set({
        portfolio,
        isLoadingPortfolio: false,
        portfolioError: null,
      });
    } catch (error) {
      const isDev = process.env.NODE_ENV === 'development';
      if (isDev) console.error('❌ Error loading portfolio:', error);

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

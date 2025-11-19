import { create } from 'zustand';
import { MarketIndex, MarketContextData } from '@/lib/market-api';

interface MarketState {
  // Market data state
  indices: MarketIndex[];
  isLoadingMarket: boolean;
  marketError: string | null;
  lastFetchTime: number | null;

  // Cache TTL in milliseconds (15 minutes)
  cacheTTL: number;

  // Actions
  setIndices: (indices: MarketIndex[]) => void;
  setIsLoadingMarket: (isLoading: boolean) => void;
  setMarketError: (error: string | null) => void;
  setLastFetchTime: (time: number) => void;

  loadMarketIndices: (forceRefresh?: boolean) => Promise<void>;
  isCacheValid: () => boolean;
  reset: () => void;
}

const FIFTEEN_MINUTES = 15 * 60 * 1000; // 15 minutes in milliseconds

const initialState = {
  indices: [],
  isLoadingMarket: false,
  marketError: null,
  lastFetchTime: null,
  cacheTTL: FIFTEEN_MINUTES,
};

export const useMarketStore = create<MarketState>((set, get) => ({
  ...initialState,

  // Setters
  setIndices: (indices) => set({ indices }),
  setIsLoadingMarket: (isLoading) => set({ isLoadingMarket: isLoading }),
  setMarketError: (error) => set({ marketError: error }),
  setLastFetchTime: (time) => set({ lastFetchTime: time }),

  // Check if cache is still valid (within 15 minutes)
  isCacheValid: () => {
    const { lastFetchTime, cacheTTL } = get();
    if (!lastFetchTime) return false;

    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTime;
    return timeSinceLastFetch < cacheTTL;
  },

  // Load market indices
  loadMarketIndices: async (forceRefresh = false) => {
    // Check cache validity
    if (!forceRefresh && get().isCacheValid() && get().indices.length > 0) {
      console.log('ℹ️ Using cached market indices (cache still valid)');
      return;
    }

    set({ isLoadingMarket: true, marketError: null });

    try {
      const response = await fetch('/api/market');

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch market indices');
      }

      const data: MarketContextData = await response.json();
      const indices = data.indices || [];

      set({
        indices,
        isLoadingMarket: false,
        marketError: null,
        lastFetchTime: Date.now(),
      });

      console.log(`✅ Loaded ${indices.length} market indices`);
    } catch (error) {
      console.error('Error loading market indices:', error);
      set({
        isLoadingMarket: false,
        marketError: (error as Error).message,
        indices: [],
      });
    }
  },

  // Reset store to initial state
  reset: () => set(initialState),
}));

import { create } from 'zustand';
import { NewsItem } from '@/lib/news-api';

interface NewsState {
  // News state
  news: NewsItem[];
  isLoadingNews: boolean;
  newsError: string | null;
  lastFetchTime: number | null;

  // Cache TTL in milliseconds (1 hour)
  cacheTTL: number;

  // Actions
  setNews: (news: NewsItem[]) => void;
  setIsLoadingNews: (isLoading: boolean) => void;
  setNewsError: (error: string | null) => void;
  setLastFetchTime: (time: number) => void;

  loadNews: (tickers: string[], forceRefresh?: boolean) => Promise<void>;
  loadTickerNews: (ticker: string) => Promise<void>;
  isCacheValid: () => boolean;
  reset: () => void;
}

const ONE_HOUR = 60 * 60 * 1000; // 1 hour in milliseconds

const initialState = {
  news: [],
  isLoadingNews: false,
  newsError: null,
  lastFetchTime: null,
  cacheTTL: ONE_HOUR,
};

export const useNewsStore = create<NewsState>((set, get) => ({
  ...initialState,

  // Setters
  setNews: (news) => set({ news }),
  setIsLoadingNews: (isLoading) => set({ isLoadingNews: isLoading }),
  setNewsError: (error) => set({ newsError: error }),
  setLastFetchTime: (time) => set({ lastFetchTime: time }),

  // Check if cache is still valid (within 1 hour)
  isCacheValid: () => {
    const { lastFetchTime, cacheTTL } = get();
    if (!lastFetchTime) return false;

    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTime;
    return timeSinceLastFetch < cacheTTL;
  },

  // Load news filtered by portfolio tickers
  loadNews: async (tickers: string[], forceRefresh = false) => {
    // Check cache validity
    if (!forceRefresh && get().isCacheValid() && get().news.length > 0) {
      console.log('ℹ️ Using cached news (cache still valid)');
      return;
    }

    set({ isLoadingNews: true, newsError: null });

    try {
      const tickersParam = tickers.join(',');
      const response = await fetch(
        `/api/news?tickers=${encodeURIComponent(tickersParam)}&pageSize=50`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch news');
      }

      const data = await response.json();
      const news = data.news || [];

      set({
        news,
        isLoadingNews: false,
        newsError: null,
        lastFetchTime: Date.now(),
      });

      console.log(`✅ Loaded ${news.length} news articles`);
    } catch (error) {
      console.error('Error loading news:', error);
      set({
        isLoadingNews: false,
        newsError: (error as Error).message,
        news: [],
      });
    }
  },

  // Load news for specific ticker
  loadTickerNews: async (ticker: string) => {
    set({ isLoadingNews: true, newsError: null });

    try {
      const response = await fetch(
        `/api/news?ticker=${encodeURIComponent(ticker)}&pageSize=20`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch ticker news');
      }

      const data = await response.json();
      const news = data.news || [];

      set({
        news,
        isLoadingNews: false,
        newsError: null,
        lastFetchTime: Date.now(),
      });

      console.log(`✅ Loaded ${news.length} news articles for ${ticker}`);
    } catch (error) {
      console.error('Error loading ticker news:', error);
      set({
        isLoadingNews: false,
        newsError: (error as Error).message,
        news: [],
      });
    }
  },

  // Reset store to initial state
  reset: () => set(initialState),
}));

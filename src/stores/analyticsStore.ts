import { create } from 'zustand';
import {
  PortfolioSnapshot,
  PortfolioMetrics,
  calculateMetrics,
} from '@/lib/analytics';

interface AnalyticsState {
  // State
  snapshots: PortfolioSnapshot[];
  metrics: PortfolioMetrics | null;
  selectedDays: 30 | 90 | 180 | 365 | 'all';
  loading: boolean;
  error: string | null;

  // Actions
  loadHistory: (accountId: string, days?: number) => Promise<void>;
  setSelectedDays: (days: 30 | 90 | 180 | 365 | 'all') => void;
  recalculateMetrics: () => void;
  clearHistory: () => void;
}

const initialState = {
  snapshots: [],
  metrics: null,
  selectedDays: 30 as const,
  loading: false,
  error: null,
};

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  ...initialState,

  // Load portfolio history from API
  loadHistory: async (accountId: string, days?: number) => {
    set({ loading: true, error: null });

    try {
      const daysParam = days ?? get().selectedDays;
      const daysValue = daysParam === 'all' ? 'all' : daysParam.toString();

      const response = await fetch(
        `/api/tinkoff/portfolio-history?accountId=${accountId}&days=${daysValue}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch portfolio history');
      }

      const data = await response.json();

      // Parse dates correctly - convert timestamp strings to Date objects
      const snapshots: PortfolioSnapshot[] = (data.snapshots || []).map(
        (snapshot: any) => ({
          ...snapshot,
          timestamp: new Date(snapshot.timestamp),
        })
      );

      set({
        snapshots,
        loading: false,
        error: null,
      });

      // Recalculate metrics with the new snapshots
      get().recalculateMetrics();
    } catch (error) {
      console.error('Error loading portfolio history:', error);
      set({
        loading: false,
        error: (error as Error).message || 'Failed to load portfolio history',
        snapshots: [],
        metrics: null,
      });
    }
  },

  // Update selected time period
  setSelectedDays: (days: 30 | 90 | 180 | 365 | 'all') => {
    set({ selectedDays: days });
  },

  // Recalculate metrics based on current snapshots
  recalculateMetrics: () => {
    const { snapshots } = get();

    // Handle empty snapshots
    if (!snapshots || snapshots.length === 0) {
      set({ metrics: null });
      return;
    }

    // Get the last snapshot (current state)
    const currentSnapshot = snapshots[snapshots.length - 1];

    // Calculate comprehensive metrics
    const metrics = calculateMetrics(currentSnapshot, snapshots);

    set({ metrics });
  },

  // Clear all history and metrics
  clearHistory: () => {
    set({
      snapshots: [],
      metrics: null,
      error: null,
    });
  },
}));

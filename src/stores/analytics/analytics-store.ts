import { create } from 'zustand';
import { calculateMetrics } from '@/lib/analytics';
import type { AnalyticsState } from './types';
import { loadHistoryAction } from './history-loader';
import { loadFactorAnalysisAction } from './factor-loader';

/**
 * Initial state for analytics store
 */
const initialState = {
  snapshots: [],
  metrics: null,
  selectedDays: 30 as const,
  loading: false,
  error: null,
  factorAnalysis: null,
  factorLoading: false,
  factorError: null,
};

/**
 * Analytics store for portfolio history and factor analysis
 *
 * This store manages:
 * - Portfolio snapshots and historical data
 * - Calculated metrics (returns, volatility, etc.)
 * - Factor analysis (sector exposure, correlations)
 * - Loading states and error handling
 */
export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  ...initialState,

  // Load portfolio history from API with enhanced error handling
  loadHistory: async (accountId: string, days?: number) => {
    await loadHistoryAction(set, get, accountId, days);
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

  // Load factor analysis from API
  loadFactorAnalysis: async (accountId: string) => {
    await loadFactorAnalysisAction(set, get, accountId);
  },

  // Clear factor analysis
  clearFactorAnalysis: () => {
    set({
      factorAnalysis: null,
      factorError: null,
    });
  },
}));

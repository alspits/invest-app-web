import type { PortfolioSnapshot, PortfolioMetrics } from '@/lib/analytics';
import type { FactorAnalysis } from '@/types/analytics';

/**
 * Analytics store state interface
 */
export interface AnalyticsState {
  // State
  snapshots: PortfolioSnapshot[];
  metrics: PortfolioMetrics | null;
  selectedDays: 30 | 90 | 180 | 365 | 'all';
  loading: boolean;
  error: string | null;

  // Factor Analysis State
  factorAnalysis: FactorAnalysis | null;
  factorLoading: boolean;
  factorError: string | null;

  // Actions
  loadHistory: (accountId: string, days?: number) => Promise<void>;
  setSelectedDays: (days: 30 | 90 | 180 | 365 | 'all') => void;
  recalculateMetrics: () => void;
  clearHistory: () => void;

  // Factor Analysis Actions
  loadFactorAnalysis: (accountId: string) => Promise<void>;
  clearFactorAnalysis: () => void;
}

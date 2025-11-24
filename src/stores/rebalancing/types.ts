/**
 * Rebalancing Store - Type Definitions
 */

import type {
  TargetAllocation,
  DeviationAnalysis,
  TradeOrder,
  CostBreakdown,
  TaxEstimate,
  RebalancingStrategy,
  RebalancingPlan,
} from '@/lib/rebalancing';

export interface RebalancingState {
  // Target allocation
  targetAllocation: TargetAllocation | null;
  strategy: RebalancingStrategy;
  thresholdPercent: number; // For threshold-based strategy

  // Analysis results
  currentDeviations: DeviationAnalysis | null;
  proposedOrders: TradeOrder[];
  costEstimate: CostBreakdown | null;
  taxEstimate: TaxEstimate | null;

  // Current plan
  currentPlan: RebalancingPlan | null;

  // UI state
  isAnalyzing: boolean;
  error: string | null;
}

export interface RebalancingActions {
  // Target allocation
  setTargetAllocation: (allocation: TargetAllocation) => void;
  setStrategy: (strategy: RebalancingStrategy) => void;
  setThreshold: (percent: number) => void;
  loadPreset: (preset: 'conservative' | 'moderate' | 'aggressive') => void;

  // Analysis
  analyzeDeviations: () => Promise<void>;
  generateTrades: (maxCost?: number) => Promise<void>;
  estimateCosts: () => Promise<void>;
  estimateTaxes: () => Promise<void>;

  // Plan management
  createRebalancingPlan: () => void;
  acceptPlan: () => void;
  resetPlan: () => void;

  // Persistence
  saveToPersistence: () => void;
  loadFromPersistence: () => void;

  // Utilities
  reset: () => void;
}

export type RebalancingStore = RebalancingState & RebalancingActions;

/**
 * Rebalancing Store - Zustand Store
 * Manages portfolio rebalancing state and actions
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RebalancingStore } from './types';
import {
  PRESET_ALLOCATIONS,
  calculateDeviations,
  generateTradeOrders,
  estimateTransactionCosts,
  estimateTaxImpact,
  optimizeTradeSequence,
  RebalancingStrategy,
  type RebalancingPlan,
} from '@/lib/rebalancing';
import { usePortfolioStore } from '@/stores/portfolio';

const STORAGE_KEY = 'rebalancing-store';

export const useRebalancingStore = create<RebalancingStore>()(
  persist(
    (set, get) => ({
      // ========== Initial State ==========
      targetAllocation: null,
      strategy: RebalancingStrategy.STRATEGIC,
      thresholdPercent: 5,
      currentDeviations: null,
      proposedOrders: [],
      costEstimate: null,
      taxEstimate: null,
      currentPlan: null,
      isAnalyzing: false,
      error: null,

      // ========== Target Allocation ==========
      setTargetAllocation: (allocation) => {
        set({ targetAllocation: allocation, error: null });
        get().saveToPersistence();
      },

      setStrategy: (strategy) => {
        set({ strategy, error: null });
        get().saveToPersistence();
      },

      setThreshold: (percent) => {
        set({ thresholdPercent: percent, error: null });
        get().saveToPersistence();
      },

      loadPreset: (preset) => {
        const allocation = PRESET_ALLOCATIONS[preset];
        set({ targetAllocation: allocation, error: null });
        get().saveToPersistence();
      },

      // ========== Analysis ==========
      analyzeDeviations: async () => {
        set({ isAnalyzing: true, error: null });

        try {
          const { targetAllocation } = get();
          const portfolio = usePortfolioStore.getState().portfolio;

          if (!targetAllocation) {
            throw new Error('No target allocation set');
          }

          if (!portfolio) {
            throw new Error('No portfolio data available');
          }

          const deviations = calculateDeviations(portfolio, targetAllocation);

          set({
            currentDeviations: deviations,
            isAnalyzing: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Analysis failed',
            isAnalyzing: false,
          });
        }
      },

      generateTrades: async (maxCost) => {
        set({ isAnalyzing: true, error: null });

        try {
          const { targetAllocation, thresholdPercent, strategy } = get();
          const portfolio = usePortfolioStore.getState().portfolio;

          if (!targetAllocation || !portfolio) {
            throw new Error('Missing target allocation or portfolio data');
          }

          // Generate trade orders
          const orders = generateTradeOrders(portfolio, targetAllocation, {
            maxCost,
            minTradeSize: 1000,
          });

          // Optimize sequence
          const optimizedOrders = optimizeTradeSequence(orders);

          set({
            proposedOrders: optimizedOrders,
            isAnalyzing: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Trade generation failed',
            isAnalyzing: false,
          });
        }
      },

      estimateCosts: async () => {
        try {
          const { proposedOrders } = get();

          if (proposedOrders.length === 0) {
            throw new Error('No trade orders to estimate');
          }

          const costEstimate = estimateTransactionCosts(proposedOrders);

          set({ costEstimate });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Cost estimation failed',
          });
        }
      },

      estimateTaxes: async () => {
        try {
          const { proposedOrders } = get();
          const portfolio = usePortfolioStore.getState().portfolio;

          if (proposedOrders.length === 0 || !portfolio) {
            throw new Error('Missing trade orders or portfolio data');
          }

          const taxEstimate = estimateTaxImpact(proposedOrders, portfolio.positions);

          set({ taxEstimate });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Tax estimation failed',
          });
        }
      },

      // ========== Plan Management ==========
      createRebalancingPlan: () => {
        const {
          targetAllocation,
          currentDeviations,
          proposedOrders,
          costEstimate,
          taxEstimate,
        } = get();

        if (
          !targetAllocation ||
          !currentDeviations ||
          proposedOrders.length === 0 ||
          !costEstimate ||
          !taxEstimate
        ) {
          set({ error: 'Incomplete data for creating plan' });
          return;
        }

        const totalValue = proposedOrders.reduce(
          (sum, o) => sum + o.estimatedTotal,
          0
        );

        const plan: RebalancingPlan = {
          id: `plan_${Date.now()}`,
          createdAt: new Date(),
          targetAllocation,
          deviationAnalysis: currentDeviations,
          tradeOrders: proposedOrders,
          costEstimate,
          taxEstimate,
          summary: {
            totalTrades: proposedOrders.length,
            totalValue,
            netCost: costEstimate.totalCost + taxEstimate.estimatedTaxLiability,
            expectedTimeToComplete: '2-3 business days',
            warnings: generateWarnings(taxEstimate, costEstimate),
          },
          status: 'DRAFT',
        };

        set({ currentPlan: plan });
      },

      acceptPlan: () => {
        const { currentPlan } = get();
        if (currentPlan) {
          set({
            currentPlan: { ...currentPlan, status: 'APPROVED' },
          });
        }
      },

      resetPlan: () => {
        set({
          currentPlan: null,
          proposedOrders: [],
          costEstimate: null,
          taxEstimate: null,
          currentDeviations: null,
        });
      },

      // ========== Persistence ==========
      saveToPersistence: () => {
        // Handled by persist middleware
      },

      loadFromPersistence: () => {
        // Handled by persist middleware
      },

      reset: () => {
        set({
          targetAllocation: null,
          strategy: RebalancingStrategy.STRATEGIC,
          thresholdPercent: 5,
          currentDeviations: null,
          proposedOrders: [],
          costEstimate: null,
          taxEstimate: null,
          currentPlan: null,
          isAnalyzing: false,
          error: null,
        });
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        targetAllocation: state.targetAllocation,
        strategy: state.strategy,
        thresholdPercent: state.thresholdPercent,
      }),
    }
  )
);

// Helper function
function generateWarnings(
  taxEstimate: any,
  costEstimate: any
): string[] {
  const warnings: string[] = [];

  if (taxEstimate.estimatedTaxLiability > 10000) {
    warnings.push(
      `High tax liability: ${Math.round(taxEstimate.estimatedTaxLiability)} RUB`
    );
  }

  if (costEstimate.costAsPercent > 1) {
    warnings.push(
      `High transaction costs: ${costEstimate.costAsPercent.toFixed(2)}%`
    );
  }

  if (taxEstimate.taxLossHarvestingOpportunities.length > 0) {
    warnings.push(
      `Consider tax-loss harvesting: ${taxEstimate.taxLossHarvestingOpportunities.join(', ')}`
    );
  }

  return warnings;
}

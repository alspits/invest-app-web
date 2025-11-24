/**
 * Recommendations Store
 *
 * Manages diversification analysis, risk profiles, and ticker recommendations
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RecommendationsState } from './types';
import type { DiversificationAnalysis } from '@/lib/recommendations/types';
import { analyzeDiversification } from '@/lib/recommendations/diversification-service';
import { RiskProfile } from '@/lib/recommendations/risk-profiles';
import { calculatePortfolioVolatility, assessRiskAlignment, type PortfolioHolding } from '@/lib/recommendations/risk-analyzer';
import { suggestTickers } from '@/lib/recommendations/ticker-recommender';
import { useAnalyticsStore } from '@/stores/analytics';
import { usePortfolioStore } from '@/stores/portfolioStore';

export const useRecommendationsStore = create<RecommendationsState>()(
  persist(
    (set, get) => ({
      // State
      analysis: null,
      riskProfile: null,
      riskAssessment: null,
      tickerRecommendations: [],
      goalRecommendations: {},
      goalAnalyses: {},
      lastUpdated: null,
      isLoading: false,
      isLoadingTickers: false,
      isLoadingGoals: false,
      error: null,

      // Actions
      setAnalysis: (analysis: DiversificationAnalysis) => {
        set({ analysis, error: null });
      },

      dismissRecommendation: (sectorId: string) => {
        const currentAnalysis = get().analysis;
        if (!currentAnalysis) return;

        // Filter out dismissed sector
        const updatedOverloadedSectors = currentAnalysis.overloadedSectors.filter(
          (sector) => sector.sector !== sectorId
        );

        set({
          analysis: {
            ...currentAnalysis,
            overloadedSectors: updatedOverloadedSectors,
          },
        });
      },

      refresh: async () => {
        set({ isLoading: true, error: null });

        try {
          // Get enriched positions from analytics store
          const analyticsStore = useAnalyticsStore.getState();
          const factorAnalysis = analyticsStore.factorAnalysis;

          if (!factorAnalysis) {
            throw new Error('No factor analysis data available');
          }

          // Get enriched positions (we need to fetch them from portfolio)
          // For now, we'll use sector exposure data as a workaround
          const { sectorExposure } = factorAnalysis;

          // Convert sector exposure to enriched positions format
          const positions = sectorExposure.map((exposure, index) => ({
            figi: `FIGI${index}`,
            ticker: `${exposure.sector.toUpperCase()}${index}`,
            name: exposure.sector,
            value: exposure.value,
            weight: exposure.weight / 100, // Convert to 0-1
            quantity: 1,
            currentPrice: exposure.value,
            sector: exposure.sector,
            marketCap: 'large' as const,
            geography: 'russia' as const,
            currency: 'RUB' as const,
            instrumentType: 'stock', // Required field
          }));

          // Analyze diversification
          const analysis = analyzeDiversification(positions);

          set({ analysis, isLoading: false });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to refresh recommendations';
          set({ error: errorMessage, isLoading: false });
        }
      },

      // Risk Profile Actions
      setRiskProfile: (profile: RiskProfile) => {
        set({ riskProfile: profile });

        // Auto-update risk assessment when profile changes
        const portfolioStore = usePortfolioStore.getState();
        const portfolio = portfolioStore.portfolio;

        if (portfolio) {
          const holdings: PortfolioHolding[] = portfolio.positions.map((pos: any) => ({
            ticker: pos.ticker || pos.figi,
            currentPrice: pos.currentPrice?.value || 0,
            quantity: pos.quantity?.value || 0,
            totalValue: (pos.currentPrice?.value || 0) * (pos.quantity?.value || 0),
            priceHistory: undefined, // Would need historical data
          }));

          const volatility = calculatePortfolioVolatility(holdings);
          const assessment = assessRiskAlignment(profile, volatility);

          set({ riskAssessment: assessment });
        }

        // Trigger ticker recommendations update
        get().fetchTickerRecommendations();
      },

      updateRiskAssessment: (assessment) => {
        set({ riskAssessment: assessment });
      },

      // Ticker Recommendations Actions
      fetchTickerRecommendations: async () => {
        const { riskProfile } = get();
        if (!riskProfile) return;

        set({ isLoadingTickers: true, error: null });

        try {
          const portfolioStore = usePortfolioStore.getState();
          const portfolio = portfolioStore.portfolio;

          if (!portfolio) {
            throw new Error('No portfolio data available');
          }

          // Convert portfolio positions to holdings format
          const holdings: PortfolioHolding[] = portfolio.positions.map((pos: any) => ({
            ticker: pos.ticker || pos.figi,
            currentPrice: pos.currentPrice?.value || 0,
            quantity: pos.quantity?.value || 0,
            totalValue: (pos.currentPrice?.value || 0) * (pos.quantity?.value || 0),
            priceHistory: undefined, // Would need historical data
          }));

          const portfolioValue = holdings.reduce((sum: number, h: PortfolioHolding) => sum + h.totalValue, 0);

          // Generate recommendations
          const recommendations = suggestTickers(riskProfile, holdings, portfolioValue);

          set({
            tickerRecommendations: recommendations,
            lastUpdated: new Date().toISOString(),
            isLoadingTickers: false,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to fetch ticker recommendations';
          set({ error: errorMessage, isLoadingTickers: false });
        }
      },

      dismissTickerRecommendation: (ticker: string) => {
        const currentRecommendations = get().tickerRecommendations;
        set({
          tickerRecommendations: currentRecommendations.filter((rec) => rec.ticker !== ticker),
        });
      },

      // Goal Recommendations Actions
      fetchGoalRecommendations: async (goalId: string) => {
        set({ isLoadingGoals: true, error: null });

        try {
          // Import goal functions
          const { suggestGoalAdjustments } = await import('@/lib/recommendations/goal-recommender');
          const { analyzeGoalProgress } = await import('@/lib/recommendations/goal-analyzer');

          // Get mock goal data (in real app, fetch from useGoalStore)
          const mockGoal = {
            id: goalId,
            name: 'Квартира через 5 лет',
            targetAmount: 5000000,
            deadline: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
            category: 'medium_term' as const,
          };

          // Get portfolio data
          const portfolioStore = usePortfolioStore.getState();
          const portfolio = portfolioStore.portfolio;

          if (!portfolio) {
            throw new Error('No portfolio data available');
          }

          // Calculate total portfolio value from all components
          const totalValue =
            (portfolio.totalAmountShares?.units ? parseFloat(portfolio.totalAmountShares.units) : 0) +
            (portfolio.totalAmountBonds?.units ? parseFloat(portfolio.totalAmountBonds.units) : 0) +
            (portfolio.totalAmountEtf?.units ? parseFloat(portfolio.totalAmountEtf.units) : 0) +
            (portfolio.totalAmountCurrencies?.units ? parseFloat(portfolio.totalAmountCurrencies.units) : 0) +
            (portfolio.totalAmountFutures?.units ? parseFloat(portfolio.totalAmountFutures.units) : 0);

          // Mock portfolio snapshot
          const portfolioSnapshot = {
            totalValue,
            allocation: {
              stocks: 0.7,
              bonds: 0.2,
              cash: 0.1,
              other: 0,
            },
            monthlySavings: 35000,
          };

          // Generate recommendations
          const recommendations = suggestGoalAdjustments(mockGoal, portfolioSnapshot);
          const analysis = analyzeGoalProgress(mockGoal, totalValue);

          set((state) => ({
            goalRecommendations: {
              ...state.goalRecommendations,
              [goalId]: recommendations,
            },
            goalAnalyses: {
              ...state.goalAnalyses,
              [goalId]: analysis,
            },
            isLoadingGoals: false,
          }));
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to fetch goal recommendations';
          set({ error: errorMessage, isLoadingGoals: false });
        }
      },

      dismissGoalRecommendation: (goalId: string, recommendationId: string) => {
        const currentRecommendations = get().goalRecommendations[goalId] || [];
        set((state) => ({
          goalRecommendations: {
            ...state.goalRecommendations,
            [goalId]: currentRecommendations.filter((rec) => rec.id !== recommendationId),
          },
        }));
      },

      refreshAllGoalRecommendations: async () => {
        // Refresh all existing goal recommendations
        const goalIds = Object.keys(get().goalRecommendations);
        await Promise.all(goalIds.map((goalId) => get().fetchGoalRecommendations(goalId)));
      },

      reset: () => {
        set({
          analysis: null,
          riskProfile: null,
          riskAssessment: null,
          tickerRecommendations: [],
          goalRecommendations: {},
          goalAnalyses: {},
          lastUpdated: null,
          isLoading: false,
          isLoadingTickers: false,
          isLoadingGoals: false,
          error: null,
        });
      },
    }),
    {
      name: 'recommendations-storage', // localStorage key
      partialize: (state) => ({
        analysis: state.analysis,
        riskProfile: state.riskProfile, // Persist risk profile
        tickerRecommendations: state.tickerRecommendations,
        goalRecommendations: state.goalRecommendations,
        goalAnalyses: state.goalAnalyses,
        lastUpdated: state.lastUpdated,
      }),
    }
  )
);

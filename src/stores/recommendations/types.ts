/**
 * Recommendations Store Types
 */

import type { DiversificationAnalysis } from '@/lib/recommendations/types';
import type { RiskProfile } from '@/lib/recommendations/risk-profiles';
import type { TickerRecommendation } from '@/lib/recommendations/ticker-recommender';
import type { RiskAssessment } from '@/lib/recommendations/risk-analyzer';
import type { GoalRecommendation } from '@/lib/recommendations/goal-recommender';
import type { GoalAnalysis } from '@/lib/recommendations/goal-analyzer';

/**
 * Recommendations store state
 */
export interface RecommendationsState {
  // Diversification Analysis
  analysis: DiversificationAnalysis | null;

  // Risk Profile & Assessment
  riskProfile: RiskProfile | null;
  riskAssessment: RiskAssessment | null;

  // Ticker Recommendations
  tickerRecommendations: TickerRecommendation[];
  lastUpdated: string | null;

  // Goal Recommendations
  goalRecommendations: Record<string, GoalRecommendation[]>; // Keyed by goalId
  goalAnalyses: Record<string, GoalAnalysis>; // Keyed by goalId
  isLoadingGoals: boolean;

  // Loading state
  isLoading: boolean;
  isLoadingTickers: boolean;

  // Error state
  error: string | null;

  // Diversification Actions
  setAnalysis: (analysis: DiversificationAnalysis) => void;
  dismissRecommendation: (sectorId: string) => void;
  refresh: () => Promise<void>;

  // Risk Profile Actions
  setRiskProfile: (profile: RiskProfile) => void;
  updateRiskAssessment: (assessment: RiskAssessment) => void;

  // Ticker Recommendations Actions
  fetchTickerRecommendations: () => Promise<void>;
  dismissTickerRecommendation: (ticker: string) => void;

  // Goal Recommendations Actions
  fetchGoalRecommendations: (goalId: string) => Promise<void>;
  dismissGoalRecommendation: (goalId: string, recommendationId: string) => void;
  refreshAllGoalRecommendations: () => Promise<void>;

  // Global Actions
  reset: () => void;
}

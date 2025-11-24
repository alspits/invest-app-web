/**
 * Investment Recommendation Engine - Public API
 *
 * Entry point for the recommendation system. Re-exports all public types
 * and functions for external use.
 */

// Export all types
export type {
  RecommendationPriority,
  RecommendationType,
  Recommendation,
  SectorAllocation,
  ConcentrationRisk,
  CashAnalysis,
  TargetAllocation,
  RecommendationReport,
  SectorWeight,
  SectorWeights,
  OverloadedSector,
  DiversificationAnalysis,
} from './types';

// Export main engine functions
export {
  generateRecommendations,
  getRecommendationsByPriority,
  getRecommendationsByType,
} from './recommendation-engine';

// Export scoring functions
export { calculateOverallScore, getHealthScoreInterpretation } from './scoring';

// Export analyzers (for advanced use cases)
export { analyzeConcentrationRisk } from './analyzers/concentration-analyzer';
export { analyzeCashAllocation } from './analyzers/cash-analyzer';
export { calculateSectorAllocation } from './analyzers/sector-analyzer';
export { generateTargetAllocations } from './analyzers/allocation-calculator';

// Export diversification analysis
export { analyzeDiversification } from './diversification-service';
export { calculateSectorWeights, detectOverloadedSectors } from './sector-analyzer';

// Export risk profile & analysis (4.1.2)
export { RiskProfile, getRiskProfileConfig, getAllRiskProfiles, RISK_PROFILE_UI } from './risk-profiles';
export type { RiskConfig } from './risk-profiles';
export { calculatePortfolioVolatility, assessRiskAlignment } from './risk-analyzer';
export type { PortfolioHolding, RiskAssessment } from './risk-analyzer';
export { suggestTickers } from './ticker-recommender';
export type { TickerRecommendation } from './ticker-recommender';

// Export goal-oriented recommendations (4.1.3)
export { analyzeGoalProgress, calculateRequiredSavingsRate, assessGoalRisk } from './goal-analyzer';
export type { Goal, GoalAnalysis } from './goal-analyzer';
export { suggestGoalAdjustments } from './goal-recommender';
export type { GoalRecommendation, AssetAction, SavingsAction, PortfolioSnapshot } from './goal-recommender';

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

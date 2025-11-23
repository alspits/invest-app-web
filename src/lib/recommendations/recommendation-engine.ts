/**
 * Investment Recommendation Engine
 *
 * Main orchestration layer that combines all analyzers and generators
 * to produce comprehensive investment recommendations.
 */

import { PortfolioResponse } from '../tinkoff-api';
import { PortfolioMetrics } from '../analytics';
import {
  Recommendation,
  RecommendationReport,
  RecommendationPriority,
  RecommendationType,
} from './types';

// Import analyzers
import { analyzeConcentrationRisk } from './analyzers/concentration-analyzer';
import { analyzeCashAllocation } from './analyzers/cash-analyzer';
import { calculateSectorAllocation } from './analyzers/sector-analyzer';
import { generateTargetAllocations } from './analyzers/allocation-calculator';

// Import generators
import { generateDiversificationRecommendations } from './generators/diversification-gen';
import { generateRebalancingRecommendations } from './generators/rebalancing-gen';
import { generateCashRecommendations } from './generators/cash-gen';
import { generateConcentrationRecommendations } from './generators/concentration-gen';
import { generateSectorRecommendations } from './generators/sector-gen';
import { generateRiskRecommendations } from './generators/risk-gen';

// Import scoring
import { calculateOverallScore } from './scoring';

/**
 * Generate comprehensive investment recommendations
 *
 * Analyzes portfolio data and generates actionable recommendations across
 * multiple dimensions: diversification, rebalancing, cash allocation,
 * concentration risk, sector allocation, and risk management.
 *
 * @param portfolio - Current portfolio data from Tinkoff API
 * @param metrics - Portfolio metrics from analytics
 * @returns Complete recommendation report with actionable insights
 */
export function generateRecommendations(
  portfolio: PortfolioResponse,
  metrics: PortfolioMetrics
): RecommendationReport {
  // Run all analyses
  const concentrationRisk = analyzeConcentrationRisk(portfolio);
  const cashAnalysis = analyzeCashAllocation(portfolio);
  const sectorAllocation = calculateSectorAllocation(portfolio);
  const targetAllocations = generateTargetAllocations(portfolio);

  // Generate recommendations
  const recommendations: Recommendation[] = [
    ...generateDiversificationRecommendations(portfolio, metrics),
    ...generateRebalancingRecommendations(portfolio, targetAllocations),
    ...generateCashRecommendations(cashAnalysis),
    ...generateConcentrationRecommendations(concentrationRisk, portfolio),
    ...generateSectorRecommendations(sectorAllocation),
    ...generateRiskRecommendations(portfolio, metrics),
  ];

  // Sort recommendations by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Calculate overall health score
  const overallScore = calculateOverallScore(metrics, concentrationRisk, cashAnalysis);

  return {
    recommendations,
    concentrationRisk,
    cashAnalysis,
    sectorAllocation,
    targetAllocations,
    overallScore,
    generatedAt: new Date(),
  };
}

/**
 * Get recommendations by priority
 *
 * Filters recommendations to return only those matching the specified priority level.
 *
 * @param report - Complete recommendation report
 * @param priority - Priority level to filter by
 * @returns Array of recommendations with specified priority
 */
export function getRecommendationsByPriority(
  report: RecommendationReport,
  priority: RecommendationPriority
): Recommendation[] {
  return report.recommendations.filter((rec) => rec.priority === priority);
}

/**
 * Get recommendations by type
 *
 * Filters recommendations to return only those matching the specified type.
 *
 * @param report - Complete recommendation report
 * @param type - Recommendation type to filter by
 * @returns Array of recommendations with specified type
 */
export function getRecommendationsByType(
  report: RecommendationReport,
  type: RecommendationType
): Recommendation[] {
  return report.recommendations.filter((rec) => rec.type === type);
}

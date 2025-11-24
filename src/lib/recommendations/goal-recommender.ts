/**
 * Goal-Based Recommendation Generator
 * Suggests asset allocation & savings adjustments to meet goals
 */

import { Goal, GoalAnalysis, analyzeGoalProgress } from './goal-analyzer';
import { RiskProfile, getRiskProfileConfig } from './risk-profiles';

export interface GoalRecommendation {
  id: string;
  goalId: string;
  type: 'asset_allocation' | 'savings_rate' | 'risk_adjustment';
  description: string;
  rationale: string;
  action: AssetAction | SavingsAction;
  priority: 1 | 2 | 3 | 4 | 5; // 1 = highest impact
  estimatedImpact: string; // Human-readable impact (e.g., "+8% goal completion")
}

export interface AssetAction {
  type: 'asset_allocation';
  sell?: { category: string; amount: number };
  buy?: { category: string; amount: number };
  targetAllocation: Record<string, number>; // e.g., { stocks: 0.4, bonds: 0.6 }
}

export interface SavingsAction {
  type: 'savings_rate';
  currentMonthlySavings: number;
  recommendedMonthlySavings: number;
  increaseAmount: number;
}

export interface PortfolioSnapshot {
  totalValue: number;
  allocation: {
    stocks: number; // Percentage (0-1)
    bonds: number;
    cash: number;
    other: number;
  };
  monthlySavings: number; // Current monthly contribution
}

/**
 * Calculate target asset allocation based on goal time horizon
 */
function calculateTargetAllocation(
  riskProfile: RiskProfile
): Record<string, number> {
  const config = getRiskProfileConfig(riskProfile);

  // Convert from percentage to 0-1
  const stocks = config.targetAllocation.stocks / 100;
  const bonds = config.targetAllocation.bonds / 100;
  const defaultCash = 0.1; // 10% cash reserve

  const equityTotal = stocks + bonds;

  // Scale stocks & bonds to sum to 0.9 (leaving 0.1 for cash)
  if (equityTotal > 0) {
    const scaleFactor = (1 - defaultCash) / equityTotal;
    return {
      stocks: stocks * scaleFactor,
      bonds: bonds * scaleFactor,
      cash: defaultCash,
    };
  }

  // Edge case: if no equity allocation, 100% cash
  return {
    stocks: 0,
    bonds: 0,
    cash: 1,
  };
}

/**
 * Generate asset allocation recommendation
 */
function generateAssetAllocationRec(
  goal: Goal,
  analysis: GoalAnalysis,
  portfolio: PortfolioSnapshot
): GoalRecommendation | null {
  const targetAlloc = calculateTargetAllocation(analysis.recommendedRiskProfile);
  const current = portfolio.allocation;

  // Find largest deviation
  const deviations = {
    stocks: targetAlloc.stocks - current.stocks,
    bonds: targetAlloc.bonds - current.bonds,
    cash: targetAlloc.cash - (current.cash || 0),
  };

  const maxDeviation = Math.max(...Object.values(deviations).map(Math.abs));

  // Only recommend if deviation > 10%
  if (maxDeviation < 0.1) return null;

  // Determine primary action
  let sellCategory = '';
  let buyCategory = '';
  let adjustmentAmount = 0;

  if (deviations.bonds > 0.1) {
    // Need more bonds (short-term goal)
    sellCategory = 'stocks';
    buyCategory = 'bonds';
    adjustmentAmount = Math.round(portfolio.totalValue * deviations.bonds);
  } else if (deviations.stocks > 0.1) {
    // Need more stocks (long-term goal)
    sellCategory = 'bonds';
    buyCategory = 'stocks';
    adjustmentAmount = Math.round(portfolio.totalValue * deviations.stocks);
  } else {
    return null;
  }

  const description =
    buyCategory === 'bonds'
      ? `Увеличить долю облигаций до ${(targetAlloc.bonds * 100).toFixed(0)}% (сейчас ${(current.bonds * 100).toFixed(0)}%)`
      : `Увеличить долю акций до ${(targetAlloc.stocks * 100).toFixed(0)}% (сейчас ${(current.stocks * 100).toFixed(0)}%)`;

  const rationale =
    analysis.timeRemaining.years < 3
      ? 'Короткий временной горизонт требует снижения риска'
      : 'Долгий горизонт позволяет принять больший риск для роста';

  const impact = Math.round(maxDeviation * 80); // Rough impact estimate

  return {
    id: `goal-alloc-${goal.id}-${Date.now()}`,
    goalId: goal.id,
    type: 'asset_allocation',
    description,
    rationale,
    action: {
      type: 'asset_allocation',
      sell: { category: sellCategory, amount: adjustmentAmount },
      buy: { category: buyCategory, amount: adjustmentAmount },
      targetAllocation: targetAlloc,
    },
    priority: 1,
    estimatedImpact: `+${impact}% вероятность достижения цели`,
  };
}

/**
 * Generate savings rate recommendation
 */
function generateSavingsRateRec(
  goal: Goal,
  analysis: GoalAnalysis,
  portfolio: PortfolioSnapshot
): GoalRecommendation | null {
  const { requiredMonthlySavings } = analysis;
  const current = portfolio.monthlySavings;
  const increase = requiredMonthlySavings - current;

  // Only recommend if increase > 5000
  if (increase <= 5000) return null;

  // Handle division by zero: if current is 0, set percent to null
  const increasePercent = current > 0 ? Math.round((increase / current) * 100) : null;

  return {
    id: `goal-savings-${goal.id}-${Date.now()}`,
    goalId: goal.id,
    type: 'savings_rate',
    description: `Увеличить ежемесячные взносы на ₽${increase.toLocaleString('ru-RU')}`,
    rationale: 'Текущая норма сбережений недостаточна для достижения цели',
    action: {
      type: 'savings_rate',
      currentMonthlySavings: current,
      recommendedMonthlySavings: requiredMonthlySavings,
      increaseAmount: increase,
    },
    priority: 2,
    estimatedImpact: increasePercent !== null
      ? `+${Math.min(increasePercent, 100)}% вероятность достижения цели`
      : 'Существенное увеличение вероятности достижения цели',
  };
}

/**
 * Generate all recommendations for a goal
 * Returns max 3 recommendations, prioritized by impact
 */
export function suggestGoalAdjustments(
  goal: Goal,
  portfolio: PortfolioSnapshot,
  historicalReturn: number = 0.08
): GoalRecommendation[] {
  const analysis = analyzeGoalProgress(goal, portfolio.totalValue, historicalReturn);

  const recommendations: GoalRecommendation[] = [];

  // 1. Asset allocation adjustment (if needed)
  const allocRec = generateAssetAllocationRec(goal, analysis, portfolio);
  if (allocRec) recommendations.push(allocRec);

  // 2. Savings rate adjustment (if needed)
  const savingsRec = generateSavingsRateRec(goal, analysis, portfolio);
  if (savingsRec) recommendations.push(savingsRec);

  // Sort by priority and return max 3
  return recommendations.sort((a, b) => a.priority - b.priority).slice(0, 3);
}

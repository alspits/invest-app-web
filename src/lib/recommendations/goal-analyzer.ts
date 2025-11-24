/**
 * Goal Progress & Gap Analysis
 * Calculates progress toward financial goals and required savings
 */

import { RiskProfile } from './risk-profiles';

export interface Goal {
  id: string;
  name: string;
  targetAmount: number; // Target amount in currency
  deadline: Date; // Target completion date
  category: 'short_term' | 'medium_term' | 'long_term'; // Time horizon
  description?: string;
}

export interface GoalAnalysis {
  goalId: string;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  progress: number; // 0-1 (percentage as decimal)
  status: 'on_track' | 'at_risk' | 'behind';
  timeRemaining: {
    years: number;
    months: number;
    totalMonths: number;
  };
  requiredMonthlySavings: number;
  recommendedRiskProfile: RiskProfile;
  estimatedReturn: number; // Annual expected return (0-1)
  completionProbability: number; // 0-100
}

/**
 * Calculate time remaining until goal deadline
 */
function calculateTimeRemaining(deadline: Date): {
  years: number;
  months: number;
  totalMonths: number;
} {
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  // Allow 0 months for past deadlines instead of forcing minimum of 1
  const totalMonths = Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24 * 30)));

  return {
    totalMonths,
    years: Math.floor(totalMonths / 12),
    months: totalMonths % 12,
  };
}

/**
 * Calculate required monthly savings to reach goal
 * Uses compound interest formula: FV = PV * (1 + r)^n + PMT * [((1 + r)^n - 1) / r]
 */
export function calculateRequiredSavingsRate(
  goal: Goal,
  currentAmount: number,
  expectedReturn: number = 0.08 // Default 8% annual return
): number {
  const { totalMonths } = calculateTimeRemaining(goal.deadline);
  const monthlyRate = expectedReturn / 12;
  const target = goal.targetAmount;

  if (totalMonths <= 0) return 0;

  // Future value of current amount
  const futureValueOfCurrent = currentAmount * Math.pow(1 + monthlyRate, totalMonths);

  // Remaining amount needed
  const remaining = Math.max(0, target - futureValueOfCurrent);

  if (remaining === 0) return 0;

  // Calculate monthly payment using future value of annuity formula
  // PMT = (FV * r) / ((1 + r)^n - 1)
  const denominator = Math.pow(1 + monthlyRate, totalMonths) - 1;

  if (denominator === 0) {
    // If no growth, simple division
    return remaining / totalMonths;
  }

  const monthlyPayment = (remaining * monthlyRate) / denominator;

  return Math.max(0, Math.round(monthlyPayment));
}

/**
 * Assess risk tolerance based on goal time horizon
 */
export function assessGoalRisk(goal: Goal, timeHorizon: number): RiskProfile {
  if (timeHorizon < 3) {
    return RiskProfile.CONSERVATIVE; // Short-term: preserve capital
  } else if (timeHorizon < 7) {
    return RiskProfile.MODERATE; // Medium-term: balanced growth
  } else {
    return RiskProfile.AGGRESSIVE; // Long-term: maximize returns
  }
}

/**
 * Analyze progress toward a financial goal
 */
export function analyzeGoalProgress(
  goal: Goal,
  currentPortfolio: number,
  historicalReturn: number = 0.08 // Default 8% annual return
): GoalAnalysis {
  const timeRemaining = calculateTimeRemaining(goal.deadline);
  const progress = Math.min(1, currentPortfolio / goal.targetAmount);
  const requiredMonthlySavings = calculateRequiredSavingsRate(
    goal,
    currentPortfolio,
    historicalReturn
  );

  // Recommend risk profile based on time horizon
  const recommendedRiskProfile = assessGoalRisk(goal, timeRemaining.years);

  // Estimate completion probability
  let status: GoalAnalysis['status'];
  let completionProbability: number;

  // Project future value with required savings
  const monthlyRate = historicalReturn / 12;
  const epsilon = 0.0001; // Small value to detect near-zero rates

  let futureValue: number;
  if (Math.abs(monthlyRate) < epsilon) {
    // Use non-compounding formula when rate is approximately zero
    futureValue =
      currentPortfolio + requiredMonthlySavings * timeRemaining.totalMonths;
  } else {
    // Use compounding formula for non-zero rates
    futureValue =
      currentPortfolio * Math.pow(1 + monthlyRate, timeRemaining.totalMonths) +
      requiredMonthlySavings *
        ((Math.pow(1 + monthlyRate, timeRemaining.totalMonths) - 1) / monthlyRate);
  }

  const projectedProgress = futureValue / goal.targetAmount;

  if (projectedProgress >= 0.95) {
    status = 'on_track';
    completionProbability = Math.min(100, Math.round(projectedProgress * 100));
  } else if (projectedProgress >= 0.75) {
    status = 'at_risk';
    completionProbability = Math.round(projectedProgress * 85);
  } else {
    status = 'behind';
    completionProbability = Math.round(projectedProgress * 70);
  }

  return {
    goalId: goal.id,
    goalName: goal.name,
    targetAmount: goal.targetAmount,
    currentAmount: currentPortfolio,
    progress,
    status,
    timeRemaining,
    requiredMonthlySavings,
    recommendedRiskProfile,
    estimatedReturn: historicalReturn,
    completionProbability,
  };
}

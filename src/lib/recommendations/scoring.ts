/**
 * Portfolio Health Scoring System
 *
 * Calculates overall portfolio health score (0-100) based on multiple factors
 * and provides interpretation of the score.
 */

import { PortfolioMetrics } from '../analytics';
import { ConcentrationRisk, CashAnalysis } from './types';

/**
 * Calculate overall portfolio health score (0-100)
 *
 * Scoring factors:
 * - Diversification score: 30 points
 * - Concentration risk: 20 points
 * - Cash allocation: 15 points
 * - Volatility: 20 points
 * - Sharpe ratio: 15 points
 *
 * @param metrics - Portfolio analytics metrics
 * @param concentrationRisk - Concentration risk analysis
 * @param cashAnalysis - Cash allocation analysis
 * @returns Health score from 0 to 100
 */
export function calculateOverallScore(
  metrics: PortfolioMetrics,
  concentrationRisk: ConcentrationRisk,
  cashAnalysis: CashAnalysis
): number {
  let score = 100;

  // Diversification score (30 points)
  score -= (1 - metrics.diversificationScore) * 30;

  // Concentration risk (20 points)
  if (concentrationRisk.isHighRisk) {
    score -= 20;
  } else if (concentrationRisk.topPosition.percentage > 20) {
    score -= 10;
  }

  // Cash allocation (15 points)
  if (cashAnalysis.isExcessive) {
    score -= 15;
  } else if (cashAnalysis.cashPercentage < 5) {
    score -= 5; // Too little cash is also a problem
  }

  // Volatility (20 points)
  if (metrics.volatility > 30) {
    score -= 20;
  } else if (metrics.volatility > 20) {
    score -= 10;
  }

  // Sharpe Ratio (15 points)
  if (metrics.sharpeRatio < 0) {
    score -= 15;
  } else if (metrics.sharpeRatio < 0.5) {
    score -= 10;
  } else if (metrics.sharpeRatio < 1) {
    score -= 5;
  }

  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Get health score interpretation
 *
 * Provides human-readable interpretation of portfolio health score
 * with label, description, and color coding.
 *
 * @param score - Portfolio health score (0-100)
 * @returns Health score interpretation object
 */
export function getHealthScoreInterpretation(score: number): {
  label: string;
  description: string;
  color: string;
} {
  if (score >= 80) {
    return {
      label: 'Отличное здоровье',
      description: 'Ваш портфель хорошо диверсифицирован и сбалансирован.',
      color: 'green',
    };
  } else if (score >= 60) {
    return {
      label: 'Хорошее здоровье',
      description: 'Портфель в хорошем состоянии с небольшими возможностями для улучшения.',
      color: 'blue',
    };
  } else if (score >= 40) {
    return {
      label: 'Требует внимания',
      description: 'Портфель нуждается в корректировках для снижения рисков.',
      color: 'yellow',
    };
  } else {
    return {
      label: 'Высокий риск',
      description: 'Портфель имеет серьезные проблемы, требующие немедленного внимания.',
      color: 'red',
    };
  }
}

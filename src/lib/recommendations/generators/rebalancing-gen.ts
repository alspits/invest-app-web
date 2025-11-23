/**
 * Rebalancing Recommendations Generator
 *
 * Generates recommendations for portfolio rebalancing when allocations
 * deviate significantly from target percentages.
 */

import { PortfolioResponse } from '../../tinkoff-api';
import { Recommendation, TargetAllocation } from '../types';
import { generateRecommendationId } from '../converters';

/**
 * Generate rebalancing recommendations
 *
 * Creates recommendations for portfolios with significant asset allocation
 * imbalances (>10% deviation from target).
 *
 * @param portfolio - Portfolio data from Tinkoff API
 * @param targetAllocations - Target allocations requiring rebalancing
 * @returns Array of rebalancing recommendations
 */
export function generateRebalancingRecommendations(
  portfolio: PortfolioResponse,
  targetAllocations: TargetAllocation[]
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  if (targetAllocations.length === 0) {
    return recommendations;
  }

  // Generate recommendation for significant imbalances (> 10%)
  const significantImbalances = targetAllocations.filter(
    (allocation) => Math.abs(allocation.difference) > 10
  );

  if (significantImbalances.length > 0) {
    const actionItems = significantImbalances.map((allocation) => {
      const action = allocation.difference > 0 ? 'Увеличьте' : 'Уменьшите';
      const amount = Math.abs(allocation.rebalanceAmount).toLocaleString('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
      return `${action} долю "${allocation.instrumentType}" на ${Math.abs(allocation.difference).toFixed(1)}% (≈${amount})`;
    });

    recommendations.push({
      id: generateRecommendationId('rebalancing', 0),
      type: 'rebalancing',
      priority: 'high',
      title: 'Требуется ребалансировка портфеля',
      description:
        'Текущее распределение активов значительно отклоняется от рекомендуемого. Ребалансировка поможет оптимизировать соотношение риск/доходность.',
      actionItems,
      rationale:
        'Поддержание целевого распределения активов помогает контролировать риск и обеспечивает соответствие инвестиционной стратегии.',
      targetAllocation: 60, // Target for stocks (example)
      currentAllocation: targetAllocations[0]?.currentPercentage,
      potentialImpact: 'Оптимизация риска и доходности портфеля',
    });
  }

  return recommendations;
}

/**
 * Diversification Recommendations Generator
 *
 * Generates recommendations for improving portfolio diversification
 * based on diversification score from portfolio metrics.
 */

import { PortfolioResponse } from '../../tinkoff-api';
import { PortfolioMetrics } from '../../analytics';
import { Recommendation } from '../types';
import { generateRecommendationId } from '../converters';

/**
 * Generate diversification recommendations
 *
 * Evaluates diversification score and suggests actions:
 * - Low diversification (<0.5): High priority recommendations
 * - Moderate diversification (0.5-0.7): Medium priority recommendations
 * - Good diversification (>0.7): No recommendations
 *
 * @param portfolio - Portfolio data from Tinkoff API
 * @param metrics - Portfolio analytics metrics
 * @returns Array of diversification recommendations
 */
export function generateDiversificationRecommendations(
  portfolio: PortfolioResponse,
  metrics: PortfolioMetrics
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const diversificationScore = metrics.diversificationScore;

  // Low diversification (score < 0.5)
  if (diversificationScore < 0.5) {
    recommendations.push({
      id: generateRecommendationId('diversification', 0),
      type: 'diversification',
      priority: 'high',
      title: 'Низкая диверсификация портфеля',
      description: `Ваш портфель имеет низкий показатель диверсификации (${(diversificationScore * 100).toFixed(0)}%). Рекомендуется увеличить количество активов.`,
      actionItems: [
        'Добавьте 5-10 новых позиций в разных секторах',
        'Рассмотрите покупку ETF для широкой диверсификации',
        'Инвестируйте в облигации для снижения волатильности',
      ],
      rationale:
        'Низкая диверсификация увеличивает риск портфеля. Распределение инвестиций снижает влияние падения отдельных активов.',
      potentialImpact: 'Снижение риска на 20-30%, улучшение стабильности доходности',
    });
  }
  // Moderate diversification (0.5 <= score < 0.7)
  else if (diversificationScore < 0.7) {
    recommendations.push({
      id: generateRecommendationId('diversification', 1),
      type: 'diversification',
      priority: 'medium',
      title: 'Умеренная диверсификация',
      description: `Диверсификация портфеля на приемлемом уровне (${(diversificationScore * 100).toFixed(0)}%), но есть возможности для улучшения.`,
      actionItems: [
        'Добавьте 2-3 позиции в недопредставленных секторах',
        'Рассмотрите международные ETF для географической диверсификации',
      ],
      rationale: 'Улучшение диверсификации может дополнительно снизить риски портфеля.',
      potentialImpact: 'Снижение риска на 10-15%',
    });
  }

  return recommendations;
}

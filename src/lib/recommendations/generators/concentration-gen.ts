/**
 * Concentration Risk Recommendations Generator
 *
 * Generates recommendations for reducing portfolio concentration risk
 * when positions are too heavily weighted.
 */

import { PortfolioResponse } from '../../tinkoff-api';
import { Recommendation, ConcentrationRisk } from '../types';
import { generateRecommendationId } from '../converters';

/**
 * Generate concentration risk recommendations
 *
 * Creates high-priority recommendations when:
 * - Top position exceeds 25% of portfolio
 * - Top 3 positions exceed 60% of portfolio
 * - Herfindahl-Hirschman Index indicates high concentration
 *
 * @param concentrationRisk - Concentration risk analysis results
 * @param portfolio - Portfolio data from Tinkoff API
 * @returns Array of concentration risk recommendations
 */
export function generateConcentrationRecommendations(
  concentrationRisk: ConcentrationRisk,
  portfolio: PortfolioResponse
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  if (concentrationRisk.isHighRisk) {
    const actionItems: string[] = [];

    if (concentrationRisk.topPosition.percentage > 25) {
      actionItems.push(
        `Снизьте долю "${concentrationRisk.topPosition.ticker}" с ${concentrationRisk.topPosition.percentage.toFixed(1)}% до 15-20%`
      );
    }

    if (concentrationRisk.top3Concentration > 60) {
      actionItems.push(
        `Уменьшите концентрацию в топ-3 позициях с ${concentrationRisk.top3Concentration.toFixed(1)}% до 40-50%`
      );
    }

    actionItems.push('Реинвестируйте вырученные средства в 3-5 разных активов');
    actionItems.push('Рассмотрите ETF для автоматической диверсификации');

    recommendations.push({
      id: generateRecommendationId('concentration_risk', 0),
      type: 'concentration_risk',
      priority: 'high',
      title: 'Высокий риск концентрации',
      description:
        'Слишком большая доля портфеля сосредоточена в нескольких позициях. Это создает значительный риск потерь при падении этих активов.',
      actionItems,
      rationale:
        'Концентрация риска в отдельных активах увеличивает волатильность портфеля. Диверсификация снижает влияние неудачных инвестиций.',
      affectedPositions: [concentrationRisk.topPosition.ticker],
      potentialImpact: 'Снижение риска портфеля на 25-40%',
    });
  }

  return recommendations;
}

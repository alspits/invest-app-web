/**
 * Sector Allocation Recommendations Generator
 *
 * Generates recommendations for balancing sector allocation
 * when portfolio is over-concentrated in specific sectors.
 */

import { Recommendation, SectorAllocation } from '../types';
import { generateRecommendationId } from '../converters';

/**
 * Generate sector allocation recommendations
 *
 * Creates high-priority recommendations when any sector exceeds 70%
 * of portfolio value, suggesting diversification across other sectors.
 *
 * @param sectorAllocation - Sector allocation analysis results
 * @returns Array of sector allocation recommendations
 */
export function generateSectorRecommendations(
  sectorAllocation: SectorAllocation[]
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Check if any sector is over-concentrated (> 70%)
  const overConcentratedSector = sectorAllocation.find((sector) => sector.percentage > 70);

  if (overConcentratedSector) {
    recommendations.push({
      id: generateRecommendationId('sector_allocation', 0),
      type: 'sector_allocation',
      priority: 'high',
      title: 'Несбалансированное распределение по секторам',
      description: `Сектор "${overConcentratedSector.sector}" составляет ${overConcentratedSector.percentage.toFixed(1)}% портфеля. Рекомендуется диверсификация по другим секторам.`,
      actionItems: [
        `Снизьте долю сектора "${overConcentratedSector.sector}" до 50-60%`,
        'Инвестируйте в недопредставленные секторы',
        'Рассмотрите широкие индексные ETF для сбалансированной экспозиции',
      ],
      rationale:
        'Концентрация в одном секторе увеличивает риск от отраслевых спадов. Межсекторная диверсификация повышает устойчивость портфеля.',
      affectedPositions: overConcentratedSector.positions,
      potentialImpact: 'Снижение отраслевого риска на 30-40%',
    });
  }

  return recommendations;
}

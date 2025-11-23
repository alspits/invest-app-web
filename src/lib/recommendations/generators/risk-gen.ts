/**
 * Risk Management Recommendations Generator
 *
 * Generates recommendations for managing portfolio risk based on
 * volatility and Sharpe ratio metrics.
 */

import { PortfolioResponse } from '../../tinkoff-api';
import { PortfolioMetrics } from '../../analytics';
import { Recommendation } from '../types';
import { generateRecommendationId } from '../converters';

/**
 * Generate risk management recommendations
 *
 * Creates recommendations for:
 * - High volatility (>25%): Reduce portfolio volatility
 * - Low Sharpe ratio (<0.5): Improve risk-adjusted returns
 *
 * @param portfolio - Portfolio data from Tinkoff API
 * @param metrics - Portfolio analytics metrics
 * @returns Array of risk management recommendations
 */
export function generateRiskRecommendations(
  portfolio: PortfolioResponse,
  metrics: PortfolioMetrics
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // High volatility warning (> 25%)
  if (metrics.volatility > 25) {
    recommendations.push({
      id: generateRecommendationId('risk_management', 0),
      type: 'risk_management',
      priority: 'high',
      title: 'Высокая волатильность портфеля',
      description: `Волатильность портфеля составляет ${metrics.volatility.toFixed(1)}%, что значительно выше среднерыночного уровня.`,
      actionItems: [
        'Увеличьте долю облигаций до 25-30% для стабилизации',
        'Рассмотрите защитные активы (золото, облигации)',
        'Снизьте долю высокорисковых активов (фьючерсы, спекулятивные акции)',
      ],
      rationale:
        'Высокая волатильность означает большие колебания стоимости портфеля, что может привести к значительным временным убыткам.',
      potentialImpact: 'Снижение волатильности до 15-20%',
    });
  }

  // Low Sharpe Ratio (< 0.5)
  if (metrics.sharpeRatio < 0.5 && metrics.sharpeRatio !== 0) {
    recommendations.push({
      id: generateRecommendationId('risk_management', 1),
      type: 'risk_management',
      priority: 'medium',
      title: 'Низкая эффективность портфеля',
      description: `Коэффициент Шарпа составляет ${metrics.sharpeRatio.toFixed(2)}, что указывает на недостаточную доходность относительно принимаемого риска.`,
      actionItems: [
        'Оптимизируйте состав портфеля, избавившись от низкодоходных активов',
        'Рассмотрите более эффективные инструменты (индексные ETF)',
        'Ребалансируйте портфель для улучшения соотношения риск/доходность',
      ],
      rationale:
        'Низкий коэффициент Шарпа означает, что вы принимаете больше риска, чем это оправдано доходностью.',
      potentialImpact: 'Повышение эффективности портфеля на 30-50%',
    });
  }

  return recommendations;
}

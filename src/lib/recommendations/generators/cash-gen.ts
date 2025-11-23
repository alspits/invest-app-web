/**
 * Cash Allocation Recommendations Generator
 *
 * Generates recommendations for investing excess cash holdings
 * to improve portfolio returns.
 */

import { Recommendation, CashAnalysis } from '../types';
import { generateRecommendationId } from '../converters';

/**
 * Generate cash allocation recommendations
 *
 * Creates recommendations when cash allocation is excessive (>10% of portfolio),
 * suggesting to invest a portion while maintaining liquidity buffer.
 *
 * @param cashAnalysis - Cash allocation analysis results
 * @returns Array of cash allocation recommendations
 */
export function generateCashRecommendations(cashAnalysis: CashAnalysis): Recommendation[] {
  const recommendations: Recommendation[] = [];

  if (cashAnalysis.isExcessive && cashAnalysis.suggestedInvestmentAmount) {
    const suggestedAmount = cashAnalysis.suggestedInvestmentAmount.toLocaleString('ru-RU', {
      style: 'currency',
      currency: cashAnalysis.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    recommendations.push({
      id: generateRecommendationId('cash_allocation', 0),
      type: 'cash_allocation',
      priority: 'medium',
      title: 'Неиспользуемые денежные средства',
      description: `У вас ${cashAnalysis.cashPercentage.toFixed(1)}% портфеля в денежных средствах. Рекомендуется инвестировать часть средств для получения доходности.`,
      actionItems: [
        `Инвестируйте ${suggestedAmount} в индексные ETF для рыночной доходности`,
        'Рассмотрите краткосрочные облигации для минимального риска',
        'Сохраните 10% портфеля в наличных для ликвидности',
      ],
      rationale:
        'Избыточные денежные средства не приносят доход и подвержены инфляции. Инвестирование повышает потенциальную доходность портфеля.',
      currentAllocation: cashAnalysis.cashPercentage,
      targetAllocation: 10,
      potentialImpact: `Потенциальный дополнительный доход: ${(cashAnalysis.suggestedInvestmentAmount! * 0.08).toLocaleString('ru-RU', { style: 'currency', currency: cashAnalysis.currency, minimumFractionDigits: 0 })} в год (при 8% годовых)`,
    });
  }

  return recommendations;
}

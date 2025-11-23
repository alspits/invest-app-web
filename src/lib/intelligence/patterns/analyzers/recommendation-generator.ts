import type { PatternStats, PatternAnalysis } from '@/types/trading-pattern';

/**
 * Generate actionable recommendations based on pattern statistics
 *
 * Generates recommendations for:
 * - High risk score (>60%) - Suggests reducing emotional trading
 * - Panic sells - Advises on stop-loss strategies
 * - FOMO buys - Warns about impulse purchases
 * - Strategic success - Encourages continuing planned approach
 *
 * @param statistics - Pattern statistics by category
 * @param summary - High-level pattern summary
 * @returns Array of recommendations with severity levels
 *
 * @example
 * ```typescript
 * const recommendations = generateRecommendations(statistics, summary);
 * recommendations.forEach(r => console.log(r.message));
 * ```
 */
export function generateRecommendations(
  statistics: PatternStats[],
  summary: ReturnType<
    typeof import('./summary-generator').generateSummary
  >
): PatternAnalysis['recommendations'] {
  const recommendations: PatternAnalysis['recommendations'] = [];

  // High risk score
  if (summary.riskScore > 60) {
    recommendations.push({
      category: 'risk',
      message:
        'Высокий уровень эмоциональных сделок. Рекомендуется придерживаться стратегии и избегать импульсивных решений.',
      severity: 'critical',
    });
  }

  // Panic sells
  const panicStats = statistics.find((s) => s.category === 'panic_sell');
  if (panicStats && panicStats.totalCount > 0) {
    recommendations.push({
      category: 'panic_sell',
      message: `Обнаружено ${panicStats.totalCount} панических продаж со средним убытком ${panicStats.averageProfitLoss.toFixed(1)}%. Рассмотрите установку стоп-лоссов заранее.`,
      severity: panicStats.totalCount > 5 ? 'critical' : 'warning',
    });
  }

  // FOMO buys
  const fomoStats = statistics.find((s) => s.category === 'fomo_buy');
  if (fomoStats && fomoStats.totalCount > 0) {
    recommendations.push({
      category: 'fomo_buy',
      message: `Обнаружено ${fomoStats.totalCount} импульсивных покупок (FOMO). Успешность: ${fomoStats.successRate.toFixed(0)}%. Избегайте покупок на эмоциях.`,
      severity: fomoStats.successRate < 40 ? 'critical' : 'warning',
    });
  }

  // Strategic success
  const strategicStats = statistics.find((s) => s.category === 'strategic');
  if (strategicStats && strategicStats.successRate > 60) {
    recommendations.push({
      category: 'strategic',
      message: `Стратегические сделки показывают хорошую эффективность (${strategicStats.successRate.toFixed(0)}%). Продолжайте следовать плану.`,
      severity: 'info',
    });
  }

  return recommendations;
}

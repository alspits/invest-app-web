import type {
  TradingPattern,
  PatternStats,
  PatternCategory,
} from '@/types/trading-pattern';

/**
 * Calculate statistics for all detected patterns grouped by category
 *
 * Computes for each pattern category:
 * - Total count, success count, failure count
 * - Success rate percentage
 * - Average profit/loss and time to complete
 * - Total trading volume
 * - Common emotional triggers
 *
 * @param patterns - Array of detected trading patterns
 * @returns Array of pattern statistics grouped by category
 *
 * @example
 * ```typescript
 * const stats = calculateStatistics(patterns);
 * // Returns statistics for panic_sell, fomo_buy, strategic, emotional
 * ```
 */
export function calculateStatistics(
  patterns: TradingPattern[]
): PatternStats[] {
  const categories: PatternCategory[] = [
    'panic_sell',
    'fomo_buy',
    'strategic',
    'emotional',
  ];

  return categories.map((category) => {
    const categoryPatterns = patterns.filter((p) => p.category === category);

    const successCount = categoryPatterns.filter(
      (p) => p.metrics.profitLoss > 0
    ).length;
    const failureCount = categoryPatterns.filter(
      (p) => p.metrics.profitLoss < 0
    ).length;

    const totalCount = categoryPatterns.length;
    const successRate = totalCount > 0 ? (successCount / totalCount) * 100 : 0;

    const averageProfitLoss =
      totalCount > 0
        ? categoryPatterns.reduce((sum, p) => sum + p.metrics.profitLoss, 0) /
          totalCount
        : 0;

    const averageTimeToComplete =
      totalCount > 0
        ? categoryPatterns.reduce(
            (sum, p) => sum + p.metrics.timeToComplete,
            0
          ) / totalCount
        : 0;

    const totalVolume = categoryPatterns.reduce(
      (sum, p) => sum + Math.abs(p.metrics.profitLossAbsolute),
      0
    );

    // Count common triggers
    const triggerCounts = new Map<string, number>();
    categoryPatterns.forEach((p) => {
      p.triggers.forEach((t) => {
        triggerCounts.set(t.type, (triggerCounts.get(t.type) || 0) + 1);
      });
    });

    const commonTriggers = Array.from(triggerCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    return {
      category,
      totalCount,
      successCount,
      failureCount,
      successRate,
      averageProfitLoss,
      averageTimeToComplete,
      totalVolume,
      commonTriggers,
    };
  });
}

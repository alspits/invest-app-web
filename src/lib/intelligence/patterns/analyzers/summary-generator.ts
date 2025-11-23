import type {
  TradingPattern,
  PatternStats,
  Operation,
} from '@/types/trading-pattern';

/**
 * Generate high-level summary of pattern analysis
 *
 * Calculates:
 * - Total patterns and operations count
 * - Overall profit/loss average
 * - Most common pattern category
 * - Most successful pattern category
 * - Risk score (0-100, higher = more emotional/risky trading)
 *
 * @param patterns - Array of detected trading patterns
 * @param statistics - Pattern statistics by category
 * @param allOperations - All trading operations
 * @returns Summary object with key metrics
 *
 * @example
 * ```typescript
 * const summary = generateSummary(patterns, statistics, operations);
 * console.log(`Risk Score: ${summary.riskScore}`);
 * ```
 */
export function generateSummary(
  patterns: TradingPattern[],
  statistics: PatternStats[],
  allOperations: Operation[]
) {
  const totalPatterns = patterns.length;
  const totalOperations = allOperations.length;

  const overallProfitLoss =
    totalPatterns > 0
      ? patterns.reduce((sum, p) => sum + p.metrics.profitLoss, 0) /
        totalPatterns
      : 0;

  const mostCommonCategory =
    statistics.toSorted((a, b) => b.totalCount - a.totalCount)[0]?.category ||
    'strategic';

  const mostSuccessfulCategory =
    statistics.toSorted((a, b) => {
      // Handle nullable successRate: null values go to the end
      if (a.successRate === null && b.successRate === null) return 0;
      if (a.successRate === null) return 1;
      if (b.successRate === null) return -1;
      return b.successRate - a.successRate;
    })[0]?.category || 'strategic';

  // Calculate risk score (0-100, higher = more emotional/risky)
  const emotionalCount =
    statistics.find((s) => s.category === 'emotional')?.totalCount || 0;
  const panicCount =
    statistics.find((s) => s.category === 'panic_sell')?.totalCount || 0;
  const fomoCount =
    statistics.find((s) => s.category === 'fomo_buy')?.totalCount || 0;

  const riskScore = Math.min(
    100,
    ((emotionalCount + panicCount + fomoCount) / Math.max(totalPatterns, 1)) *
      100
  );

  return {
    totalPatterns,
    totalOperations,
    overallProfitLoss,
    mostCommonCategory,
    mostSuccessfulCategory,
    riskScore,
  };
}

import type { TradePair, PatternDetectionConfig } from '@/types/trading-pattern';

/**
 * Detect if a trade pair represents a strategic trade pattern
 *
 * Strategic trade is detected when:
 * - Take profit: Good profit (> strategicTakeProfitThreshold) with reasonable holding period (> 7 days)
 * - DCA pattern: Regular purchases at intervals (TODO: implement)
 *
 * @param pair - Trade pair to analyze
 * @param config - Pattern detection configuration
 * @returns True if strategic trade pattern detected
 *
 * @example
 * ```typescript
 * const isStrategic = isStrategicTrade(tradePair, config);
 * if (isStrategic) {
 *   console.log('Strategic trade detected');
 * }
 * ```
 */
export function isStrategicTrade(
  pair: TradePair,
  config: PatternDetectionConfig
): boolean {
  // Take profit (good profit and reasonable holding period)
  if (
    pair.profitLossPercentage > config.strategicTakeProfitThreshold &&
    pair.holdingPeriodDays > 7
  ) {
    return true;
  }

  // DCA pattern (regular purchases)
  // TODO: Implement DCA detection

  return false;
}

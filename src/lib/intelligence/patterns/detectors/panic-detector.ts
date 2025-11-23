import type { TradePair, PatternDetectionConfig } from '@/types/trading-pattern';

/**
 * Detect if a trade pair represents a panic sell pattern
 *
 * Panic sell is detected when:
 * - Large loss exceeding panicSellLossThreshold
 * - Quick sell after buy (< 7 days) with loss exceeding panicSellPriceDropThreshold
 *
 * @param pair - Trade pair to analyze
 * @param config - Pattern detection configuration
 * @returns True if panic sell pattern detected
 *
 * @example
 * ```typescript
 * const isPanic = isPanicSell(tradePair, config);
 * if (isPanic) {
 *   console.log('Обнаружена паническая продажа');
 * }
 * ```
 */
export function isPanicSell(
  pair: TradePair,
  config: PatternDetectionConfig
): boolean {
  // Large loss
  if (pair.profitLossPercentage < -config.panicSellLossThreshold) {
    return true;
  }

  // Quick sell after buy (less than 7 days) with loss
  if (
    pair.holdingPeriodDays < 7 &&
    pair.profitLossPercentage < -config.panicSellPriceDropThreshold
  ) {
    return true;
  }

  return false;
}

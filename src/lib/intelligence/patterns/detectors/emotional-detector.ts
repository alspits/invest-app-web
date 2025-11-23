import type {
  TradePair,
  InstrumentOperations,
  PatternDetectionConfig,
} from '@/types/trading-pattern';

/**
 * Detect if a trade pair represents an emotional trading pattern
 *
 * Emotional trade is detected when:
 * - Very short holding period (day trading < emotionalDayTradingWindowHours)
 * - Frequent trading (high turnover > emotionalFrequencyThreshold trades in 7 days)
 *
 * @param pair - Trade pair to analyze
 * @param instrumentOps - All operations for this instrument
 * @param config - Pattern detection configuration
 * @returns True if emotional trade pattern detected
 *
 * @example
 * ```typescript
 * const isEmotional = isEmotionalTrade(tradePair, instrumentOps, config);
 * if (isEmotional) {
 *   console.log('Обнаружена эмоциональная сделка');
 * }
 * ```
 */
export function isEmotionalTrade(
  pair: TradePair,
  instrumentOps: InstrumentOperations,
  config: PatternDetectionConfig
): boolean {
  // Very short holding period (day trading)
  if (
    pair.holdingPeriodDays <
    config.emotionalDayTradingWindowHours / 24
  ) {
    return true;
  }

  // Frequent trading (high turnover)
  const oneWeekAgo = new Date(pair.sellOperation.date);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const recentOps = instrumentOps.operations.filter(
    (op) => new Date(op.date) > oneWeekAgo
  );

  if (recentOps.length > config.emotionalFrequencyThreshold) {
    return true;
  }

  return false;
}

import type {
  TradePair,
  InstrumentOperations,
  PatternDetectionConfig,
  Operation,
} from '@/types/trading-pattern';

/**
 * Detect if a trade pair represents a FOMO (Fear Of Missing Out) buy pattern
 *
 * FOMO buy is detected when:
 * - Multiple purchases in short time period (impulse buying)
 * - Purchase made within fomoBuyImpulseWindowMinutes of previous buy
 *
 * @param pair - Trade pair to analyze
 * @param instrumentOps - All operations for this instrument
 * @param config - Pattern detection configuration
 * @param isBuyOperation - Function to check if operation is a buy
 * @returns True if FOMO buy pattern detected
 *
 * @example
 * ```typescript
 * const isFomo = isFOMOBuy(tradePair, instrumentOps, config, isBuyOperation);
 * if (isFomo) {
 *   console.log('Обнаружена импульсивная покупка (FOMO)');
 * }
 * ```
 */
export function isFOMOBuy(
  pair: TradePair,
  instrumentOps: InstrumentOperations,
  config: PatternDetectionConfig,
  isBuyOperation: (op: Operation) => boolean
): boolean {
  // Check if bought near recent highs or after rapid price increase
  // TODO: Implement with historical price data

  // For now, check if multiple buys in short period (impulse buying)
  const buys = instrumentOps.operations.filter((op) => isBuyOperation(op));
  const buyIndex = buys.findIndex((b) => b.id === pair.buyOperation.id);

  if (buyIndex > 0) {
    const prevBuy = buys[buyIndex - 1];
    const timeDiffMinutes =
      (new Date(pair.buyOperation.date).getTime() -
        new Date(prevBuy.date).getTime()) /
      (1000 * 60);

    if (timeDiffMinutes < config.fomoBuyImpulseWindowMinutes) {
      return true;
    }
  }

  return false;
}

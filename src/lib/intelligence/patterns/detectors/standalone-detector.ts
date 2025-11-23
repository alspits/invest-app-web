import type {
  InstrumentOperations,
  PatternDetectionConfig,
  TradingPattern,
  EmotionalTrigger,
  Operation,
} from '@/types/trading-pattern';

/**
 * Detect patterns that don't require sell operations (standalone patterns)
 *
 * Currently detects:
 * - Rapid buying (FOMO) without sells: Multiple buys within fomoBuyImpulseWindowMinutes
 *
 * @param accountId - Account ID
 * @param instrumentOps - All operations for this instrument
 * @param config - Pattern detection configuration
 * @param isBuyOperation - Function to check if operation is a buy
 * @param createTrigger - Function to create emotional trigger
 * @returns Array of detected standalone patterns
 *
 * @example
 * ```typescript
 * const patterns = await detectStandalonePatterns(
 *   accountId,
 *   instrumentOps,
 *   config,
 *   isBuyOperation,
 *   createTrigger
 * );
 * ```
 */
export async function detectStandalonePatterns(
  accountId: string,
  instrumentOps: InstrumentOperations,
  config: PatternDetectionConfig,
  isBuyOperation: (op: Operation) => boolean,
  createTrigger: (
    type: EmotionalTrigger['type'],
    severity: EmotionalTrigger['severity'],
    date: string,
    operationIds: string[]
  ) => EmotionalTrigger
): Promise<TradingPattern[]> {
  const patterns: TradingPattern[] = [];

  // Detect rapid buying (FOMO) without sells
  const buys = instrumentOps.operations.filter((op) => isBuyOperation(op));

  for (let i = 1; i < buys.length; i++) {
    const prevBuy = buys[i - 1];
    const currentBuy = buys[i];

    const timeDiffMinutes =
      (new Date(currentBuy.date).getTime() -
        new Date(prevBuy.date).getTime()) /
      (1000 * 60);

    if (timeDiffMinutes < config.fomoBuyImpulseWindowMinutes) {
      patterns.push({
        id: `fomo-${currentBuy.id}`,
        accountId,
        category: 'fomo_buy',
        operations: [currentBuy],
        detectedAt: new Date(),
        confidence: 70,
        metrics: {
          profitLoss: 0,
          profitLossAbsolute: 0,
          timeToComplete: 0,
          priceChangeAtEntry: 0,
          marketContext: 'sideways',
          volatility: 0,
        },
        triggers: [
          createTrigger('fomo', 'medium', currentBuy.date, [currentBuy.id]),
        ],
        ticker: instrumentOps.ticker,
        instrumentName: instrumentOps.name,
      });
    }
  }

  return patterns;
}

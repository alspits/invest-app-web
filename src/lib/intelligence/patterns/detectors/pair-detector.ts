import type {
  TradePair,
  InstrumentOperations,
  PatternDetectionConfig,
  TradingPattern,
  PatternCategory,
  PatternMetrics,
  EmotionalTrigger,
} from '@/types/trading-pattern';
import { isPanicSell } from './panic-detector';
import { isFOMOBuy } from './fomo-detector';
import { isStrategicTrade } from './strategic-detector';
import { isEmotionalTrade } from './emotional-detector';

/**
 * Analyze a trade pair and detect which pattern it matches
 *
 * Detects patterns in priority order:
 * 1. Panic Sell (highest priority)
 * 2. FOMO Buy
 * 3. Strategic Trade
 * 4. Emotional Trade
 *
 * @param accountId - Account ID
 * @param pair - Trade pair to analyze
 * @param instrumentOps - All operations for this instrument
 * @param config - Pattern detection configuration
 * @param createTrigger - Function to create emotional trigger
 * @returns Detected trading pattern or null if no pattern found
 */
export async function analyzeTradePair(
  accountId: string,
  pair: TradePair,
  instrumentOps: InstrumentOperations,
  config: PatternDetectionConfig,
  createTrigger: (
    type: EmotionalTrigger['type'],
    severity: EmotionalTrigger['severity'],
    date: string,
    operationIds: string[]
  ) => EmotionalTrigger,
  isBuyOperation: (op: any) => boolean
): Promise<TradingPattern | null> {
  const triggers: EmotionalTrigger[] = [];
  let category: PatternCategory = 'strategic';
  let confidence = 50;

  // Detect Panic Sell
  if (isPanicSell(pair, config)) {
    category = 'panic_sell';
    confidence = 80;
    triggers.push(
      createTrigger('panic', 'high', pair.sellOperation.date, [
        pair.sellOperation.id,
      ])
    );
  }
  // Detect FOMO Buy
  else if (isFOMOBuy(pair, instrumentOps, config, isBuyOperation)) {
    category = 'fomo_buy';
    confidence = 75;
    triggers.push(
      createTrigger('fomo', 'high', pair.buyOperation.date, [
        pair.buyOperation.id,
      ])
    );
  }
  // Detect Strategic (Take Profit)
  else if (isStrategicTrade(pair, config)) {
    category = 'strategic';
    confidence = 85;
  }
  // Detect Emotional Trading
  else if (isEmotionalTrade(pair, instrumentOps, config)) {
    category = 'emotional';
    confidence = 70;
    triggers.push(
      createTrigger('volatility', 'medium', pair.sellOperation.date, [
        pair.buyOperation.id,
        pair.sellOperation.id,
      ])
    );
  }

  // Calculate metrics
  const metrics: PatternMetrics = {
    profitLoss: pair.profitLossPercentage,
    profitLossAbsolute: pair.profitLoss,
    timeToComplete: pair.holdingPeriodDays,
    priceChangeAtEntry: 0, // TODO: Fetch historical prices
    priceChangeAtExit: 0, // TODO: Fetch historical prices
    marketContext: 'sideways', // TODO: Determine market context
    volatility: 0, // TODO: Calculate volatility
  };

  return {
    id: `${pair.buyOperation.id}-${pair.sellOperation.id}`,
    accountId,
    category,
    operations: [pair.buyOperation, pair.sellOperation],
    detectedAt: new Date(),
    confidence,
    metrics,
    triggers,
    ticker: instrumentOps.ticker,
    instrumentName: instrumentOps.name,
  };
}

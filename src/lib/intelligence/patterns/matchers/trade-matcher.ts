import { moneyValueToNumber } from '@/lib/tinkoff-api';
import type { Operation, TradePair } from '@/types/trading-pattern';

/**
 * Check if operation is a buy operation
 *
 * @param op - Operation to check
 * @returns True if operation is a buy
 */
export function isBuyOperation(op: Operation): boolean {
  return (
    op.type.toLowerCase().includes('buy') ||
    op.operationType?.toLowerCase().includes('buy') ||
    false
  );
}

/**
 * Check if operation is a sell operation
 *
 * @param op - Operation to check
 * @returns True if operation is a sell
 */
export function isSellOperation(op: Operation): boolean {
  return (
    op.type.toLowerCase().includes('sell') ||
    op.operationType?.toLowerCase().includes('sell') ||
    false
  );
}

/**
 * Match buy and sell operations into trade pairs using FIFO (First In First Out) method
 *
 * @param buys - Array of buy operations (sorted chronologically)
 * @param sells - Array of sell operations (sorted chronologically)
 * @returns Array of matched trade pairs with P&L calculations
 *
 * @example
 * ```typescript
 * const pairs = matchTradePairs(buyOps, sellOps);
 * // Returns: [{ buyOperation, sellOperation, profitLoss, profitLossPercentage, holdingPeriodDays }, ...]
 * ```
 */
export function matchTradePairs(
  buys: Operation[],
  sells: Operation[]
): TradePair[] {
  const pairs: TradePair[] = [];
  const remainingBuys = [...buys];
  const remainingSells = [...sells];

  for (const sell of remainingSells) {
    // Find oldest buy that hasn't been fully matched
    const buyIndex = remainingBuys.findIndex(
      (buy) => new Date(buy.date) < new Date(sell.date)
    );

    if (buyIndex !== -1) {
      const buy = remainingBuys[buyIndex];

      // Calculate P&L
      const buyPrice = buy.price ? moneyValueToNumber(buy.price) : 0;
      const sellPrice = sell.price ? moneyValueToNumber(sell.price) : 0;
      const profitLoss = (sellPrice - buyPrice) * sell.quantity;
      const profitLossPercentage =
        buyPrice > 0 ? ((sellPrice - buyPrice) / buyPrice) * 100 : 0;

      // Calculate holding period
      const holdingPeriodMs =
        new Date(sell.date).getTime() - new Date(buy.date).getTime();
      const holdingPeriodDays = holdingPeriodMs / (1000 * 60 * 60 * 24);

      pairs.push({
        buyOperation: buy,
        sellOperation: sell,
        profitLoss,
        profitLossPercentage,
        holdingPeriodDays,
      });

      // Remove matched buy
      remainingBuys.splice(buyIndex, 1);
    }
  }

  return pairs;
}

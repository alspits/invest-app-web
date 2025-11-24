/**
 * Cost & Tax Estimator Module
 * Estimates transaction costs and tax impact for rebalancing trades
 */

import type { TradeOrder, CostBreakdown, TaxEstimate } from './types';
import type { Position } from '@/types/portfolio';

// ========== Transaction Cost Estimation ==========

const TINKOFF_COMMISSION_RATE = 0.0003; // 0.03% for stocks (Investor tier)
const MIN_COMMISSION = 1; // Minimum 1 RUB per trade
const SPREAD_ESTIMATE_PERCENT = 0.001; // 0.1% average bid-ask spread
const MARKET_IMPACT_THRESHOLD = 1000000; // Orders >1M RUB have market impact

export function estimateTransactionCosts(orders: TradeOrder[]): CostBreakdown {
  const itemized = orders.map((order) => {
    const commission = Math.max(
      order.estimatedTotal * TINKOFF_COMMISSION_RATE,
      MIN_COMMISSION
    );

    const spread = order.estimatedTotal * SPREAD_ESTIMATE_PERCENT;

    // Market impact for large orders (simplified)
    const marketImpact =
      order.estimatedTotal > MARKET_IMPACT_THRESHOLD
        ? order.estimatedTotal * 0.0005
        : 0;

    return {
      ticker: order.ticker,
      commission,
      spread,
      marketImpact,
    };
  });

  const commission = itemized.reduce((sum, item) => sum + item.commission, 0);
  const spread = itemized.reduce((sum, item) => sum + item.spread, 0);
  const marketImpact = itemized.reduce((sum, item) => sum + item.marketImpact, 0);
  const totalCost = commission + spread + marketImpact;

  const totalOrderValue = orders.reduce((sum, o) => sum + o.estimatedTotal, 0);
  const costAsPercent = totalOrderValue > 0 ? (totalCost / totalOrderValue) * 100 : 0;

  return {
    commission,
    spread,
    marketImpact,
    totalCost,
    costAsPercent,
    itemized,
  };
}

// ========== Tax Impact Estimation ==========

const RUSSIA_NDFL_RATE = 0.13; // 13% income tax
const LONG_TERM_HOLDING_YEARS = 3; // Tax-free after 3 years in Russia

export function estimateTaxImpact(
  orders: TradeOrder[],
  positions: Position[]
): TaxEstimate {
  const sellOrders = orders.filter((o) => o.direction === 'SELL');

  let shortTermGains = 0;
  let longTermGains = 0;
  let unrealizedLosses = 0;
  const taxLossHarvestingOpportunities: string[] = [];

  sellOrders.forEach((order) => {
    const position = positions.find((p) => p.ticker === order.ticker);
    if (!position) return;

    // Correct formula: gain/loss = sales proceeds - cost basis
    // Cost basis = average price * quantity (without erroneous multiplier)
    const gainLoss =
      order.estimatedTotal - position.averagePrice * order.quantity;

    const holdingYears = calculateHoldingPeriod(position.purchaseDate);

    if (gainLoss < 0) {
      unrealizedLosses += Math.abs(gainLoss);
      taxLossHarvestingOpportunities.push(order.ticker);
    } else {
      if (holdingYears >= LONG_TERM_HOLDING_YEARS) {
        longTermGains += gainLoss; // Tax-free in Russia
      } else {
        shortTermGains += gainLoss;
      }
    }
  });

  // Tax liability: only short-term gains are taxed
  const taxableGains = Math.max(shortTermGains - unrealizedLosses, 0);
  const estimatedTaxLiability = taxableGains * RUSSIA_NDFL_RATE;

  return {
    shortTermGains,
    longTermGains,
    unrealizedLosses,
    estimatedTaxLiability,
    taxLossHarvestingOpportunities,
  };
}

function calculateHoldingPeriod(purchaseDate: Date | undefined): number {
  if (!purchaseDate) return 0;

  const now = new Date();
  const purchase = new Date(purchaseDate);
  const diffYears = (now.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24 * 365);

  return diffYears;
}

// ========== Cost-Aware Trade Filtering ==========

export function filterTradesByMaxCost(
  orders: TradeOrder[],
  maxAcceptableCost: number
): { filteredOrders: TradeOrder[]; totalCost: number } {
  const sortedOrders = [...orders].sort((a, b) => {
    // Prioritize high-impact, low-cost trades
    const costA = a.estimatedTotal * TINKOFF_COMMISSION_RATE;
    const costB = b.estimatedTotal * TINKOFF_COMMISSION_RATE;
    const impactA = a.estimatedTotal / costA;
    const impactB = b.estimatedTotal / costB;
    return impactB - impactA;
  });

  const filteredOrders: TradeOrder[] = [];
  let accumulatedCost = 0;

  for (const order of sortedOrders) {
    const orderCost = Math.max(
      order.estimatedTotal * TINKOFF_COMMISSION_RATE,
      MIN_COMMISSION
    );

    if (accumulatedCost + orderCost <= maxAcceptableCost) {
      filteredOrders.push(order);
      accumulatedCost += orderCost;
    }
  }

  return { filteredOrders, totalCost: accumulatedCost };
}

// ========== Tax-Optimized Trade Selection ==========

export function optimizeForTaxes(
  orders: TradeOrder[],
  positions: Position[]
): TradeOrder[] {
  const sellOrders = orders.filter((o) => o.direction === 'SELL');
  const buyOrders = orders.filter((o) => o.direction === 'BUY');

  // Prioritize selling positions with losses (tax-loss harvesting)
  const optimizedSellOrders = sellOrders.sort((a, b) => {
    const posA = positions.find((p) => p.ticker === a.ticker);
    const posB = positions.find((p) => p.ticker === b.ticker);

    if (!posA || !posB) return 0;

    const gainLossA = a.estimatedTotal - posA.averagePrice * a.quantity;
    const gainLossB = b.estimatedTotal - posB.averagePrice * b.quantity;

    // Prefer positions with losses
    if (gainLossA < 0 && gainLossB >= 0) return -1;
    if (gainLossA >= 0 && gainLossB < 0) return 1;

    // Then by holding period (prefer long-term)
    const holdingA = calculateHoldingPeriod(posA.purchaseDate);
    const holdingB = calculateHoldingPeriod(posB.purchaseDate);
    return holdingB - holdingA;
  });

  return [...optimizedSellOrders, ...buyOrders];
}

/**
 * Trade Order Generator Module
 * Generates specific buy/sell orders to rebalance portfolio to target allocation
 */

import type { Portfolio, Position } from '@/types/portfolio';
import type {
  TargetAllocation,
  TradeOrder,
  TradeDirection,
  CategoryDeviation,
} from './types';
import {
  classifySector,
  classifyGeography,
} from '@/lib/analytics/portfolio/classifiers';
import { calculateDeviations } from './deviation-analyzer';

// ========== Trade Order Generation ==========

export function generateTradeOrders(
  portfolio: Portfolio,
  targets: TargetAllocation,
  options?: {
    maxCost?: number;
    minTradeSize?: number;
  }
): TradeOrder[] {
  const minTradeSize = options?.minTradeSize || 1000; // Min 1000 RUB per trade
  const deviationAnalysis = calculateDeviations(portfolio, targets);

  const orders: TradeOrder[] = [];

  // Phase 1: Generate SELL orders for overweight positions
  const sellOrders = generateSellOrders(
    portfolio,
    deviationAnalysis.categoryDeviations,
    minTradeSize
  );
  orders.push(...sellOrders);

  // Phase 2: Generate BUY orders for underweight positions
  const totalSellValue = sellOrders.reduce((sum, o) => sum + o.estimatedTotal, 0);
  const buyOrders = generateBuyOrders(
    portfolio,
    deviationAnalysis.categoryDeviations,
    totalSellValue,
    minTradeSize
  );
  orders.push(...buyOrders);

  // Apply cost constraint if provided
  if (options?.maxCost) {
    return applyMaxCostConstraint(orders, options.maxCost);
  }

  return orders;
}

// ========== Sell Order Generation ==========

function generateSellOrders(
  portfolio: Portfolio,
  deviations: CategoryDeviation[],
  minTradeSize: number
): TradeOrder[] {
  const orders: TradeOrder[] = [];

  // Find overweight categories (need to SELL)
  const overweightDeviations = deviations.filter(
    (d) => d.recommendation === 'SELL' && Math.abs(d.deviationAmount) > minTradeSize
  );

  overweightDeviations.forEach((deviation) => {
    const relevantPositions = portfolio.positions.filter((pos) =>
      belongsToCategory(pos, deviation)
    );

    // Sort by liquidity (prefer liquid positions) and size (sell largest first)
    const sortedPositions = relevantPositions.sort((a, b) => {
      const liquidityA = estimateLiquidity(a);
      const liquidityB = estimateLiquidity(b);
      if (liquidityA !== liquidityB) return liquidityB - liquidityA;
      return b.currentValue - a.currentValue;
    });

    let remainingToSell = Math.abs(deviation.deviationAmount);

    sortedPositions.forEach((position) => {
      if (remainingToSell < minTradeSize) return;

      const sellAmount = Math.min(position.currentValue, remainingToSell);
      const quantity = Math.floor(sellAmount / position.averagePrice);

      if (quantity > 0) {
        orders.push({
          id: generateOrderId(),
          ticker: position.ticker,
          figi: position.figi,
          name: position.name,
          quantity,
          direction: 'SELL',
          estimatedPrice: position.averagePrice,
          estimatedTotal: quantity * position.averagePrice,
          reason: `Reduce ${deviation.dimension} overweight: ${deviation.category}`,
          category: deviation.category,
          priority: deviation.priority,
          liquidityScore: estimateLiquidity(position),
        });

        remainingToSell -= quantity * position.averagePrice;
      }
    });
  });

  return orders;
}

// ========== Buy Order Generation ==========

function generateBuyOrders(
  portfolio: Portfolio,
  deviations: CategoryDeviation[],
  availableCash: number,
  minTradeSize: number
): TradeOrder[] {
  const orders: TradeOrder[] = [];

  // Find underweight categories (need to BUY)
  const underweightDeviations = deviations
    .filter(
      (d) => d.recommendation === 'BUY' && Math.abs(d.deviationAmount) > minTradeSize
    )
    .sort((a, b) => a.priority - b.priority);

  let remainingCash = availableCash;

  underweightDeviations.forEach((deviation) => {
    if (remainingCash < minTradeSize) return;

    const buyAmount = Math.min(Math.abs(deviation.deviationAmount), remainingCash);

    // Find suitable tickers to buy for this category
    const candidateTickers = findCandidateTickers(portfolio, deviation);

    candidateTickers.forEach((ticker) => {
      if (remainingCash < minTradeSize) return;

      const estimatedPrice = ticker.estimatedPrice;
      const quantity = Math.floor(buyAmount / estimatedPrice);

      if (quantity > 0 && quantity * estimatedPrice >= minTradeSize) {
        orders.push({
          id: generateOrderId(),
          ticker: ticker.ticker,
          figi: ticker.figi,
          name: ticker.name,
          quantity,
          direction: 'BUY',
          estimatedPrice,
          estimatedTotal: quantity * estimatedPrice,
          reason: `Increase ${deviation.dimension} allocation: ${deviation.category}`,
          category: deviation.category,
          priority: deviation.priority,
          liquidityScore: ticker.liquidityScore,
        });

        remainingCash -= quantity * estimatedPrice;
      }
    });
  });

  return orders;
}

// ========== Helper Functions ==========

function belongsToCategory(position: Position, deviation: CategoryDeviation): boolean {
  switch (deviation.dimension) {
    case 'sector':
      return classifySector(position.ticker) === deviation.category;
    case 'geography':
      return classifyGeography(position.ticker) === deviation.category;
    case 'assetType':
      return classifyAssetType(position.instrumentType) === deviation.category;
    default:
      return false;
  }
}

function classifyAssetType(instrumentType: string): string {
  const type = instrumentType.toLowerCase();
  if (type.includes('stock') || type.includes('share')) return 'stocks';
  if (type.includes('bond')) return 'bonds';
  if (type.includes('etf')) return 'etf';
  return 'alternatives';
}

function estimateLiquidity(position: Position): number {
  // Simple liquidity heuristic: larger positions are more liquid
  // In real implementation, use trading volume data
  if (position.currentValue > 1000000) return 90;
  if (position.currentValue > 100000) return 70;
  if (position.currentValue > 10000) return 50;
  return 30;
}

function findCandidateTickers(
  portfolio: Portfolio,
  deviation: CategoryDeviation
): Array<{
  ticker: string;
  figi?: string;
  name: string;
  estimatedPrice: number;
  liquidityScore: number;
}> {
  // Find existing positions in this category
  const existing = portfolio.positions
    .filter((pos) => belongsToCategory(pos, deviation))
    .map((pos) => ({
      ticker: pos.ticker,
      figi: pos.figi,
      name: pos.name,
      estimatedPrice: pos.averagePrice,
      liquidityScore: estimateLiquidity(pos),
    }));

  // If we have existing positions, prefer those (DCA strategy)
  if (existing.length > 0) {
    return existing.sort((a, b) => b.liquidityScore - a.liquidityScore);
  }

  // TODO: In real implementation, fetch recommended tickers from market data
  // For now, return empty (will need user to specify tickers)
  return [];
}

function generateOrderId(): string {
  return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ========== Order Optimization ==========

export function optimizeTradeSequence(orders: TradeOrder[]): TradeOrder[] {
  return [...orders].sort((a, b) => {
    // Sell orders first (generate cash)
    if (a.direction !== b.direction) {
      return a.direction === 'SELL' ? -1 : 1;
    }

    // Then by priority
    if (a.priority !== b.priority) return a.priority - b.priority;

    // Then by estimated impact (larger orders first)
    return b.estimatedTotal - a.estimatedTotal;
  });
}

function applyMaxCostConstraint(orders: TradeOrder[], maxCost: number): TradeOrder[] {
  // Simplified: assume cost is 0.1% per trade
  const COMMISSION_RATE = 0.001;

  const optimized = optimizeTradeSequence(orders);
  const result: TradeOrder[] = [];
  let totalCost = 0;

  for (const order of optimized) {
    const estimatedCost = order.estimatedTotal * COMMISSION_RATE;
    if (totalCost + estimatedCost <= maxCost) {
      result.push(order);
      totalCost += estimatedCost;
    }
  }

  return result;
}

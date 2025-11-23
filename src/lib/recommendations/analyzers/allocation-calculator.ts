/**
 * Target Allocation Calculator
 *
 * Calculates target allocations for portfolio rebalancing based on
 * moderate risk profile and generates rebalance recommendations.
 */

import { PortfolioResponse } from '../../tinkoff-api';
import { TargetAllocation } from '../types';
import { moneyValueToNumber } from '../converters';

/**
 * Generate target allocations for rebalancing
 *
 * Target allocation strategy (moderate risk profile):
 * - Stocks: 60% (growth-focused)
 * - Bonds: 25% (stability)
 * - ETF: 15% (diversification)
 * - Futures: 0% (minimize speculation)
 *
 * Only returns allocations that differ from target by more than 5%.
 *
 * @param portfolio - Portfolio data from Tinkoff API
 * @returns Array of target allocations requiring rebalancing
 */
export function generateTargetAllocations(
  portfolio: PortfolioResponse
): TargetAllocation[] {
  // Calculate current allocations
  const totalValue =
    moneyValueToNumber(portfolio.totalAmountShares) +
    moneyValueToNumber(portfolio.totalAmountBonds) +
    moneyValueToNumber(portfolio.totalAmountEtf) +
    moneyValueToNumber(portfolio.totalAmountFutures);

  if (totalValue === 0) {
    return [];
  }

  const currentAllocations = {
    shares: (moneyValueToNumber(portfolio.totalAmountShares) / totalValue) * 100,
    bonds: (moneyValueToNumber(portfolio.totalAmountBonds) / totalValue) * 100,
    etf: (moneyValueToNumber(portfolio.totalAmountEtf) / totalValue) * 100,
    futures: (moneyValueToNumber(portfolio.totalAmountFutures) / totalValue) * 100,
  };

  // Define target allocations (moderate risk profile)
  const targetAllocations = {
    shares: 60,
    bonds: 25,
    etf: 15,
    futures: 0, // Minimize speculative positions
  };

  // Calculate differences and rebalance amounts
  const targetAllocationsList: TargetAllocation[] = [
    {
      instrumentType: 'Акции',
      currentPercentage: currentAllocations.shares,
      targetPercentage: targetAllocations.shares,
      difference: targetAllocations.shares - currentAllocations.shares,
      rebalanceAmount: ((targetAllocations.shares - currentAllocations.shares) / 100) * totalValue,
    },
    {
      instrumentType: 'Облигации',
      currentPercentage: currentAllocations.bonds,
      targetPercentage: targetAllocations.bonds,
      difference: targetAllocations.bonds - currentAllocations.bonds,
      rebalanceAmount: ((targetAllocations.bonds - currentAllocations.bonds) / 100) * totalValue,
    },
    {
      instrumentType: 'ETF',
      currentPercentage: currentAllocations.etf,
      targetPercentage: targetAllocations.etf,
      difference: targetAllocations.etf - currentAllocations.etf,
      rebalanceAmount: ((targetAllocations.etf - currentAllocations.etf) / 100) * totalValue,
    },
  ];

  // Only include futures if currently held
  if (currentAllocations.futures > 0) {
    targetAllocationsList.push({
      instrumentType: 'Фьючерсы',
      currentPercentage: currentAllocations.futures,
      targetPercentage: targetAllocations.futures,
      difference: targetAllocations.futures - currentAllocations.futures,
      rebalanceAmount:
        ((targetAllocations.futures - currentAllocations.futures) / 100) * totalValue,
    });
  }

  // Filter out allocations that are close to target (within 5%)
  return targetAllocationsList.filter((allocation) => Math.abs(allocation.difference) > 5);
}

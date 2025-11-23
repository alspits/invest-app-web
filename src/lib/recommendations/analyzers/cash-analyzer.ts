/**
 * Cash Allocation Analyzer
 *
 * Analyzes cash allocation in portfolio to identify excessive or insufficient
 * cash holdings and suggest optimal investment amounts.
 */

import { PortfolioResponse } from '../../tinkoff-api';
import { CashAnalysis } from '../types';
import { moneyValueToNumber } from '../converters';

/**
 * Analyze cash allocation in portfolio
 *
 * Evaluates:
 * - Total cash amount and percentage
 * - Whether cash allocation is excessive (>10%)
 * - Suggested investment amount for excess cash
 *
 * @param portfolio - Portfolio data from Tinkoff API
 * @returns Cash allocation analysis
 */
export function analyzeCashAllocation(portfolio: PortfolioResponse): CashAnalysis {
  // Get total cash from currencies
  const totalCash = moneyValueToNumber(portfolio.totalAmountCurrencies);
  const currency = portfolio.totalAmountCurrencies.currency;

  // Calculate total portfolio value
  const totalValue =
    moneyValueToNumber(portfolio.totalAmountShares) +
    moneyValueToNumber(portfolio.totalAmountBonds) +
    moneyValueToNumber(portfolio.totalAmountEtf) +
    moneyValueToNumber(portfolio.totalAmountCurrencies) +
    moneyValueToNumber(portfolio.totalAmountFutures);

  // Calculate cash percentage
  const cashPercentage = totalValue > 0 ? (totalCash / totalValue) * 100 : 0;

  // Cash is excessive if > 10% of portfolio
  const isExcessive = cashPercentage > 10;

  // Suggest investing 70% of excess cash (keeping 30% as emergency buffer)
  let suggestedInvestmentAmount: number | undefined;
  if (isExcessive) {
    const excessCash = totalCash - totalValue * 0.1; // Amount above 10%
    suggestedInvestmentAmount = excessCash * 0.7;
  }

  return {
    totalCash,
    cashPercentage,
    currency,
    isExcessive,
    suggestedInvestmentAmount,
  };
}

/**
 * Concentration Risk Analyzer
 *
 * Analyzes portfolio concentration risk by examining position sizes,
 * calculating Herfindahl-Hirschman Index, and identifying high-risk concentrations.
 */

import { PortfolioResponse } from '../../tinkoff-api';
import { ConcentrationRisk } from '../types';
import { moneyValueToNumber, quotationToNumber } from '../converters';

/**
 * Analyze concentration risk in portfolio
 *
 * Evaluates:
 * - Top position percentage
 * - Top 3 and top 5 concentration levels
 * - Herfindahl-Hirschman Index (HHI)
 * - Overall risk assessment
 *
 * @param portfolio - Portfolio data from Tinkoff API
 * @returns Concentration risk analysis
 */
export function analyzeConcentrationRisk(portfolio: PortfolioResponse): ConcentrationRisk {
  const positions = portfolio.positions;

  // Calculate total portfolio value
  const totalValue = positions.reduce((sum, pos) => {
    const currentPrice = pos.currentPrice ? moneyValueToNumber(pos.currentPrice) : 0;
    const quantity = quotationToNumber(pos.quantity);
    return sum + currentPrice * quantity;
  }, 0);

  // Calculate position values and percentages
  const positionsWithPercentage = positions
    .map((pos) => {
      const currentPrice = pos.currentPrice ? moneyValueToNumber(pos.currentPrice) : 0;
      const quantity = quotationToNumber(pos.quantity);
      const value = currentPrice * quantity;
      const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;

      return {
        ticker: pos.ticker || pos.figi,
        name: pos.name || pos.figi,
        value,
        percentage,
      };
    })
    .filter((pos) => pos.value > 0)
    .sort((a, b) => b.percentage - a.percentage);

  // Get top position
  const topPosition = positionsWithPercentage[0] || {
    ticker: 'N/A',
    name: 'N/A',
    percentage: 0,
  };

  // Calculate top 3 and top 5 concentration
  const top3Concentration = positionsWithPercentage
    .slice(0, 3)
    .reduce((sum, pos) => sum + pos.percentage, 0);

  const top5Concentration = positionsWithPercentage
    .slice(0, 5)
    .reduce((sum, pos) => sum + pos.percentage, 0);

  // Calculate Herfindahl-Hirschman Index (HHI)
  const herfindahlIndex = positionsWithPercentage.reduce((sum, pos) => {
    const weight = pos.percentage / 100;
    return sum + weight * weight;
  }, 0);

  // Determine if risk is high
  // High risk if: top position > 25% OR top 3 > 60% OR HHI > 0.25
  const isHighRisk =
    topPosition.percentage > 25 || top3Concentration > 60 || herfindahlIndex > 0.25;

  return {
    topPosition,
    top3Concentration,
    top5Concentration,
    herfindahlIndex,
    isHighRisk,
  };
}

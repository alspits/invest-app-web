/**
 * Risk Analysis & Volatility Calculations
 * Calculates portfolio volatility and assesses risk alignment
 */

import { RiskProfile, getRiskProfileConfig } from './risk-profiles';

export interface PortfolioHolding {
  ticker: string;
  currentPrice: number;
  quantity: number;
  totalValue: number;
  priceHistory?: number[]; // 30-day price history
}

export interface RiskAssessment {
  profile: RiskProfile;
  currentVolatility: number;
  maxVolatility: number;
  alignment: 'aligned' | 'too_risky' | 'too_conservative';
  confidence: number; // 0-100
  recommendation: string;
}

/**
 * Calculate standard deviation for a dataset
 */
function calculateStdDev(values: number[]): number {
  if (values.length < 2) return 0;

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
  // Use sample variance (n-1) instead of population variance
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / (values.length - 1);

  return Math.sqrt(variance);
}

/**
 * Calculate daily returns from price history
 */
function calculateDailyReturns(prices: number[]): number[] {
  const returns: number[] = [];

  for (let i = 1; i < prices.length; i++) {
    // Guard against division by zero
    if (prices[i - 1] === 0) continue;
    const dailyReturn = (prices[i] - prices[i - 1]) / prices[i - 1];
    returns.push(dailyReturn);
  }

  return returns;
}

/**
 * Calculate volatility for a single holding (30-day rolling)
 */
function calculateHoldingVolatility(priceHistory: number[]): number {
  if (!priceHistory || priceHistory.length < 2) {
    return 0.20; // Default 20% volatility if no history
  }

  const dailyReturns = calculateDailyReturns(priceHistory);
  const stdDev = calculateStdDev(dailyReturns);

  // Annualize volatility (daily stdDev * sqrt(252 trading days))
  return stdDev * Math.sqrt(252);
}

/**
 * Calculate weighted portfolio volatility
 * Uses position weighting to compute overall portfolio risk
 */
export function calculatePortfolioVolatility(holdings: PortfolioHolding[]): number {
  if (holdings.length === 0) return 0;

  const totalValue = holdings.reduce((sum, h) => sum + h.totalValue, 0);

  // Guard against division by zero
  if (totalValue <= 0) return 0;

  // Calculate weighted volatilities
  const weightedVolatilities = holdings.map((holding) => {
    const weight = holding.totalValue / totalValue;
    const volatility = calculateHoldingVolatility(holding.priceHistory || []);

    return weight * volatility;
  });

  // Sum weighted volatilities (simplified - doesn't account for correlations)
  const portfolioVol = weightedVolatilities.reduce((sum, vol) => sum + vol, 0);

  return Math.min(portfolioVol, 1.0); // Cap at 100%
}

/**
 * Assess if current portfolio volatility aligns with user's risk profile
 */
export function assessRiskAlignment(
  profile: RiskProfile,
  currentVolatility: number
): RiskAssessment {
  const config = getRiskProfileConfig(profile);
  const maxVol = config.maxVolatility;

  // Guard against division by zero
  if (maxVol <= 0) {
    throw new Error(`Invalid maxVolatility for profile ${profile}: ${maxVol}. Must be > 0`);
  }

  // Calculate deviation from max volatility
  const deviation = currentVolatility - maxVol;
  const deviationPct = Math.abs(deviation) / maxVol;

  // Determine alignment status
  let alignment: RiskAssessment['alignment'];
  let confidence: number;
  let recommendation: string;

  if (Math.abs(deviation) <= 0.03) {
    // Within 3% tolerance
    alignment = 'aligned';
    confidence = 95 - deviationPct * 100;
    recommendation = `Портфель соответствует вашему профилю риска (${(currentVolatility * 100).toFixed(1)}%)`;
  } else if (deviation > 0) {
    // Too risky
    alignment = 'too_risky';
    confidence = 85 - deviationPct * 50;
    const excess = ((deviation / maxVol) * 100).toFixed(0);
    recommendation = `Риск портфеля выше на ${excess}%. Рекомендуется снизить волатильность`;
  } else {
    // Too conservative
    alignment = 'too_conservative';
    confidence = 75 - deviationPct * 40;
    const deficit = ((Math.abs(deviation) / maxVol) * 100).toFixed(0);
    recommendation = `Портфель слишком консервативен (на ${deficit}% ниже целевого риска)`;
  }

  return {
    profile,
    currentVolatility,
    maxVolatility: maxVol,
    alignment,
    confidence: Math.max(0, Math.min(100, Math.round(confidence))),
    recommendation,
  };
}

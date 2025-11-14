/**
 * Portfolio Analytics Library
 *
 * Provides comprehensive analytics and metrics calculation for investment portfolios
 */

// ============================================================================
// Interfaces
// ============================================================================

export interface PortfolioSnapshot {
  timestamp: Date;
  totalValue: number;
  positions: Position[];
  currency: string;
}

export interface Position {
  symbol: string;
  quantity: number;
  currentPrice: number;
  value: number;
  investedValue?: number;
}

export interface PortfolioMetrics {
  totalValue: number;
  investedValue: number;
  roi: number; // Return on Investment as percentage
  roiAbsolute: number; // Absolute return in currency
  volatility: number; // Annualized volatility
  sharpeRatio: number; // Risk-adjusted return metric
  diversificationScore: number; // 0-1 score using Herfindahl index
  dayChange: number; // Percentage change from previous day
  dayChangeAbsolute: number; // Absolute change from previous day
}

export interface PositionWithWeight extends Position {
  weight: number; // Percentage of total portfolio value
}

// ============================================================================
// Core Calculation Functions
// ============================================================================

/**
 * Calculate Return on Investment (ROI)
 *
 * @param currentValue - Current portfolio value
 * @param investedValue - Total invested amount
 * @returns ROI as a percentage (e.g., 15.5 for 15.5%)
 */
export function calculateROI(currentValue: number, investedValue: number): number {
  // Handle edge cases
  if (investedValue === 0 || !isFinite(investedValue)) {
    return 0;
  }

  if (!isFinite(currentValue)) {
    return 0;
  }

  const roi = ((currentValue - investedValue) / investedValue) * 100;

  return isFinite(roi) ? roi : 0;
}

/**
 * Calculate annualized volatility (standard deviation of returns)
 *
 * @param snapshots - Array of historical portfolio snapshots (ordered chronologically)
 * @returns Annualized volatility as a percentage
 */
export function calculateVolatility(snapshots: PortfolioSnapshot[]): number {
  // Handle edge cases
  if (!snapshots || snapshots.length < 2) {
    return 0;
  }

  // Calculate daily returns
  const dailyReturns: number[] = [];

  for (let i = 1; i < snapshots.length; i++) {
    const previousValue = snapshots[i - 1].totalValue;
    const currentValue = snapshots[i].totalValue;

    // Skip if values are invalid
    if (previousValue === 0 || !isFinite(previousValue) || !isFinite(currentValue)) {
      continue;
    }

    const dailyReturn = (currentValue - previousValue) / previousValue;

    if (isFinite(dailyReturn)) {
      dailyReturns.push(dailyReturn);
    }
  }

  // Need at least 2 returns to calculate standard deviation
  if (dailyReturns.length < 2) {
    return 0;
  }

  // Calculate mean return
  const meanReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;

  // Calculate variance
  const variance = dailyReturns.reduce((sum, r) => {
    const diff = r - meanReturn;
    return sum + (diff * diff);
  }, 0) / (dailyReturns.length - 1); // Using sample variance (n-1)

  // Calculate standard deviation
  const stdDev = Math.sqrt(variance);

  // Annualize the volatility (252 trading days per year)
  const annualizedVolatility = stdDev * Math.sqrt(252) * 100;

  return isFinite(annualizedVolatility) ? annualizedVolatility : 0;
}

/**
 * Calculate Sharpe Ratio (risk-adjusted return)
 *
 * @param snapshots - Array of historical portfolio snapshots (ordered chronologically)
 * @param riskFreeRate - Annual risk-free rate as decimal (default: 0.05 for 5%)
 * @returns Sharpe ratio (higher is better)
 */
export function calculateSharpeRatio(
  snapshots: PortfolioSnapshot[],
  riskFreeRate: number = 0.05
): number {
  // Handle edge cases
  if (!snapshots || snapshots.length < 2) {
    return 0;
  }

  // Calculate daily returns
  const dailyReturns: number[] = [];

  for (let i = 1; i < snapshots.length; i++) {
    const previousValue = snapshots[i - 1].totalValue;
    const currentValue = snapshots[i].totalValue;

    if (previousValue === 0 || !isFinite(previousValue) || !isFinite(currentValue)) {
      continue;
    }

    const dailyReturn = (currentValue - previousValue) / previousValue;

    if (isFinite(dailyReturn)) {
      dailyReturns.push(dailyReturn);
    }
  }

  if (dailyReturns.length < 2) {
    return 0;
  }

  // Calculate mean daily return
  const meanDailyReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;

  // Calculate daily standard deviation
  const variance = dailyReturns.reduce((sum, r) => {
    const diff = r - meanDailyReturn;
    return sum + (diff * diff);
  }, 0) / (dailyReturns.length - 1);

  const dailyStdDev = Math.sqrt(variance);

  // Handle zero volatility
  if (dailyStdDev === 0 || !isFinite(dailyStdDev)) {
    return 0;
  }

  // Convert annual risk-free rate to daily
  const dailyRiskFreeRate = riskFreeRate / 252;

  // Calculate Sharpe ratio
  const sharpeRatio = (meanDailyReturn - dailyRiskFreeRate) / dailyStdDev;

  // Annualize the Sharpe ratio
  const annualizedSharpeRatio = sharpeRatio * Math.sqrt(252);

  return isFinite(annualizedSharpeRatio) ? annualizedSharpeRatio : 0;
}

/**
 * Calculate diversification score using Herfindahl-Hirschman Index (HHI)
 *
 * @param positions - Array of portfolio positions
 * @returns Diversification score from 0 (concentrated) to 1 (well-diversified)
 */
export function calculateDiversificationScore(positions: Position[]): number {
  // Handle edge cases
  if (!positions || positions.length === 0) {
    return 0;
  }

  if (positions.length === 1) {
    return 0; // Single position is not diversified
  }

  // Calculate total portfolio value
  const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0);

  // Handle zero or invalid total value
  if (totalValue === 0 || !isFinite(totalValue)) {
    return 0;
  }

  // Calculate HHI (sum of squared weights)
  const hhi = positions.reduce((sum, pos) => {
    const weight = pos.value / totalValue;
    return sum + (weight * weight);
  }, 0);

  // Handle invalid HHI
  if (!isFinite(hhi)) {
    return 0;
  }

  // Convert HHI to diversification score
  // HHI ranges from 1/n (perfectly diversified) to 1 (concentrated in one position)
  // We normalize to 0-1 where 1 is perfectly diversified
  const n = positions.length;
  const minHHI = 1 / n; // Perfect diversification
  const maxHHI = 1; // Complete concentration

  // Normalize: convert HHI to a score where higher is more diversified
  const diversificationScore = (maxHHI - hhi) / (maxHHI - minHHI);

  // Clamp to 0-1 range
  return Math.max(0, Math.min(1, diversificationScore));
}

/**
 * Get positions with their portfolio weights
 *
 * @param positions - Array of portfolio positions
 * @returns Array of positions with weight property added
 */
export function getPositionWeights(positions: Position[]): PositionWithWeight[] {
  // Handle edge cases
  if (!positions || positions.length === 0) {
    return [];
  }

  // Calculate total portfolio value
  const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0);

  // Handle zero or invalid total value
  if (totalValue === 0 || !isFinite(totalValue)) {
    return positions.map(pos => ({
      ...pos,
      weight: 0
    }));
  }

  // Calculate and add weights
  return positions.map(pos => {
    const weight = (pos.value / totalValue) * 100;
    return {
      ...pos,
      weight: isFinite(weight) ? weight : 0
    };
  });
}

/**
 * Calculate comprehensive portfolio metrics
 *
 * @param snapshot - Current portfolio snapshot
 * @param historicalSnapshots - Array of historical snapshots including current (ordered chronologically)
 * @returns Complete portfolio metrics
 */
export function calculateMetrics(
  snapshot: PortfolioSnapshot,
  historicalSnapshots: PortfolioSnapshot[]
): PortfolioMetrics {
  // Calculate total invested value from positions
  const investedValue = snapshot.positions.reduce((sum, pos) => {
    return sum + (pos.investedValue ?? pos.value);
  }, 0);

  // Calculate ROI
  const roi = calculateROI(snapshot.totalValue, investedValue);
  const roiAbsolute = snapshot.totalValue - investedValue;

  // Calculate volatility
  const volatility = calculateVolatility(historicalSnapshots);

  // Calculate Sharpe ratio
  const sharpeRatio = calculateSharpeRatio(historicalSnapshots);

  // Calculate diversification score
  const diversificationScore = calculateDiversificationScore(snapshot.positions);

  // Calculate day change
  let dayChange = 0;
  let dayChangeAbsolute = 0;

  if (historicalSnapshots.length >= 2) {
    // Find the previous day's snapshot
    const previousSnapshot = historicalSnapshots[historicalSnapshots.length - 2];
    const previousValue = previousSnapshot.totalValue;

    if (previousValue !== 0 && isFinite(previousValue)) {
      dayChangeAbsolute = snapshot.totalValue - previousValue;
      dayChange = (dayChangeAbsolute / previousValue) * 100;

      if (!isFinite(dayChange)) {
        dayChange = 0;
      }
      if (!isFinite(dayChangeAbsolute)) {
        dayChangeAbsolute = 0;
      }
    }
  }

  return {
    totalValue: snapshot.totalValue,
    investedValue,
    roi,
    roiAbsolute,
    volatility,
    sharpeRatio,
    diversificationScore,
    dayChange,
    dayChangeAbsolute
  };
}

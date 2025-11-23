/**
 * Concentration Calculators
 *
 * Calculate portfolio concentration metrics including HHI and risk levels
 */

/**
 * Calculate Herfindahl-Hirschman Index (HHI) for concentration
 *
 * HHI measures market concentration. Higher values indicate more concentration.
 * Range: 0 (perfectly diversified) to 1 (fully concentrated)
 *
 * @param weights - Array of portfolio weights (in percentage)
 * @returns HHI value between 0 and 1
 */
export function calculateHHI(weights: number[]): number {
  return weights.reduce((sum, weight) => {
    const decimalWeight = weight / 100;
    return sum + decimalWeight * decimalWeight;
  }, 0);
}

/**
 * Calculate concentration risk level based on HHI
 *
 * @param hhi - Herfindahl-Hirschman Index value
 * @returns Risk level: 'low' (well diversified), 'medium' (moderately concentrated), 'high' (very concentrated)
 */
export function calculateConcentrationRisk(
  hhi: number
): 'low' | 'medium' | 'high' {
  if (hhi >= 0.25) return 'high'; // Very concentrated
  if (hhi >= 0.15) return 'medium'; // Moderately concentrated
  return 'low'; // Well diversified
}

/**
 * Tilt Calculator
 *
 * Calculate factor tilt significance levels
 */

/**
 * Calculate tilt significance level
 *
 * Tilt represents deviation from benchmark allocation.
 * Higher absolute values indicate stronger factor tilts.
 *
 * @param tilt - Tilt value (deviation from benchmark in percentage)
 * @returns Significance level: 'high' (≥15%), 'medium' (≥5%), 'low' (<5%)
 */
export function calculateTiltSignificance(
  tilt: number
): 'high' | 'medium' | 'low' {
  const absTilt = Math.abs(tilt);

  if (absTilt >= 15) return 'high';
  if (absTilt >= 5) return 'medium';
  return 'low';
}

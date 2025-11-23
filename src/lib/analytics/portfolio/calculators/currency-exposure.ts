/**
 * Currency Exposure Calculator
 *
 * Calculate portfolio currency distribution
 */

import type {
  EnrichedPosition,
  CurrencyExposure,
  CurrencyType,
} from '@/types/analytics';

/**
 * Calculate currency exposure for enriched portfolio positions
 *
 * Groups positions by currency, calculates weights.
 * Returns array sorted by weight (descending).
 *
 * @param positions - Array of enriched positions with currency classifications
 * @returns Array of currency exposures with weights and counts
 */
export function calculateCurrencyExposure(
  positions: EnrichedPosition[]
): CurrencyExposure[] {
  // Group by currency
  const currencyGroups = new Map<
    CurrencyType,
    {
      value: number;
      count: number;
    }
  >();

  for (const pos of positions) {
    const existing = currencyGroups.get(pos.currency) || {
      value: 0,
      count: 0,
    };
    currencyGroups.set(pos.currency, {
      value: existing.value + pos.value,
      count: existing.count + 1,
    });
  }

  // Calculate total value
  const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0);

  // Convert to array with weights
  const exposures: CurrencyExposure[] = [];

  for (const [currency, data] of currencyGroups.entries()) {
    const weight = totalValue > 0 ? (data.value / totalValue) * 100 : 0;

    exposures.push({
      currency,
      value: data.value,
      weight,
      count: data.count,
    });
  }

  // Sort by weight (descending)
  return exposures.sort((a, b) => b.weight - a.weight);
}

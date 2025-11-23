/**
 * Geography Exposure Calculator
 *
 * Calculate portfolio geographic allocation and compare to benchmark
 */

import type {
  EnrichedPosition,
  GeographyExposure,
  GeographyType,
} from '@/types/analytics';
import { MOEX_BENCHMARK } from '../data/moex-benchmark';

/**
 * Calculate geography exposure for enriched portfolio positions
 *
 * Groups positions by geography, calculates weights, and compares to MOEX benchmark.
 * Returns array sorted by weight (descending).
 *
 * @param positions - Array of enriched positions with geography classifications
 * @returns Array of geography exposures with weights, counts, and benchmark deviations
 */
export function calculateGeographyExposure(
  positions: EnrichedPosition[]
): GeographyExposure[] {
  // Group by geography
  const geographyGroups = new Map<
    GeographyType,
    {
      value: number;
      count: number;
    }
  >();

  for (const pos of positions) {
    const existing = geographyGroups.get(pos.geography) || {
      value: 0,
      count: 0,
    };
    geographyGroups.set(pos.geography, {
      value: existing.value + pos.value,
      count: existing.count + 1,
    });
  }

  // Calculate total value
  const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0);

  // Convert to array with weights
  const exposures: GeographyExposure[] = [];

  for (const [geography, data] of geographyGroups.entries()) {
    const weight = totalValue > 0 ? (data.value / totalValue) * 100 : 0;
    const benchmarkWeight = MOEX_BENCHMARK.geographyWeights[geography] || 0;
    const deviation = weight - benchmarkWeight;

    exposures.push({
      geography,
      value: data.value,
      weight,
      count: data.count,
      benchmarkWeight,
      deviation,
    });
  }

  // Sort by weight (descending)
  return exposures.sort((a, b) => b.weight - a.weight);
}

/**
 * Sector Exposure Calculator
 *
 * Calculate portfolio sector allocation and compare to benchmark
 */

import type { EnrichedPosition, SectorExposure, SectorType } from '@/types/analytics';
import { MOEX_BENCHMARK } from '../data/moex-benchmark';

/**
 * Calculate sector exposure for enriched portfolio positions
 *
 * Groups positions by sector, calculates weights, and compares to MOEX benchmark.
 * Returns array sorted by weight (descending).
 *
 * @param positions - Array of enriched positions with sector classifications
 * @returns Array of sector exposures with weights, counts, and benchmark deviations
 */
export function calculateSectorExposure(
  positions: EnrichedPosition[]
): SectorExposure[] {
  // Group by sector
  const sectorGroups = new Map<
    SectorType,
    {
      value: number;
      count: number;
    }
  >();

  for (const pos of positions) {
    const existing = sectorGroups.get(pos.sector) || { value: 0, count: 0 };
    sectorGroups.set(pos.sector, {
      value: existing.value + pos.value,
      count: existing.count + 1,
    });
  }

  // Calculate total value
  const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0);

  // Convert to array with weights
  const exposures: SectorExposure[] = [];

  for (const [sector, data] of sectorGroups.entries()) {
    const weight = totalValue > 0 ? (data.value / totalValue) * 100 : 0;
    const benchmarkWeight = MOEX_BENCHMARK.sectorWeights[sector] || 0;
    const deviation = weight - benchmarkWeight;

    exposures.push({
      sector,
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

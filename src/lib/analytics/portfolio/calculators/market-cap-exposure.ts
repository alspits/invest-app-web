/**
 * Market Cap Exposure Calculator
 *
 * Calculate portfolio market cap distribution
 */

import type {
  EnrichedPosition,
  MarketCapExposure,
  MarketCapType,
} from '@/types/analytics';

/**
 * Calculate market cap exposure for enriched portfolio positions
 *
 * Groups positions by market cap size (large/mid/small), calculates weights.
 * Returns array sorted by predefined order (large → mid → small).
 *
 * @param positions - Array of enriched positions with market cap classifications
 * @returns Array of market cap exposures with weights and counts
 */
export function calculateMarketCapExposure(
  positions: EnrichedPosition[]
): MarketCapExposure[] {
  // Group by market cap
  const marketCapGroups = new Map<
    MarketCapType,
    {
      value: number;
      count: number;
    }
  >();

  for (const pos of positions) {
    const existing = marketCapGroups.get(pos.marketCap) || {
      value: 0,
      count: 0,
    };
    marketCapGroups.set(pos.marketCap, {
      value: existing.value + pos.value,
      count: existing.count + 1,
    });
  }

  // Calculate total value
  const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0);

  // Convert to array with weights
  const exposures: MarketCapExposure[] = [];

  for (const [marketCap, data] of marketCapGroups.entries()) {
    const weight = totalValue > 0 ? (data.value / totalValue) * 100 : 0;

    exposures.push({
      marketCap,
      value: data.value,
      weight,
      count: data.count,
    });
  }

  // Sort by predefined order
  const order: MarketCapType[] = ['large', 'mid', 'small'];
  return exposures.sort(
    (a, b) => order.indexOf(a.marketCap) - order.indexOf(b.marketCap)
  );
}

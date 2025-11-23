/**
 * Portfolio Position Enrichment
 *
 * Enriches raw portfolio positions with factor classifications
 */

import type { EnrichedPosition } from '@/types/analytics';
import { classifySector } from './classifiers/sector-classifier';
import { classifyMarketCap } from './classifiers/market-cap-classifier';
import { classifyGeography } from './classifiers/geography-classifier';
import { determineCurrency } from './classifiers/currency-classifier';

/**
 * Enrich portfolio positions with factor classifications
 *
 * Takes raw position data and enriches it with sector, market cap,
 * geography, and currency classifications for factor analysis.
 *
 * @param positions - Array of raw portfolio positions
 * @returns Array of enriched positions with factor classifications
 */
export function enrichPositions(
  positions: Array<{
    figi: string;
    ticker?: string;
    name?: string;
    value: number;
    weight: number;
    quantity?: number;
    currentPrice?: number;
    currency?: string;
    instrumentType?: string;
    isin?: string;
    exchange?: string;
  }>
): EnrichedPosition[] {
  return positions.map((pos) => {
    const ticker = pos.ticker || '';
    const sector = classifySector(ticker);
    const marketCap = classifyMarketCap(ticker);
    const geography = classifyGeography(ticker);
    const currency = determineCurrency(ticker, pos.currency);

    return {
      figi: pos.figi,
      ticker,
      name: pos.name || ticker,
      value: pos.value,
      weight: pos.weight,
      quantity: pos.quantity || 0,
      currentPrice: pos.currentPrice || 0,
      sector,
      marketCap,
      geography,
      currency,
      isin: pos.isin,
      instrumentType: pos.instrumentType || 'unknown',
      exchange: pos.exchange,
    };
  });
}

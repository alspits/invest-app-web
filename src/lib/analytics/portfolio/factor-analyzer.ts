/**
 * Portfolio Factor Analyzer
 *
 * Main orchestrator for comprehensive portfolio factor analysis
 */

import type { FactorAnalysis } from '@/types/analytics';
import { enrichPositions } from './enrichment';
import { calculateSectorExposure } from './calculators/sector-exposure';
import { calculateMarketCapExposure } from './calculators/market-cap-exposure';
import { calculateGeographyExposure } from './calculators/geography-exposure';
import { calculateCurrencyExposure } from './calculators/currency-exposure';
import {
  calculateHHI,
  calculateConcentrationRisk,
} from './calculators/concentration';
import { calculateTiltSignificance } from './calculators/tilt-calculator';

/**
 * Calculate comprehensive factor analysis for portfolio
 *
 * Main entry point that orchestrates all factor analysis calculations:
 * - Sector, market cap, geography, and currency exposures
 * - Concentration metrics (top positions, HHI)
 * - Diversification scores across all factors
 * - Factor tilts vs. MOEX benchmark
 * - Risk indicators
 *
 * @param positions - Array of raw portfolio positions
 * @returns Complete factor analysis with all metrics
 */
export function calculateFactorAnalysis(
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
): FactorAnalysis {
  // Enrich positions with factor classifications
  const enrichedPositions = enrichPositions(positions);

  // Calculate exposures
  const sectorExposure = calculateSectorExposure(enrichedPositions);
  const marketCapExposure = calculateMarketCapExposure(enrichedPositions);
  const geographyExposure = calculateGeographyExposure(enrichedPositions);
  const currencyExposure = calculateCurrencyExposure(enrichedPositions);

  // Calculate concentration metrics
  const sortedByWeight = [...positions].sort((a, b) => b.weight - a.weight);
  const topPositionWeight = sortedByWeight[0]?.weight || 0;
  const top5PositionsWeight = sortedByWeight
    .slice(0, 5)
    .reduce((sum, pos) => sum + pos.weight, 0);
  const top10PositionsWeight = sortedByWeight
    .slice(0, 10)
    .reduce((sum, pos) => sum + pos.weight, 0);

  const weights = positions.map((pos) => pos.weight);
  const herfindahlIndex = calculateHHI(weights);

  // Calculate diversification scores
  const sectorHHI = calculateHHI(sectorExposure.map((e) => e.weight));
  const geographyHHI = calculateHHI(geographyExposure.map((e) => e.weight));
  const currencyHHI = calculateHHI(currencyExposure.map((e) => e.weight));

  const diversificationScore = {
    overall: 1 - herfindahlIndex,
    bySector: 1 - sectorHHI,
    byGeography: 1 - geographyHHI,
    byCurrency: 1 - currencyHHI,
  };

  // Calculate factor tilts
  const sectorTilts = sectorExposure
    .filter((e) => e.deviation !== undefined && Math.abs(e.deviation) >= 2)
    .map((e) => ({
      sector: e.sector,
      tilt: e.deviation!,
      significance: calculateTiltSignificance(e.deviation!),
    }))
    .sort((a, b) => Math.abs(b.tilt) - Math.abs(a.tilt));

  const geographyTilts = geographyExposure
    .filter((e) => e.deviation !== undefined && Math.abs(e.deviation) >= 2)
    .map((e) => ({
      geography: e.geography,
      tilt: e.deviation!,
      significance: calculateTiltSignificance(e.deviation!),
    }))
    .sort((a, b) => Math.abs(b.tilt) - Math.abs(a.tilt));

  // Calculate risk indicators
  const riskIndicators = {
    sectorConcentrationRisk: calculateConcentrationRisk(sectorHHI),
    geographyConcentrationRisk: calculateConcentrationRisk(geographyHHI),
    currencyConcentrationRisk: calculateConcentrationRisk(currencyHHI),
  };

  return {
    sectorExposure,
    marketCapExposure,
    geographyExposure,
    currencyExposure,
    concentrationMetrics: {
      topPositionWeight,
      top5PositionsWeight,
      top10PositionsWeight,
      herfindahlIndex,
    },
    diversificationScore,
    factorTilts: {
      sectorTilts,
      geographyTilts,
    },
    riskIndicators,
  };
}

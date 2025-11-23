/**
 * Advanced Analytics Types
 *
 * Type definitions for portfolio factor analysis and advanced analytics
 */

// ============================================================================
// Factor Analysis Types
// ============================================================================

export type SectorType =
  | 'tech'          // Technology
  | 'finance'       // Financial Services
  | 'energy'        // Energy & Utilities
  | 'consumer'      // Consumer Goods
  | 'healthcare'    // Healthcare & Pharmaceuticals
  | 'industrial'    // Industrials
  | 'materials'     // Basic Materials
  | 'realestate'    // Real Estate
  | 'telecom'       // Telecommunications
  | 'utilities'     // Utilities
  | 'other';        // Other/Uncategorized

export type MarketCapType =
  | 'large'         // Large Cap (> 200B RUB)
  | 'mid'           // Mid Cap (10B - 200B RUB)
  | 'small';        // Small Cap (< 10B RUB)

export type GeographyType =
  | 'russia'        // Russian companies
  | 'usa'           // US companies
  | 'europe'        // European companies
  | 'asia'          // Asian companies
  | 'other';        // Other regions

export type CurrencyType =
  | 'RUB'           // Russian Ruble
  | 'USD'           // US Dollar
  | 'EUR'           // Euro
  | 'CNY'           // Chinese Yuan
  | 'other';        // Other currencies

// ============================================================================
// Exposure Interfaces
// ============================================================================

export interface SectorExposure {
  sector: SectorType;
  value: number;          // Total value in portfolio
  weight: number;         // Percentage of portfolio (0-100)
  count: number;          // Number of positions in sector
  benchmarkWeight?: number; // MOEX benchmark weight
  deviation?: number;      // Overweight/underweight vs benchmark
}

export interface MarketCapExposure {
  marketCap: MarketCapType;
  value: number;
  weight: number;
  count: number;
  benchmarkWeight?: number;
  deviation?: number;
}

export interface GeographyExposure {
  geography: GeographyType;
  value: number;
  weight: number;
  count: number;
  benchmarkWeight?: number;
  deviation?: number;
}

export interface CurrencyExposure {
  currency: CurrencyType;
  value: number;
  weight: number;
  count: number;
  benchmarkWeight?: number;
  deviation?: number;
}

// ============================================================================
// Factor Analysis Result
// ============================================================================

export interface FactorAnalysis {
  // Exposures by factor
  sectorExposure: SectorExposure[];
  marketCapExposure: MarketCapExposure[];
  geographyExposure: GeographyExposure[];
  currencyExposure: CurrencyExposure[];

  // Concentration metrics
  concentrationMetrics: {
    topPositionWeight: number;        // Weight of largest position
    top5PositionsWeight: number;      // Weight of top 5 positions
    top10PositionsWeight: number;     // Weight of top 10 positions
    herfindahlIndex: number;          // HHI for concentration (0-1)
  };

  // Diversification score
  diversificationScore: {
    overall: number;                  // Overall diversification (0-1)
    bySector: number;                 // Sector diversification
    byGeography: number;              // Geographic diversification
    byCurrency: number;               // Currency diversification
  };

  // Factor tilts (vs benchmark)
  factorTilts: {
    sectorTilts: Array<{
      sector: SectorType;
      tilt: number;                   // Positive = overweight, negative = underweight
      significance: 'high' | 'medium' | 'low';
    }>;
    geographyTilts: Array<{
      geography: GeographyType;
      tilt: number;
      significance: 'high' | 'medium' | 'low';
    }>;
  };

  // Risk indicators
  riskIndicators: {
    sectorConcentrationRisk: 'low' | 'medium' | 'high';
    geographyConcentrationRisk: 'low' | 'medium' | 'high';
    currencyConcentrationRisk: 'low' | 'medium' | 'high';
  };
}

// ============================================================================
// Enriched Position Type (with factor metadata)
// ============================================================================

export interface EnrichedPosition {
  // Basic position data
  figi: string;
  ticker: string;
  name: string;
  value: number;
  weight: number;
  quantity: number;
  currentPrice: number;

  // Factor classifications
  sector: SectorType;
  marketCap: MarketCapType;
  geography: GeographyType;
  currency: CurrencyType;

  // Additional metadata
  isin?: string;
  instrumentType: string;
  exchange?: string;
}

// ============================================================================
// MOEX Benchmark Data
// ============================================================================

export interface MOEXBenchmark {
  // Sector weights in MOEX index
  sectorWeights: Record<SectorType, number>;

  // Geography weights
  geographyWeights: Record<GeographyType, number>;

  // Last updated timestamp
  lastUpdated: Date;
}

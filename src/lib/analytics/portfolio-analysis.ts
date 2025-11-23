/**
 * Portfolio Factor Analysis Library
 *
 * Advanced analytics for portfolio factor analysis including sector exposure,
 * market cap distribution, geographic allocation, and currency breakdown.
 */

import type {
  SectorType,
  MarketCapType,
  GeographyType,
  CurrencyType,
  SectorExposure,
  MarketCapExposure,
  GeographyExposure,
  CurrencyExposure,
  FactorAnalysis,
  EnrichedPosition,
  MOEXBenchmark,
} from '@/types/analytics';

// ============================================================================
// Constants & Configuration
// ============================================================================

// Market cap thresholds in RUB
const MARKET_CAP_THRESHOLDS = {
  LARGE_CAP: 200_000_000_000,  // 200B RUB
  MID_CAP: 10_000_000_000,     // 10B RUB
} as const;

// MOEX Index Benchmark Weights (as of 2024)
// Source: MOEX official data
const MOEX_BENCHMARK: MOEXBenchmark = {
  sectorWeights: {
    finance: 28.5,      // Sberbank, VTB, etc.
    energy: 24.3,       // Gazprom, Lukoil, Rosneft
    materials: 15.2,    // Norilsk Nickel, Severstal
    telecom: 8.7,       // MTS, Rostelecom
    consumer: 7.4,      // Magnit, X5 Retail
    utilities: 5.6,     // Inter RAO, RusHydro
    industrial: 4.8,    // NLMK, TMK
    tech: 3.2,          // Yandex, Mail.ru
    healthcare: 1.5,    // Pharmstandard
    realestate: 0.6,    // LSR Group
    other: 0.2,
  },
  geographyWeights: {
    russia: 95.0,
    europe: 2.5,
    asia: 1.5,
    usa: 0.5,
    other: 0.5,
  },
  lastUpdated: new Date('2024-01-01'),
};

// ============================================================================
// Instrument Classification Database
// ============================================================================

// Sector classification by ticker
const SECTOR_MAP: Record<string, SectorType> = {
  // Finance
  'SBER': 'finance',
  'SBERP': 'finance',
  'VTB': 'finance',
  'TCSG': 'finance',
  'SOFL': 'finance',

  // Energy
  'GAZP': 'energy',
  'LKOH': 'energy',
  'ROSN': 'energy',
  'NVTK': 'energy',
  'TATN': 'energy',
  'TATNP': 'energy',
  'SIBN': 'energy',

  // Materials
  'GMKN': 'materials',
  'NLMK': 'materials',
  'CHMF': 'materials',
  'MAGN': 'materials',
  'ALRS': 'materials',

  // Tech
  'YNDX': 'tech',
  'VKCO': 'tech',
  'OZON': 'tech',

  // Telecom
  'MTSS': 'telecom',
  'RTKM': 'telecom',
  'RTKMP': 'telecom',

  // Consumer
  'MGNT': 'consumer',
  'FIVE': 'consumer',
  'FIXP': 'consumer',

  // Utilities
  'IRAO': 'utilities',
  'FEES': 'utilities',
  'HYDR': 'utilities',

  // Real Estate
  'LSRG': 'realestate',
  'PIKK': 'realestate',

  // Industrial
  'AFLT': 'industrial',
  'PHOR': 'industrial',

  // US Tech
  'AAPL': 'tech',
  'MSFT': 'tech',
  'GOOGL': 'tech',
  'AMZN': 'tech',
  'META': 'tech',
  'NVDA': 'tech',
  'TSLA': 'tech',
};

// Geography classification by ticker
const GEOGRAPHY_MAP: Record<string, GeographyType> = {
  // Russian stocks
  'SBER': 'russia',
  'SBERP': 'russia',
  'GAZP': 'russia',
  'LKOH': 'russia',
  'GMKN': 'russia',
  'YNDX': 'russia',
  'VTB': 'russia',
  'MTSS': 'russia',
  'ROSN': 'russia',
  'NVTK': 'russia',
  'NLMK': 'russia',
  'VKCO': 'russia',
  'OZON': 'russia',
  'TATN': 'russia',
  'TATNP': 'russia',
  'MGNT': 'russia',
  'FIVE': 'russia',
  'IRAO': 'russia',
  'CHMF': 'russia',
  'RTKM': 'russia',
  'RTKMP': 'russia',
  'TCSG': 'russia',
  'ALRS': 'russia',
  'MAGN': 'russia',
  'SIBN': 'russia',
  'FEES': 'russia',
  'HYDR': 'russia',
  'LSRG': 'russia',
  'PIKK': 'russia',
  'FIXP': 'russia',
  'SOFL': 'russia',
  'AFLT': 'russia',
  'PHOR': 'russia',

  // US stocks
  'AAPL': 'usa',
  'MSFT': 'usa',
  'GOOGL': 'usa',
  'AMZN': 'usa',
  'META': 'usa',
  'NVDA': 'usa',
  'TSLA': 'usa',
};

// Market cap classification by ticker (in RUB, approximate values)
const MARKET_CAP_MAP: Record<string, number> = {
  // Large cap (> 200B RUB)
  'SBER': 5_000_000_000_000,
  'GAZP': 3_500_000_000_000,
  'LKOH': 4_200_000_000_000,
  'GMKN': 2_800_000_000_000,
  'ROSN': 3_100_000_000_000,
  'NVTK': 2_400_000_000_000,
  'NLMK': 800_000_000_000,
  'YNDX': 1_200_000_000_000,
  'VTB': 600_000_000_000,
  'MTSS': 450_000_000_000,
  'TATN': 900_000_000_000,
  'IRAO': 350_000_000_000,

  // Mid cap (10B - 200B RUB)
  'VKCO': 180_000_000_000,
  'OZON': 150_000_000_000,
  'MGNT': 120_000_000_000,
  'FIVE': 95_000_000_000,
  'CHMF': 85_000_000_000,
  'RTKM': 70_000_000_000,
  'TCSG': 65_000_000_000,
  'ALRS': 55_000_000_000,
  'MAGN': 45_000_000_000,
  'SIBN': 40_000_000_000,
  'FEES': 35_000_000_000,
  'HYDR': 30_000_000_000,
  'LSRG': 25_000_000_000,
  'PIKK': 22_000_000_000,

  // Small cap (< 10B RUB)
  'FIXP': 8_000_000_000,
  'SOFL': 6_000_000_000,
  'AFLT': 5_000_000_000,
  'PHOR': 4_000_000_000,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Classify sector for a given ticker
 */
function classifySector(ticker: string): SectorType {
  return SECTOR_MAP[ticker] || 'other';
}

/**
 * Classify geography for a given ticker
 */
function classifyGeography(ticker: string): GeographyType {
  return GEOGRAPHY_MAP[ticker] || 'russia';
}

/**
 * Classify market cap for a given ticker
 */
function classifyMarketCap(ticker: string): MarketCapType {
  const marketCap = MARKET_CAP_MAP[ticker];

  if (!marketCap) {
    return 'mid'; // Default to mid cap if unknown
  }

  if (marketCap >= MARKET_CAP_THRESHOLDS.LARGE_CAP) {
    return 'large';
  } else if (marketCap >= MARKET_CAP_THRESHOLDS.MID_CAP) {
    return 'mid';
  } else {
    return 'small';
  }
}

/**
 * Determine currency from ticker or instrument data
 */
function determineCurrency(ticker: string, currency?: string): CurrencyType {
  // If currency is explicitly provided
  if (currency) {
    if (currency === 'RUB' || currency === 'rub') return 'RUB';
    if (currency === 'USD' || currency === 'usd') return 'USD';
    if (currency === 'EUR' || currency === 'eur') return 'EUR';
    if (currency === 'CNY' || currency === 'cny') return 'CNY';
    return 'other';
  }

  // Infer from ticker
  if (GEOGRAPHY_MAP[ticker] === 'usa') {
    return 'USD';
  }

  // Default to RUB for Russian stocks
  return 'RUB';
}

/**
 * Calculate Herfindahl-Hirschman Index (HHI) for concentration
 */
function calculateHHI(weights: number[]): number {
  return weights.reduce((sum, weight) => {
    const decimalWeight = weight / 100;
    return sum + (decimalWeight * decimalWeight);
  }, 0);
}

/**
 * Calculate tilt significance level
 */
function calculateTiltSignificance(tilt: number): 'high' | 'medium' | 'low' {
  const absTilt = Math.abs(tilt);

  if (absTilt >= 15) return 'high';
  if (absTilt >= 5) return 'medium';
  return 'low';
}

/**
 * Calculate concentration risk level
 */
function calculateConcentrationRisk(hhi: number): 'low' | 'medium' | 'high' {
  if (hhi >= 0.25) return 'high';      // Very concentrated
  if (hhi >= 0.15) return 'medium';    // Moderately concentrated
  return 'low';                         // Well diversified
}

// ============================================================================
// Main Analysis Functions
// ============================================================================

/**
 * Enrich portfolio positions with factor classifications
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
  return positions.map(pos => {
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

/**
 * Calculate sector exposure
 */
export function calculateSectorExposure(
  positions: EnrichedPosition[]
): SectorExposure[] {
  // Group by sector
  const sectorGroups = new Map<SectorType, {
    value: number;
    count: number;
  }>();

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

/**
 * Calculate market cap exposure
 */
export function calculateMarketCapExposure(
  positions: EnrichedPosition[]
): MarketCapExposure[] {
  // Group by market cap
  const marketCapGroups = new Map<MarketCapType, {
    value: number;
    count: number;
  }>();

  for (const pos of positions) {
    const existing = marketCapGroups.get(pos.marketCap) || { value: 0, count: 0 };
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
  return exposures.sort((a, b) => order.indexOf(a.marketCap) - order.indexOf(b.marketCap));
}

/**
 * Calculate geography exposure
 */
export function calculateGeographyExposure(
  positions: EnrichedPosition[]
): GeographyExposure[] {
  // Group by geography
  const geographyGroups = new Map<GeographyType, {
    value: number;
    count: number;
  }>();

  for (const pos of positions) {
    const existing = geographyGroups.get(pos.geography) || { value: 0, count: 0 };
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

/**
 * Calculate currency exposure
 */
export function calculateCurrencyExposure(
  positions: EnrichedPosition[]
): CurrencyExposure[] {
  // Group by currency
  const currencyGroups = new Map<CurrencyType, {
    value: number;
    count: number;
  }>();

  for (const pos of positions) {
    const existing = currencyGroups.get(pos.currency) || { value: 0, count: 0 };
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

/**
 * Calculate comprehensive factor analysis
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

  const weights = positions.map(pos => pos.weight);
  const herfindahlIndex = calculateHHI(weights);

  // Calculate diversification scores
  const sectorHHI = calculateHHI(sectorExposure.map(e => e.weight));
  const geographyHHI = calculateHHI(geographyExposure.map(e => e.weight));
  const currencyHHI = calculateHHI(currencyExposure.map(e => e.weight));

  const diversificationScore = {
    overall: 1 - herfindahlIndex,
    bySector: 1 - sectorHHI,
    byGeography: 1 - geographyHHI,
    byCurrency: 1 - currencyHHI,
  };

  // Calculate factor tilts
  const sectorTilts = sectorExposure
    .filter(e => e.deviation !== undefined && Math.abs(e.deviation) >= 2)
    .map(e => ({
      sector: e.sector,
      tilt: e.deviation!,
      significance: calculateTiltSignificance(e.deviation!),
    }))
    .sort((a, b) => Math.abs(b.tilt) - Math.abs(a.tilt));

  const geographyTilts = geographyExposure
    .filter(e => e.deviation !== undefined && Math.abs(e.deviation) >= 2)
    .map(e => ({
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

/**
 * Get MOEX benchmark data
 */
export function getMOEXBenchmark(): MOEXBenchmark {
  return MOEX_BENCHMARK;
}

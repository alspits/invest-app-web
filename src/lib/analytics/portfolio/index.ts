/**
 * Portfolio Analysis Module
 *
 * Public API for portfolio factor analysis
 */

// Main analysis functions
export { calculateFactorAnalysis } from './factor-analyzer';
export { enrichPositions } from './enrichment';
export { getMOEXBenchmark } from './benchmark';

// Calculators
export { calculateSectorExposure } from './calculators/sector-exposure';
export { calculateMarketCapExposure } from './calculators/market-cap-exposure';
export { calculateGeographyExposure } from './calculators/geography-exposure';
export { calculateCurrencyExposure } from './calculators/currency-exposure';
export {
  calculateHHI,
  calculateConcentrationRisk,
} from './calculators/concentration';
export { calculateTiltSignificance } from './calculators/tilt-calculator';

// Classifiers
export { classifySector } from './classifiers/sector-classifier';
export { classifyGeography } from './classifiers/geography-classifier';
export { classifyMarketCap } from './classifiers/market-cap-classifier';
export { determineCurrency } from './classifiers/currency-classifier';

/**
 * Rebalancing Module - Public API
 * Portfolio rebalancing with deviation analysis, trade generation, and cost estimation
 */

// Types
export type {
  TargetAllocation,
  SectorAllocation,
  GeographyAllocation,
  AssetTypeAllocation,
  RebalancingStrategy,
  RebalancingConfig,
  CategoryDeviation,
  DeviationAnalysis,
  TradeOrder,
  TradeDirection,
  CostBreakdown,
  TaxEstimate,
  RebalancingPlan,
} from './types';

export { PRESET_ALLOCATIONS } from './types';

// Deviation Analysis
export {
  calculateCurrentAllocation,
  calculateDeviations,
  prioritizeRebalancing,
} from './deviation-analyzer';

// Trade Generation
export {
  generateTradeOrders,
  optimizeTradeSequence,
} from './trade-generator';

// Cost & Tax Estimation
export {
  estimateTransactionCosts,
  estimateTaxImpact,
  filterTradesByMaxCost,
  optimizeForTaxes,
} from './cost-estimator';

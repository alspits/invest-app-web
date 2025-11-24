/**
 * Scenario Analysis Types
 * Domain models for What-If analysis, portfolio simulations, and historical backtesting
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * Simplified position type for scenario analysis
 * (derived from PortfolioPosition but with calculated fields)
 */
export interface Position {
  figi: string;
  ticker?: string;
  name?: string;
  quantity: number;
  currentPrice: number;
  currentValue: number;
  averagePositionPrice: number;
  expectedYield: number;
  currency: string;
  sector?: string;
}

// ============================================================================
// Core Scenario Types
// ============================================================================

/**
 * Type of change to apply to portfolio
 */
export type ScenarioChangeType =
  | 'price_change' // Change market price of asset
  | 'quantity_change' // Change quantity of position
  | 'add_position' // Add new position
  | 'remove_position' // Remove position
  | 'market_event'; // Apply market-wide price movements

/**
 * Individual change to apply in scenario
 */
export interface ScenarioChange {
  id: string;
  type: ScenarioChangeType;
  ticker?: string;
  figi?: string;
  label: string;

  // For price_change
  priceChangePercent?: number; // e.g., -20 for 20% drop

  // For quantity_change
  newQuantity?: number;

  // For add_position
  addPosition?: {
    ticker: string;
    figi: string;
    name: string;
    quantity: number;
    price: number;
    currency: string;
  };

  // For market_event
  marketMultipliers?: Record<string, number>; // figi -> multiplier (e.g., 0.8 for -20%)
}

/**
 * Portfolio snapshot at a point in time
 */
export interface ScenarioSnapshot {
  totalValue: number;
  positions: Position[];
  sectorWeights: Record<string, number>;
  geoWeights: Record<string, number>;
  cashBalance: number;
  timestamp: Date;
}

/**
 * Results of applying scenario
 */
export interface ScenarioResult {
  scenarioId: string;
  label: string;

  // Base vs scenario comparison
  baseSnapshot: ScenarioSnapshot;
  scenarioSnapshot: ScenarioSnapshot;

  // Delta metrics
  valueChange: number; // Absolute value change
  valueChangePercent: number; // Percentage change

  // Risk metrics
  volatilityChange?: number; // Change in portfolio volatility
  diversificationChange: {
    herfindahlBefore: number;
    herfindahlAfter: number;
    delta: number;
  };

  // Sector/geo exposure changes
  sectorWeightChanges: Record<string, number>; // sector -> delta
  geoWeightChanges: Record<string, number>; // country -> delta

  // Goal achievement probabilities (if goals exist)
  goalProbabilities?: Record<string, number>; // goalId -> probability %

  // Applied changes
  appliedChanges: ScenarioChange[];

  createdAt: Date;
}

/**
 * Saved scenario configuration
 */
export interface Scenario {
  id: string;
  name: string;
  description?: string;
  basePortfolioId?: string; // If null, uses current portfolio
  changes: ScenarioChange[];
  result?: ScenarioResult; // Cached result
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Historical Scenario Types
// ============================================================================

/**
 * Preset historical market event
 */
export interface HistoricalScenario {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;

  // Market movements during event
  marketMultipliers: Record<string, number>; // figi -> price multiplier

  // Index movements (for reference)
  spx500Change?: number; // S&P 500 change
  moexChange?: number; // MOEX change

  tags: string[]; // e.g., ['crash', 'recovery', 'bull-market']
}

/**
 * Comparison of multiple scenario results
 */
export interface ScenarioComparison {
  scenarios: ScenarioResult[];

  // Aggregated metrics
  bestCase: {
    scenarioId: string;
    value: number;
  };
  worstCase: {
    scenarioId: string;
    value: number;
  };

  // Risk range
  valueRange: {
    min: number;
    max: number;
    spread: number;
  };

  // Recommendations based on comparison
  recommendations?: string[];
}

/**
 * Rebalancing Module - Type Definitions
 * Domain types for portfolio rebalancing, target allocation, and trade generation
 */

// ========== Target Allocation ==========

export interface SectorAllocation {
  technology: number;
  finance: number;
  energy: number;
  healthcare: number;
  utilities: number;
  materials: number;
  industrials: number;
  consumer: number;
  telecommunications: number;
  realestate: number;
  other: number;
}

export interface GeographyAllocation {
  russia: number;
  developed: number;
  emerging: number;
}

export interface AssetTypeAllocation {
  stocks: number;
  bonds: number;
  etf: number;
  alternatives: number;
}

export interface TargetAllocation {
  sectors: Partial<SectorAllocation>;
  geography: Partial<GeographyAllocation>;
  assetTypes: Partial<AssetTypeAllocation>;
  lastUpdated: Date;
}

// ========== Rebalancing Strategy ==========

export enum RebalancingStrategy {
  TACTICAL = 'TACTICAL', // Short-term adjustments based on market conditions
  STRATEGIC = 'STRATEGIC', // Long-term asset allocation maintenance
  THRESHOLD_BASED = 'THRESHOLD_BASED', // Rebalance only when deviation exceeds threshold
}

export interface RebalancingConfig {
  strategy: RebalancingStrategy;
  thresholdPercent?: number; // For threshold-based strategy
  maxTransactionCost?: number; // Maximum acceptable cost
  minTradeSize?: number; // Minimum position size to trade
  considerTaxImpact?: boolean;
}

// ========== Deviation Analysis ==========

export interface CategoryDeviation {
  category: string; // e.g., "technology", "russia", "stocks"
  dimension: 'sector' | 'geography' | 'assetType';
  currentWeight: number;
  targetWeight: number;
  deviationPercent: number; // Absolute deviation
  deviationAmount: number; // In currency
  priority: number; // 1 = highest priority
  recommendation: 'SELL' | 'BUY' | 'HOLD';
}

export interface DeviationAnalysis {
  totalDeviationScore: number; // Sum of squared deviations
  categoryDeviations: CategoryDeviation[];
  highPriorityCount: number; // Deviations >5%
  needsRebalancing: boolean;
  estimatedImpact: {
    riskReduction: number; // Percentage
    diversificationImprovement: number; // Score improvement
  };
}

// ========== Trade Orders ==========

export type TradeDirection = 'BUY' | 'SELL';

export interface TradeOrder {
  id: string;
  ticker: string;
  figi?: string;
  name: string;
  quantity: number;
  direction: TradeDirection;
  estimatedPrice: number; // Per unit
  estimatedTotal: number; // Total order value
  reason: string; // Why this trade is needed
  category: string; // Sector/geography affected
  priority: number;
  liquidityScore?: number; // 0-100, higher = more liquid
}

// ========== Cost & Tax Estimates ==========

export interface CostBreakdown {
  commission: number; // Broker fees
  spread: number; // Bid-ask spread cost
  marketImpact: number; // Price impact of large orders
  totalCost: number;
  costAsPercent: number; // Of total order value
  itemized: Array<{
    ticker: string;
    commission: number;
    spread: number;
    marketImpact: number;
  }>;
}

export interface TaxEstimate {
  shortTermGains: number; // Held <3 years (Russia)
  longTermGains: number; // Held >3 years (tax-free)
  unrealizedLosses: number; // Can offset gains
  estimatedTaxLiability: number; // 13% NDFL on short-term
  taxLossHarvestingOpportunities: string[]; // Tickers with losses
}

// ========== Rebalancing Plan ==========

export interface RebalancingPlan {
  id: string;
  createdAt: Date;
  targetAllocation: TargetAllocation;
  deviationAnalysis: DeviationAnalysis;
  tradeOrders: TradeOrder[];
  costEstimate: CostBreakdown;
  taxEstimate: TaxEstimate;
  summary: {
    totalTrades: number;
    totalValue: number; // Total order value
    netCost: number; // Cost + tax
    expectedTimeToComplete: string; // e.g., "2-3 days"
    warnings: string[];
  };
  status: 'DRAFT' | 'APPROVED' | 'EXECUTED';
}

// ========== Preset Allocations ==========

export const PRESET_ALLOCATIONS: Record<
  'conservative' | 'moderate' | 'aggressive',
  TargetAllocation
> = {
  conservative: {
    sectors: {
      finance: 0.25,
      utilities: 0.2,
      consumer: 0.15,
      healthcare: 0.15,
      technology: 0.1,
      other: 0.15,
    },
    geography: {
      russia: 0.7,
      developed: 0.25,
      emerging: 0.05,
    },
    assetTypes: {
      stocks: 0.4,
      bonds: 0.5,
      etf: 0.1,
    },
    lastUpdated: new Date(),
  },
  moderate: {
    sectors: {
      technology: 0.25,
      finance: 0.2,
      healthcare: 0.15,
      consumer: 0.15,
      energy: 0.1,
      other: 0.15,
    },
    geography: {
      russia: 0.6,
      developed: 0.3,
      emerging: 0.1,
    },
    assetTypes: {
      stocks: 0.6,
      bonds: 0.3,
      etf: 0.1,
    },
    lastUpdated: new Date(),
  },
  aggressive: {
    sectors: {
      technology: 0.35,
      finance: 0.2,
      healthcare: 0.15,
      energy: 0.15,
      consumer: 0.1,
      other: 0.05,
    },
    geography: {
      russia: 0.5,
      developed: 0.35,
      emerging: 0.15,
    },
    assetTypes: {
      stocks: 0.85,
      bonds: 0.1,
      etf: 0.05,
    },
    lastUpdated: new Date(),
  },
};

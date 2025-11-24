/**
 * Type definitions for Investment Recommendation Engine
 *
 * Contains all interfaces and types used across the recommendation system.
 */

/**
 * Priority levels for recommendations
 */
export type RecommendationPriority = 'high' | 'medium' | 'low';

/**
 * Recommendation categories
 */
export type RecommendationType =
  | 'diversification' // Improve portfolio diversification
  | 'rebalancing' // Rebalance overweight/underweight positions
  | 'cash_allocation' // Invest unused cash
  | 'concentration_risk' // Reduce concentration in single positions
  | 'sector_allocation' // Adjust sector allocation
  | 'risk_management'; // Risk-related recommendations

/**
 * Individual recommendation
 */
export interface Recommendation {
  id: string;
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  description: string;
  actionItems: string[];
  rationale: string;
  affectedPositions?: string[]; // Tickers of affected positions
  targetAllocation?: number; // Target percentage for rebalancing
  currentAllocation?: number; // Current percentage
  potentialImpact?: string; // Expected impact on portfolio
}

/**
 * Sector allocation breakdown
 */
export interface SectorAllocation {
  sector: string;
  value: number;
  percentage: number;
  positions: string[]; // Tickers in this sector
}

/**
 * Concentration risk analysis
 */
export interface ConcentrationRisk {
  topPosition: {
    ticker: string;
    name: string;
    percentage: number;
  };
  top3Concentration: number; // Percentage held in top 3 positions
  top5Concentration: number; // Percentage held in top 5 positions
  herfindahlIndex: number; // HHI score
  isHighRisk: boolean; // True if concentration is too high
}

/**
 * Cash allocation analysis
 */
export interface CashAnalysis {
  totalCash: number;
  cashPercentage: number;
  currency: string;
  isExcessive: boolean; // True if cash > 10% of portfolio
  suggestedInvestmentAmount?: number;
}

/**
 * Target allocation for rebalancing
 */
export interface TargetAllocation {
  instrumentType: string;
  currentPercentage: number;
  targetPercentage: number;
  difference: number; // Percentage points to adjust
  rebalanceAmount: number; // Amount in currency to buy/sell
}

/**
 * Sector weight information
 */
export interface SectorWeight {
  sector: string;
  weight: number; // 0-1 (percentage as decimal)
  value: number; // Absolute value in currency
  positions: string[]; // Tickers in this sector
}

/**
 * Map of sector names to weights
 */
export type SectorWeights = Record<string, SectorWeight>;

/**
 * Overloaded sector detection
 */
export interface OverloadedSector {
  sector: string;
  currentWeight: number; // 0-1 (percentage as decimal)
  targetWeight: number; // 0-1 (suggested percentage as decimal)
  recommendation: string; // Human-readable suggestion
  adjustmentAmount?: number; // Amount to reduce/increase in currency
}

/**
 * Diversification analysis result
 */
export interface DiversificationAnalysis {
  id: string;
  overloadedSectors: OverloadedSector[];
  sectorWeights: SectorWeights;
  confidence: number; // 0-100
  timestamp: Date;
  totalValue: number; // Total portfolio value
  diversificationScore: number; // 0-100 (higher = more diversified)
}

/**
 * Complete recommendation report
 */
export interface RecommendationReport {
  recommendations: Recommendation[];
  concentrationRisk: ConcentrationRisk;
  cashAnalysis: CashAnalysis;
  sectorAllocation: SectorAllocation[];
  targetAllocations: TargetAllocation[];
  overallScore: number; // 0-100 health score
  generatedAt: Date;
}

import { z } from 'zod';

// ============================================================================
// Trading Pattern Types
// ============================================================================

// Pattern categories
export type PatternCategory = 'panic_sell' | 'fomo_buy' | 'strategic' | 'emotional';

// Market context
export type MarketContext = 'bull' | 'bear' | 'sideways';

// Emotional trigger types
export type TriggerType = 'price_drop' | 'price_spike' | 'news' | 'volatility' | 'fomo' | 'panic';

// Trigger severity levels
export type TriggerSeverity = 'low' | 'medium' | 'high';

// Operation state from Tinkoff API
export type OperationState = 'executed' | 'canceled' | 'progress';

// Operation type from Tinkoff API
export type OperationType =
  | 'buy'
  | 'sell'
  | 'buy_card'
  | 'sell_card'
  | 'dividend'
  | 'coupon'
  | 'tax'
  | 'service_commission';

// ============================================================================
// Zod Schemas
// ============================================================================

// Tinkoff Operation Schema
export const OperationSchema = z.object({
  id: z.string(),
  parentOperationId: z.string().optional(),
  currency: z.string(),
  payment: z.object({
    currency: z.string(),
    units: z.string(),
    nano: z.number(),
  }),
  price: z.object({
    currency: z.string(),
    units: z.string(),
    nano: z.number(),
  }).optional(),
  state: z.enum(['executed', 'canceled', 'progress']),
  quantity: z.number(),
  quantityRest: z.number().optional(),
  figi: z.string(),
  instrumentType: z.string(),
  date: z.string(), // ISO date string
  type: z.string(), // Operation type string
  operationType: z.string().optional(),
  instrumentUid: z.string().optional(),
});

export const OperationsResponseSchema = z.object({
  operations: z.array(OperationSchema),
});

// Pattern Metrics Schema
export const PatternMetricsSchema = z.object({
  profitLoss: z.number(), // Profit/Loss in percentage
  profitLossAbsolute: z.number(), // Absolute profit/loss in currency
  timeToComplete: z.number(), // Time from buy to sell in days
  priceChangeAtEntry: z.number(), // Price change % at entry point
  priceChangeAtExit: z.number().optional(), // Price change % at exit point
  marketContext: z.enum(['bull', 'bear', 'sideways']),
  volatility: z.number(), // Market volatility during operation
});

// Emotional Trigger Schema
export const EmotionalTriggerSchema = z.object({
  type: z.enum(['price_drop', 'price_spike', 'news', 'volatility', 'fomo', 'panic']),
  severity: z.enum(['low', 'medium', 'high']),
  detectedAt: z.date(),
  description: z.string(),
  relatedOperations: z.array(z.string()), // Operation IDs
  metrics: z.object({
    priceChange: z.number().optional(), // % change that triggered
    timeWindow: z.number().optional(), // Minutes between operations
    frequency: z.number().optional(), // Number of operations in short period
  }).optional(),
});

// Trading Pattern Schema
export const TradingPatternSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  category: z.enum(['panic_sell', 'fomo_buy', 'strategic', 'emotional']),
  operations: z.array(OperationSchema),
  detectedAt: z.date(),
  confidence: z.number().min(0).max(100), // Confidence score 0-100%
  metrics: PatternMetricsSchema,
  triggers: z.array(EmotionalTriggerSchema),
  ticker: z.string().optional(),
  instrumentName: z.string().optional(),
});

// Pattern Statistics Schema (for aggregated analytics)
export const PatternStatsSchema = z.object({
  category: z.enum(['panic_sell', 'fomo_buy', 'strategic', 'emotional']),
  totalCount: z.number(),
  successCount: z.number(), // Profitable operations
  failureCount: z.number(), // Unprofitable operations
  breakEvenCount: z.number(), // Break-even operations (zero P&L)
  successRate: z.number().nullable(), // Percentage of successful operations (null if no wins/losses)
  averageProfitLoss: z.number(), // Average P&L in %
  averageTimeToComplete: z.number(), // Average holding period in days
  totalVolume: z.number(), // Total trading volume in currency
  commonTriggers: z.array(z.object({
    type: z.string(),
    count: z.number(),
  })),
});

// Pattern Analysis Response Schema
export const PatternAnalysisSchema = z.object({
  patterns: z.array(TradingPatternSchema),
  statistics: z.array(PatternStatsSchema),
  summary: z.object({
    totalPatterns: z.number(),
    totalOperations: z.number(),
    overallProfitLoss: z.number(),
    mostCommonCategory: z.string(),
    mostSuccessfulCategory: z.string(),
    riskScore: z.number().min(0).max(100), // Overall emotional trading risk
  }),
  recommendations: z.array(z.object({
    category: z.string(),
    message: z.string(),
    severity: z.enum(['info', 'warning', 'critical']),
  })),
});

// ============================================================================
// TypeScript Types (inferred from schemas)
// ============================================================================

export type Operation = z.infer<typeof OperationSchema>;
export type OperationsResponse = z.infer<typeof OperationsResponseSchema>;
export type PatternMetrics = z.infer<typeof PatternMetricsSchema>;
export type EmotionalTrigger = z.infer<typeof EmotionalTriggerSchema>;
export type TradingPattern = z.infer<typeof TradingPatternSchema>;
export type PatternStats = z.infer<typeof PatternStatsSchema>;
export type PatternAnalysis = z.infer<typeof PatternAnalysisSchema>;

// ============================================================================
// Helper Types
// ============================================================================

// Grouped operations by instrument (for pattern detection)
export interface InstrumentOperations {
  figi: string;
  ticker?: string;
  name?: string;
  operations: Operation[];
}

// Trade pair (buy + sell operations)
export interface TradePair {
  buyOperation: Operation;
  sellOperation: Operation;
  profitLoss: number;
  profitLossPercentage: number;
  holdingPeriodDays: number;
}

// Pattern detection configuration
export interface PatternDetectionConfig {
  // Panic Sell thresholds
  panicSellPriceDropThreshold: number; // % price drop to trigger panic sell detection
  panicSellLossThreshold: number; // % loss to consider panic sell

  // FOMO Buy thresholds
  fomoBuyPriceRiseThreshold: number; // % price rise to trigger FOMO detection
  fomoBuyImpulseWindowMinutes: number; // Time window for impulse detection

  // Emotional trading thresholds
  emotionalFrequencyThreshold: number; // Operations per week to flag emotional
  emotionalDayTradingWindowHours: number; // Hours to detect day trading

  // Strategic thresholds
  strategicTakeProfitThreshold: number; // % profit to consider strategic
  strategicDCAIntervalDays: number; // Days between DCA purchases

  // General
  analysisWindowDays: number; // Days to look back for analysis
}

// Default configuration
export const DEFAULT_PATTERN_CONFIG: PatternDetectionConfig = {
  panicSellPriceDropThreshold: 5,
  panicSellLossThreshold: 10,
  fomoBuyPriceRiseThreshold: 5,
  fomoBuyImpulseWindowMinutes: 60,
  emotionalFrequencyThreshold: 5,
  emotionalDayTradingWindowHours: 24,
  strategicTakeProfitThreshold: 10,
  strategicDCAIntervalDays: 7,
  analysisWindowDays: 90,
};

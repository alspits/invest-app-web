import type {
  Operation,
  PatternDetectionConfig,
  PatternAnalysis,
  TradingPattern,
} from '@/types/trading-pattern';

// Import matchers
import { groupOperationsByInstrument } from './matchers/operation-grouper';
import {
  isBuyOperation,
  isSellOperation,
  matchTradePairs,
} from './matchers/trade-matcher';

// Import detectors
import { analyzeTradePair } from './detectors/pair-detector';
import { detectStandalonePatterns } from './detectors/standalone-detector';

// Import analyzers
import { calculateStatistics } from './analyzers/statistics-analyzer';
import { generateSummary } from './analyzers/summary-generator';
import { generateRecommendations } from './analyzers/recommendation-generator';

// Import utils
import { createTrigger } from './utils/trigger-factory';

/**
 * Main service for detecting trading patterns and behavioral insights
 *
 * Analyzes trading operations to identify:
 * - Panic sells (emotional selling during losses)
 * - FOMO buys (impulse buying)
 * - Strategic trades (planned take-profit)
 * - Emotional trading (frequent day trading)
 *
 * @example
 * ```typescript
 * const service = new PatternRecognitionService({ panicSellLossThreshold: 15 });
 * const analysis = await service.analyzePatterns(accountId, operations);
 * console.log(`Risk Score: ${analysis.summary.riskScore}`);
 * ```
 */
export class PatternRecognitionService {
  private config: PatternDetectionConfig;

  constructor(config: Partial<PatternDetectionConfig> = {}) {
    const defaultConfig: PatternDetectionConfig = {
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

    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Analyze all operations and detect patterns
   *
   * @param accountId - Account ID to analyze
   * @param operations - Array of trading operations
   * @returns Pattern analysis with detected patterns, statistics, summary, and recommendations
   */
  async analyzePatterns(
    accountId: string,
    operations: Operation[]
  ): Promise<PatternAnalysis> {
    // Filter executed operations only (ignore canceled)
    const executedOps = operations.filter((op) => op.state === 'executed');

    // Group operations by instrument
    const groupedOps = groupOperationsByInstrument(executedOps);

    // Detect patterns for each instrument
    const allPatterns: TradingPattern[] = [];

    for (const instrumentOps of groupedOps) {
      const patterns = await this.detectInstrumentPatterns(
        accountId,
        instrumentOps
      );
      allPatterns.push(...patterns);
    }

    // Calculate statistics
    const statistics = calculateStatistics(allPatterns);

    // Generate summary
    const summary = generateSummary(allPatterns, statistics, operations);

    // Generate recommendations
    const recommendations = generateRecommendations(statistics, summary);

    return {
      patterns: allPatterns,
      statistics,
      summary,
      recommendations,
    };
  }

  /**
   * Detect patterns for a specific instrument
   *
   * @private
   */
  private async detectInstrumentPatterns(
    accountId: string,
    instrumentOps: ReturnType<typeof groupOperationsByInstrument>[0]
  ): Promise<TradingPattern[]> {
    const patterns: TradingPattern[] = [];

    // Extract buy and sell operations
    const buys = instrumentOps.operations.filter((op) => isBuyOperation(op));
    const sells = instrumentOps.operations.filter((op) => isSellOperation(op));

    // Create trade pairs (FIFO matching)
    const tradePairs = matchTradePairs(buys, sells);

    // Analyze each trade pair for patterns
    for (const pair of tradePairs) {
      const pattern = await analyzeTradePair(
        accountId,
        pair,
        instrumentOps,
        this.config,
        createTrigger,
        isBuyOperation
      );
      if (pattern) {
        patterns.push(pattern);
      }
    }

    // Detect patterns that don't require pairs (e.g., FOMO buys without sells)
    const standalonePatterns = await detectStandalonePatterns(
      accountId,
      instrumentOps,
      this.config,
      isBuyOperation,
      createTrigger
    );
    patterns.push(...standalonePatterns);

    return patterns;
  }
}

/**
 * Factory function to create a pattern recognition service instance
 *
 * @param config - Optional partial configuration to override defaults
 * @returns PatternRecognitionService instance
 *
 * @example
 * ```typescript
 * const service = createPatternRecognitionService({
 *   panicSellLossThreshold: 15,
 *   fomoBuyImpulseWindowMinutes: 30
 * });
 * ```
 */
export function createPatternRecognitionService(
  config?: Partial<PatternDetectionConfig>
): PatternRecognitionService {
  return new PatternRecognitionService(config);
}

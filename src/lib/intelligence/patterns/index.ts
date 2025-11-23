/**
 * Pattern Recognition Module
 *
 * Modular pattern recognition service for detecting trading behavioral patterns.
 * Identifies panic sells, FOMO buys, strategic trades, and emotional trading.
 *
 * @module patterns
 *
 * @example Basic Usage
 * ```typescript
 * import { createPatternRecognitionService } from '@/lib/intelligence/patterns';
 *
 * const service = createPatternRecognitionService();
 * const analysis = await service.analyzePatterns(accountId, operations);
 *
 * console.log(`Detected ${analysis.patterns.length} patterns`);
 * console.log(`Risk Score: ${analysis.summary.riskScore}%`);
 * ```
 *
 * @example Custom Configuration
 * ```typescript
 * import { createPatternRecognitionService } from '@/lib/intelligence/patterns';
 *
 * const service = createPatternRecognitionService({
 *   panicSellLossThreshold: 15,
 *   fomoBuyImpulseWindowMinutes: 30
 * });
 * ```
 *
 * @example Formatting Patterns
 * ```typescript
 * import { formatPatternCategory, getPatternCategoryColor } from '@/lib/intelligence/patterns';
 *
 * const label = formatPatternCategory('panic_sell'); // "Паническая продажа"
 * const color = getPatternCategoryColor('panic_sell'); // "text-red-500"
 * ```
 */

// Main service
export {
  PatternRecognitionService,
  createPatternRecognitionService,
} from './pattern-service';

// Utility formatters
export {
  formatPatternCategory,
  getPatternCategoryColor,
} from './utils/formatters';

// Re-export types from main types file
export type {
  TradingPattern,
  PatternCategory,
  PatternMetrics,
  EmotionalTrigger,
  TradePair,
  InstrumentOperations,
  PatternDetectionConfig,
  PatternStats,
  PatternAnalysis,
} from '@/types/trading-pattern';

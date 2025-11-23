// ============================================================================
// Alert Engine - Modular Alert Evaluation System
// ============================================================================

// Main engine
export { AlertEngine } from './alert-engine';

// Batching and sentiment analysis
export { AlertBatcher } from './batcher';
export { SentimentAnalyzer } from './sentiment-analyzer';

// Types
export type { MarketData, NewsData, PriceDataPoint } from './types';

// Evaluators (optional public API)
export { evaluateConditions, evaluateSingleCondition } from './evaluators/conditions';
export { evaluateNewsTrigger } from './evaluators/news-trigger';
export { evaluateAnomaly, calculateStatistics } from './evaluators/anomaly';
export {
  compareValues,
  operatorToSymbol,
  getFieldValue,
} from './evaluators/operator-utils';

// State helpers (optional public API)
export {
  isInDNDPeriod,
  isInCooldownPeriod,
  hasReachedDailyLimit,
} from './state-helpers';

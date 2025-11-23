import {
  Alert,
  AlertTriggerEvent,
} from '@/types/alert';
import { MarketData, NewsData, PriceDataPoint } from './types';
import { evaluateConditions } from './evaluators/conditions';
import { evaluateNewsTrigger } from './evaluators/news-trigger';
import { evaluateAnomaly } from './evaluators/anomaly';
import {
  isInDNDPeriod,
  isInCooldownPeriod,
  hasReachedDailyLimit,
} from './state-helpers';

/**
 * Safely coerce a value to a valid Date instance
 * @param value - Potential date value (Date, string, number, or undefined)
 * @returns Valid Date instance or undefined if invalid/missing
 */
function coerceToValidDate(value: Date | string | number | undefined): Date | undefined {
  if (!value) {
    return undefined;
  }

  // If already a Date instance, validate it
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? undefined : value;
  }

  // Try to construct Date from string or number
  const date = new Date(value);
  return isNaN(date.getTime()) ? undefined : date;
}

/**
 * Main alert evaluation engine
 * Orchestrates alert evaluation using modular evaluators
 */
export class AlertEngine {
  /**
   * Evaluate a single alert against market and news data
   * @param alert - Alert to evaluate
   * @param marketData - Current market data
   * @param newsData - Optional news data
   * @param historicalData - Optional historical price data
   * @returns evaluation result with triggered status and optional event
   */
  static async evaluateAlert(
    alert: Alert,
    marketData: MarketData,
    newsData?: NewsData,
    historicalData?: PriceDataPoint[]
  ): Promise<{ triggered: boolean; event?: AlertTriggerEvent }> {
    // Check if alert is active
    if (alert.status !== 'ACTIVE') {
      return { triggered: false };
    }

    // Validate ticker match between alert and market data
    if (!marketData || marketData.ticker !== alert.ticker) {
      console.warn(
        `[Alert Engine] Ticker mismatch for alert ${alert.id}: ` +
        `expected '${alert.ticker}', received '${marketData?.ticker || 'undefined'}'`
      );
      return { triggered: false };
    }

    // Check if alert has expired
    const expiryDate = coerceToValidDate(alert.expiresAt);
    if (expiryDate && new Date() > expiryDate) {
      return { triggered: false };
    }

    // Check DND settings
    if (isInDNDPeriod(alert.dndSettings)) {
      console.log(`[Alert Engine] Alert ${alert.id} in DND period`);
      return { triggered: false };
    }

    // Check cooldown period
    if (isInCooldownPeriod(alert)) {
      console.log(`[Alert Engine] Alert ${alert.id} in cooldown period`);
      return { triggered: false };
    }

    // Check daily limit
    if (hasReachedDailyLimit(alert)) {
      console.log(`[Alert Engine] Alert ${alert.id} reached daily limit`);
      return { triggered: false };
    }

    let triggered = false;
    let triggerReason = '';
    let conditionsMet: string[] = [];

    // Evaluate based on alert type with error handling
    try {
      switch (alert.type) {
        case 'THRESHOLD':
        case 'MULTI_CONDITION':
          try {
            ({ triggered, triggerReason, conditionsMet } = evaluateConditions(
              alert.conditionGroups,
              marketData,
              newsData
            ));
          } catch (error) {
            console.error(
              `[Alert Engine] Error evaluating conditions for alert ${alert.id} (${alert.type}):`,
              error
            );
            triggered = false;
            triggerReason = `evaluator_error: ${error instanceof Error ? error.message : 'unknown error'}`;
            conditionsMet = [];
          }
          break;

        case 'NEWS_TRIGGERED':
          try {
            ({ triggered, triggerReason, conditionsMet } = evaluateNewsTrigger(
              newsData
            ));
          } catch (error) {
            console.error(
              `[Alert Engine] Error evaluating news trigger for alert ${alert.id}:`,
              error
            );
            triggered = false;
            triggerReason = `evaluator_error: ${error instanceof Error ? error.message : 'unknown error'}`;
            conditionsMet = [];
          }
          break;

        case 'ANOMALY':
          try {
            ({ triggered, triggerReason, conditionsMet } = evaluateAnomaly(
              marketData,
              newsData,
              historicalData,
              alert.anomalyConfig || {
                priceChangeThreshold: 15,
                volumeSpikeMultiplier: 5,
                statisticalSigma: 2,
                requiresNoNews: true,
                newsLookbackHours: 24,
              }
            ));
          } catch (error) {
            console.error(
              `[Alert Engine] Error evaluating anomaly for alert ${alert.id}:`,
              error
            );
            triggered = false;
            triggerReason = `evaluator_error: ${error instanceof Error ? error.message : 'unknown error'}`;
            conditionsMet = [];
          }
          break;

        default:
          console.warn(`[Alert Engine] Unknown alert type: ${alert.type}`);
      }
    } catch (error) {
      // Catch any unexpected errors from the switch statement itself
      console.error(
        `[Alert Engine] Unexpected error in alert evaluation for alert ${alert.id}:`,
        error
      );
      triggered = false;
      triggerReason = `switch_error: ${error instanceof Error ? error.message : 'unknown error'}`;
      conditionsMet = [];
    }

    if (triggered) {
      const event: AlertTriggerEvent = {
        id: crypto.randomUUID(),
        alertId: alert.id,
        ticker: alert.ticker,
        triggeredAt: new Date(),
        triggerReason,
        conditionsMet,
        priceAtTrigger: marketData.price,
        volumeAtTrigger: marketData.volume,
        newsCount: newsData?.newsCount,
        sentiment: newsData?.averageSentiment,
        userAction: 'PENDING',
      };

      return { triggered: true, event };
    }

    return { triggered: false };
  }
}

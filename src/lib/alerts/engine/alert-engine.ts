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

    // Check if alert has expired
    if (alert.expiresAt && new Date() > alert.expiresAt) {
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

    // Evaluate based on alert type
    switch (alert.type) {
      case 'THRESHOLD':
      case 'MULTI_CONDITION':
        ({ triggered, triggerReason, conditionsMet } = evaluateConditions(
          alert.conditionGroups,
          marketData,
          newsData
        ));
        break;

      case 'NEWS_TRIGGERED':
        ({ triggered, triggerReason, conditionsMet } = evaluateNewsTrigger(
          newsData
        ));
        break;

      case 'ANOMALY':
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
        break;

      default:
        console.warn(`[Alert Engine] Unknown alert type: ${alert.type}`);
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

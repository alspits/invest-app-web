import {
  Alert,
  AlertCondition,
  AlertConditionGroup,
  AlertTriggerEvent,
  AlertOperator,
  AlertConditionField,
  AnomalyConfig,
} from '@/types/alert';
import { NewsItem } from '@/lib/news-api';

// ============================================================================
// Market Data Interface
// ============================================================================

/**
 * Market data required for alert evaluation
 */
export interface MarketData {
  ticker: string;
  price: number;
  previousClose: number;
  volume: number;
  averageVolume?: number;
  peRatio?: number;
  rsi?: number;
  movingAvg50?: number;
  movingAvg200?: number;
  marketCap?: number;
  timestamp: Date;
}

/**
 * News data for alert evaluation
 */
export interface NewsData {
  ticker: string;
  articles: NewsItem[];
  averageSentiment?: number;
  newsCount: number;
}

/**
 * Historical price data point
 */
export interface PriceDataPoint {
  timestamp: Date;
  price: number;
  volume: number;
}

// ============================================================================
// Alert Engine Core
// ============================================================================

export class AlertEngine {
  /**
   * Evaluate a single alert against market and news data
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
    if (this.isInDNDPeriod(alert.dndSettings)) {
      console.log(`[Alert Engine] Alert ${alert.id} in DND period`);
      return { triggered: false };
    }

    // Check cooldown period
    if (this.isInCooldownPeriod(alert)) {
      console.log(`[Alert Engine] Alert ${alert.id} in cooldown period`);
      return { triggered: false };
    }

    // Check daily limit
    if (this.hasReachedDailyLimit(alert)) {
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
        ({ triggered, triggerReason, conditionsMet } = this.evaluateConditions(
          alert.conditionGroups,
          marketData,
          newsData
        ));
        break;

      case 'NEWS_TRIGGERED':
        ({ triggered, triggerReason, conditionsMet } = this.evaluateNewsTrigger(
          alert,
          newsData
        ));
        break;

      case 'ANOMALY':
        ({ triggered, triggerReason, conditionsMet } = this.evaluateAnomaly(
          alert,
          marketData,
          newsData,
          historicalData
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

  /**
   * Evaluate condition groups with boolean logic
   */
  private static evaluateConditions(
    conditionGroups: AlertConditionGroup[],
    marketData: MarketData,
    newsData?: NewsData
  ): { triggered: boolean; triggerReason: string; conditionsMet: string[] } {
    let conditionsMet: string[] = [];
    let triggered = false;

    for (const group of conditionGroups) {
      const groupResults = group.conditions.map((condition) =>
        this.evaluateSingleCondition(condition, marketData, newsData)
      );

      const groupMet =
        group.logic === 'AND'
          ? groupResults.every((r) => r.met)
          : groupResults.some((r) => r.met);

      if (groupMet) {
        triggered = true;
        conditionsMet = [
          ...conditionsMet,
          ...groupResults.filter((r) => r.met).map((r) => r.description)
        ];
      }
    }

    const triggerReason = triggered
      ? `Conditions met: ${conditionsMet.join(', ')}`
      : 'No conditions met';

    return { triggered, triggerReason, conditionsMet };
  }

  /**
   * Evaluate a single condition
   */
  private static evaluateSingleCondition(
    condition: AlertCondition,
    marketData: MarketData,
    newsData?: NewsData
  ): { met: boolean; description: string } {
    const fieldValue = this.getFieldValue(condition.field, marketData, newsData);

    if (fieldValue === null) {
      return { met: false, description: `${condition.field} data unavailable` };
    }

    const met = this.compareValues(fieldValue, condition.operator, condition.value);

    const description = `${condition.field} ${this.operatorToSymbol(
      condition.operator
    )} ${condition.value} (actual: ${fieldValue.toFixed(2)})`;

    return { met, description };
  }

  /**
   * Get field value from market/news data
   */
  private static getFieldValue(
    field: AlertConditionField,
    marketData: MarketData,
    newsData?: NewsData
  ): number | null {
    switch (field) {
      case 'PRICE':
        return marketData.price;

      case 'PRICE_CHANGE':
        return (
          ((marketData.price - marketData.previousClose) / marketData.previousClose) *
          100
        );

      case 'VOLUME':
        return marketData.volume;

      case 'VOLUME_RATIO':
        return marketData.averageVolume
          ? marketData.volume / marketData.averageVolume
          : null;

      case 'PE_RATIO':
        return marketData.peRatio ?? null;

      case 'RSI':
        return marketData.rsi ?? null;

      case 'MOVING_AVG_50':
        return marketData.movingAvg50 ?? null;

      case 'MOVING_AVG_200':
        return marketData.movingAvg200 ?? null;

      case 'NEWS_SENTIMENT':
        return newsData?.averageSentiment ?? null;

      case 'MARKET_CAP':
        return marketData.marketCap ?? null;

      default:
        return null;
    }
  }

  /**
   * Compare values using operator
   */
  private static compareValues(
    actual: number,
    operator: AlertOperator,
    target: number
  ): boolean {
    switch (operator) {
      case 'GREATER_THAN':
        return actual > target;

      case 'LESS_THAN':
        return actual < target;

      case 'GREATER_THAN_EQUAL':
        return actual >= target;

      case 'LESS_THAN_EQUAL':
        return actual <= target;

      case 'EQUAL':
        return Math.abs(actual - target) < 0.01; // Floating point tolerance

      case 'NOT_EQUAL':
        return Math.abs(actual - target) >= 0.01;

      case 'PERCENTAGE_CHANGE':
        // Target is the percentage change threshold
        return Math.abs(actual) >= target;

      case 'CROSSES_ABOVE':
      case 'CROSSES_BELOW':
        // These require historical data, handled separately
        return false;

      default:
        return false;
    }
  }

  /**
   * Evaluate news-triggered alert
   */
  private static evaluateNewsTrigger(
    alert: Alert,
    newsData?: NewsData
  ): { triggered: boolean; triggerReason: string; conditionsMet: string[] } {
    if (!newsData || newsData.newsCount === 0) {
      return {
        triggered: false,
        triggerReason: 'No news data available',
        conditionsMet: [],
      };
    }

    // Check for negative sentiment threshold
    const sentimentThreshold = -0.3; // Configurable
    const hasNegativeSentiment =
      newsData.averageSentiment !== undefined &&
      newsData.averageSentiment < sentimentThreshold;

    if (hasNegativeSentiment) {
      return {
        triggered: true,
        triggerReason: `Negative news sentiment detected: ${newsData.averageSentiment?.toFixed(2)}`,
        conditionsMet: [
          `${newsData.newsCount} news articles with negative sentiment`,
        ],
      };
    }

    return {
      triggered: false,
      triggerReason: 'No negative news sentiment',
      conditionsMet: [],
    };
  }

  /**
   * Evaluate anomaly detection alert
   */
  private static evaluateAnomaly(
    alert: Alert,
    marketData: MarketData,
    newsData?: NewsData,
    historicalData?: PriceDataPoint[]
  ): { triggered: boolean; triggerReason: string; conditionsMet: string[] } {
    const config = alert.anomalyConfig || {
      priceChangeThreshold: 15,
      volumeSpikeMultiplier: 5,
      statisticalSigma: 2,
      requiresNoNews: true,
      newsLookbackHours: 24,
    };

    const conditionsMet: string[] = [];

    // 1. Check price change anomaly
    const priceChange =
      ((marketData.price - marketData.previousClose) / marketData.previousClose) *
      100;
    const isPriceAnomaly = Math.abs(priceChange) >= config.priceChangeThreshold;

    if (isPriceAnomaly) {
      conditionsMet.push(
        `Price change: ${priceChange.toFixed(2)}% (threshold: ${config.priceChangeThreshold}%)`
      );
    }

    // 2. Check volume spike
    const isVolumeSpike =
      marketData.averageVolume &&
      marketData.volume >= marketData.averageVolume * config.volumeSpikeMultiplier;

    if (isVolumeSpike) {
      conditionsMet.push(
        `Volume spike: ${(marketData.volume / (marketData.averageVolume || 1)).toFixed(1)}x average`
      );
    }

    // 3. Check statistical outlier (if historical data available)
    let isStatisticalOutlier = false;
    if (historicalData && historicalData.length >= 20) {
      const { mean, stdDev } = this.calculateStatistics(historicalData);
      const zScore = Math.abs((marketData.price - mean) / stdDev);
      isStatisticalOutlier = zScore >= config.statisticalSigma;

      if (isStatisticalOutlier) {
        conditionsMet.push(
          `Statistical outlier: ${zScore.toFixed(2)}σ from mean`
        );
      }
    }

    // 4. Check news requirement
    const hasRecentNews = newsData && newsData.newsCount > 0;
    const meetsNewsRequirement = config.requiresNoNews ? !hasRecentNews : true;

    if (config.requiresNoNews && hasRecentNews) {
      // Anomaly not triggered because news explains the movement
      return {
        triggered: false,
        triggerReason: 'Anomaly detected but explained by news',
        conditionsMet: [],
      };
    }

    // Trigger if any anomaly is detected and news requirement is met
    const triggered =
      (isPriceAnomaly || isVolumeSpike || isStatisticalOutlier) &&
      meetsNewsRequirement;

    const triggerReason = triggered
      ? `Anomaly detected: ${conditionsMet.join('; ')}`
      : 'No anomaly detected';

    return { triggered, triggerReason, conditionsMet };
  }

  /**
   * Calculate mean and standard deviation
   */
  private static calculateStatistics(data: PriceDataPoint[]): {
    mean: number;
    stdDev: number;
  } {
    const prices = data.map((d) => d.price);
    const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;

    const variance =
      prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);

    return { mean, stdDev };
  }

  /**
   * Check if current time is in DND period
   */
  private static isInDNDPeriod(dndSettings: Alert['dndSettings']): boolean {
    if (!dndSettings.enabled) return false;

    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Check if current day is in DND days
    if (!dndSettings.days.includes(currentDay)) {
      return false;
    }

    // Check if current time is in DND time range
    const { startTime, endTime } = dndSettings;

    // Handle overnight DND (e.g., 22:00 to 08:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    }

    // Handle same-day DND (e.g., 12:00 to 14:00)
    return currentTime >= startTime && currentTime <= endTime;
  }

  /**
   * Check if alert is in cooldown period
   */
  private static isInCooldownPeriod(alert: Alert): boolean {
    if (!alert.lastTriggeredAt) return false;

    const cooldownMs = alert.frequency.cooldownMinutes * 60 * 1000;
    const timeSinceLastTrigger = Date.now() - alert.lastTriggeredAt.getTime();

    return timeSinceLastTrigger < cooldownMs;
  }

  /**
   * Check if alert has reached daily limit
   */
  private static hasReachedDailyLimit(alert: Alert): boolean {
    // This would require checking trigger history
    // For now, we'll implement this in the store/database layer
    return false;
  }

  /**
   * Convert operator to symbol for display
   */
  private static operatorToSymbol(operator: AlertOperator): string {
    const symbols: Record<AlertOperator, string> = {
      GREATER_THAN: '>',
      LESS_THAN: '<',
      GREATER_THAN_EQUAL: '≥',
      LESS_THAN_EQUAL: '≤',
      EQUAL: '=',
      NOT_EQUAL: '≠',
      PERCENTAGE_CHANGE: '%Δ',
      CROSSES_ABOVE: '↑',
      CROSSES_BELOW: '↓',
    };

    return symbols[operator] || operator;
  }
}

// ============================================================================
// Alert Batching Engine
// ============================================================================

export class AlertBatcher {
  private batchedAlerts: Map<string, AlertTriggerEvent[]> = new Map();
  private batchTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Add alert to batch
   */
  addToBatch(
    ticker: string,
    event: AlertTriggerEvent,
    windowMinutes: number,
    onBatchReady: (ticker: string, events: AlertTriggerEvent[]) => void
  ): void {
    // Get or create batch for ticker
    const existing = this.batchedAlerts.get(ticker) || [];
    existing.push(event);
    this.batchedAlerts.set(ticker, existing);

    // Clear existing timer
    const existingTimer = this.batchTimers.get(ticker);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      const events = this.batchedAlerts.get(ticker) || [];
      if (events.length > 0) {
        onBatchReady(ticker, events);
        this.batchedAlerts.delete(ticker);
        this.batchTimers.delete(ticker);
      }
    }, windowMinutes * 60 * 1000);

    this.batchTimers.set(ticker, timer);
  }

  /**
   * Flush all batches immediately
   */
  flushAll(onBatchReady: (ticker: string, events: AlertTriggerEvent[]) => void): void {
    // Clear all timers
    this.batchTimers.forEach((timer) => clearTimeout(timer));
    this.batchTimers.clear();

    // Process all batches
    this.batchedAlerts.forEach((events, ticker) => {
      if (events.length > 0) {
        onBatchReady(ticker, events);
      }
    });

    // Clear batches
    this.batchedAlerts.clear();
  }
}

// ============================================================================
// Sentiment Analysis (Simple Implementation)
// ============================================================================

export class SentimentAnalyzer {
  /**
   * Calculate average sentiment from news articles
   * Returns value between -1 (very negative) and 1 (very positive)
   */
  static calculateSentiment(articles: NewsItem[]): number {
    if (articles.length === 0) return 0;

    // Simple keyword-based sentiment
    const sentiments = articles.map((article) =>
      this.analyzeSingleArticle(article)
    );

    return sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length;
  }

  /**
   * Analyze single article sentiment
   */
  private static analyzeSingleArticle(article: NewsItem): number {
    const text = `${article.title} ${article.description || ''}`.toLowerCase();

    // Negative keywords
    const negativeKeywords = [
      'падение',
      'снижение',
      'убыток',
      'кризис',
      'банкротство',
      'риск',
      'потери',
      'долг',
      'падают',
      'снижаются',
      'обвал',
      'дефолт',
      'санкции',
    ];

    // Positive keywords
    const positiveKeywords = [
      'рост',
      'прибыль',
      'успех',
      'достижение',
      'увеличение',
      'дивиденд',
      'растут',
      'повышение',
      'расширение',
      'инновация',
      'лидер',
      'прорыв',
    ];

    let score = 0;

    negativeKeywords.forEach((keyword) => {
      if (text.includes(keyword)) score -= 0.2;
    });

    positiveKeywords.forEach((keyword) => {
      if (text.includes(keyword)) score += 0.2;
    });

    // Clamp between -1 and 1
    return Math.max(-1, Math.min(1, score));
  }
}

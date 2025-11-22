import { moneyValueToNumber } from '@/lib/tinkoff-api';
import type {
  Operation,
  TradingPattern,
  PatternCategory,
  PatternMetrics,
  EmotionalTrigger,
  TradePair,
  InstrumentOperations,
  PatternDetectionConfig,
  PatternStats,
  PatternAnalysis,
  DEFAULT_PATTERN_CONFIG,
} from '@/types/trading-pattern';

// ============================================================================
// Core Pattern Detection Service
// ============================================================================

/**
 * Main service for detecting trading patterns and behavioral insights
 */
export class PatternRecognitionService {
  private config: PatternDetectionConfig;

  constructor(config: Partial<PatternDetectionConfig> = {}) {
    // Import default config from types
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
   */
  async analyzePatterns(
    accountId: string,
    operations: Operation[]
  ): Promise<PatternAnalysis> {
    // Filter executed operations only (ignore canceled)
    const executedOps = operations.filter((op) => op.state === 'executed');

    // Group operations by instrument
    const groupedOps = this.groupOperationsByInstrument(executedOps);

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
    const statistics = this.calculateStatistics(allPatterns);

    // Generate summary
    const summary = this.generateSummary(allPatterns, statistics, operations);

    // Generate recommendations
    const recommendations = this.generateRecommendations(statistics, summary);

    return {
      patterns: allPatterns,
      statistics,
      summary,
      recommendations,
    };
  }

  /**
   * Group operations by instrument (FIGI)
   */
  private groupOperationsByInstrument(
    operations: Operation[]
  ): InstrumentOperations[] {
    const grouped = new Map<string, Operation[]>();

    for (const op of operations) {
      if (!grouped.has(op.figi)) {
        grouped.set(op.figi, []);
      }
      grouped.get(op.figi)!.push(op);
    }

    return Array.from(grouped.entries()).map(([figi, ops]) => ({
      figi,
      operations: ops.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
    }));
  }

  /**
   * Detect patterns for a specific instrument
   */
  private async detectInstrumentPatterns(
    accountId: string,
    instrumentOps: InstrumentOperations
  ): Promise<TradingPattern[]> {
    const patterns: TradingPattern[] = [];

    // Extract buy and sell operations
    const buys = instrumentOps.operations.filter((op) =>
      this.isBuyOperation(op)
    );
    const sells = instrumentOps.operations.filter((op) =>
      this.isSellOperation(op)
    );

    // Create trade pairs (FIFO matching)
    const tradePairs = this.matchTradePairs(buys, sells);

    // Analyze each trade pair for patterns
    for (const pair of tradePairs) {
      const pattern = await this.analyzeTracePair(
        accountId,
        pair,
        instrumentOps
      );
      if (pattern) {
        patterns.push(pattern);
      }
    }

    // Detect patterns that don't require pairs (e.g., FOMO buys without sells)
    const standalonePatterns = await this.detectStandalonePatterns(
      accountId,
      instrumentOps
    );
    patterns.push(...standalonePatterns);

    return patterns;
  }

  /**
   * Check if operation is a buy
   */
  private isBuyOperation(op: Operation): boolean {
    return (
      op.type.toLowerCase().includes('buy') ||
      op.operationType?.toLowerCase().includes('buy') ||
      false
    );
  }

  /**
   * Check if operation is a sell
   */
  private isSellOperation(op: Operation): boolean {
    return (
      op.type.toLowerCase().includes('sell') ||
      op.operationType?.toLowerCase().includes('sell') ||
      false
    );
  }

  /**
   * Match buy and sell operations into trade pairs (FIFO)
   */
  private matchTradePairs(
    buys: Operation[],
    sells: Operation[]
  ): TradePair[] {
    const pairs: TradePair[] = [];
    const remainingBuys = [...buys];
    const remainingSells = [...sells];

    for (const sell of remainingSells) {
      // Find oldest buy that hasn't been fully matched
      const buyIndex = remainingBuys.findIndex(
        (buy) => new Date(buy.date) < new Date(sell.date)
      );

      if (buyIndex !== -1) {
        const buy = remainingBuys[buyIndex];

        // Calculate P&L
        const buyPrice = buy.price ? moneyValueToNumber(buy.price) : 0;
        const sellPrice = sell.price ? moneyValueToNumber(sell.price) : 0;
        const profitLoss = (sellPrice - buyPrice) * sell.quantity;
        const profitLossPercentage =
          buyPrice > 0 ? ((sellPrice - buyPrice) / buyPrice) * 100 : 0;

        // Calculate holding period
        const holdingPeriodMs =
          new Date(sell.date).getTime() - new Date(buy.date).getTime();
        const holdingPeriodDays = holdingPeriodMs / (1000 * 60 * 60 * 24);

        pairs.push({
          buyOperation: buy,
          sellOperation: sell,
          profitLoss,
          profitLossPercentage,
          holdingPeriodDays,
        });

        // Remove matched buy
        remainingBuys.splice(buyIndex, 1);
      }
    }

    return pairs;
  }

  /**
   * Analyze a trade pair and detect pattern
   */
  private async analyzeTracePair(
    accountId: string,
    pair: TradePair,
    instrumentOps: InstrumentOperations
  ): Promise<TradingPattern | null> {
    const triggers: EmotionalTrigger[] = [];
    let category: PatternCategory = 'strategic';
    let confidence = 50;

    // Detect Panic Sell
    if (this.isPanicSell(pair)) {
      category = 'panic_sell';
      confidence = 80;
      triggers.push(
        this.createTrigger('panic', 'high', pair.sellOperation.date, [
          pair.sellOperation.id,
        ])
      );
    }
    // Detect FOMO Buy
    else if (this.isFOMOBuy(pair, instrumentOps)) {
      category = 'fomo_buy';
      confidence = 75;
      triggers.push(
        this.createTrigger('fomo', 'high', pair.buyOperation.date, [
          pair.buyOperation.id,
        ])
      );
    }
    // Detect Strategic (Take Profit)
    else if (this.isStrategicTrade(pair)) {
      category = 'strategic';
      confidence = 85;
    }
    // Detect Emotional Trading
    else if (this.isEmotionalTrade(pair, instrumentOps)) {
      category = 'emotional';
      confidence = 70;
      triggers.push(
        this.createTrigger('volatility', 'medium', pair.sellOperation.date, [
          pair.buyOperation.id,
          pair.sellOperation.id,
        ])
      );
    }

    // Calculate metrics
    const metrics: PatternMetrics = {
      profitLoss: pair.profitLossPercentage,
      profitLossAbsolute: pair.profitLoss,
      timeToComplete: pair.holdingPeriodDays,
      priceChangeAtEntry: 0, // TODO: Fetch historical prices
      priceChangeAtExit: 0, // TODO: Fetch historical prices
      marketContext: 'sideways', // TODO: Determine market context
      volatility: 0, // TODO: Calculate volatility
    };

    return {
      id: `${pair.buyOperation.id}-${pair.sellOperation.id}`,
      accountId,
      category,
      operations: [pair.buyOperation, pair.sellOperation],
      detectedAt: new Date(),
      confidence,
      metrics,
      triggers,
      ticker: instrumentOps.ticker,
      instrumentName: instrumentOps.name,
    };
  }

  /**
   * Detect patterns that don't require sell operations
   */
  private async detectStandalonePatterns(
    accountId: string,
    instrumentOps: InstrumentOperations
  ): Promise<TradingPattern[]> {
    const patterns: TradingPattern[] = [];

    // Detect rapid buying (FOMO) without sells
    const buys = instrumentOps.operations.filter((op) =>
      this.isBuyOperation(op)
    );

    for (let i = 1; i < buys.length; i++) {
      const prevBuy = buys[i - 1];
      const currentBuy = buys[i];

      const timeDiffMinutes =
        (new Date(currentBuy.date).getTime() -
          new Date(prevBuy.date).getTime()) /
        (1000 * 60);

      if (timeDiffMinutes < this.config.fomoBuyImpulseWindowMinutes) {
        patterns.push({
          id: `fomo-${currentBuy.id}`,
          accountId,
          category: 'fomo_buy',
          operations: [currentBuy],
          detectedAt: new Date(),
          confidence: 70,
          metrics: {
            profitLoss: 0,
            profitLossAbsolute: 0,
            timeToComplete: 0,
            priceChangeAtEntry: 0,
            marketContext: 'sideways',
            volatility: 0,
          },
          triggers: [
            this.createTrigger('fomo', 'medium', currentBuy.date, [
              currentBuy.id,
            ]),
          ],
          ticker: instrumentOps.ticker,
          instrumentName: instrumentOps.name,
        });
      }
    }

    return patterns;
  }

  /**
   * Check if trade is a panic sell
   */
  private isPanicSell(pair: TradePair): boolean {
    // Large loss
    if (pair.profitLossPercentage < -this.config.panicSellLossThreshold) {
      return true;
    }

    // Quick sell after buy (less than 7 days) with loss
    if (
      pair.holdingPeriodDays < 7 &&
      pair.profitLossPercentage < -this.config.panicSellPriceDropThreshold
    ) {
      return true;
    }

    return false;
  }

  /**
   * Check if trade is a FOMO buy
   */
  private isFOMOBuy(
    pair: TradePair,
    instrumentOps: InstrumentOperations
  ): boolean {
    // Check if bought near recent highs or after rapid price increase
    // TODO: Implement with historical price data

    // For now, check if multiple buys in short period (impulse buying)
    const buys = instrumentOps.operations.filter((op) =>
      this.isBuyOperation(op)
    );
    const buyIndex = buys.findIndex((b) => b.id === pair.buyOperation.id);

    if (buyIndex > 0) {
      const prevBuy = buys[buyIndex - 1];
      const timeDiffMinutes =
        (new Date(pair.buyOperation.date).getTime() -
          new Date(prevBuy.date).getTime()) /
        (1000 * 60);

      if (timeDiffMinutes < this.config.fomoBuyImpulseWindowMinutes) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if trade is strategic
   */
  private isStrategicTrade(pair: TradePair): boolean {
    // Take profit (good profit and reasonable holding period)
    if (
      pair.profitLossPercentage > this.config.strategicTakeProfitThreshold &&
      pair.holdingPeriodDays > 7
    ) {
      return true;
    }

    // DCA pattern (regular purchases)
    // TODO: Implement DCA detection

    return false;
  }

  /**
   * Check if trade is emotional
   */
  private isEmotionalTrade(
    pair: TradePair,
    instrumentOps: InstrumentOperations
  ): boolean {
    // Very short holding period (day trading)
    if (
      pair.holdingPeriodDays <
      this.config.emotionalDayTradingWindowHours / 24
    ) {
      return true;
    }

    // Frequent trading (high turnover)
    const oneWeekAgo = new Date(pair.sellOperation.date);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentOps = instrumentOps.operations.filter(
      (op) => new Date(op.date) > oneWeekAgo
    );

    if (recentOps.length > this.config.emotionalFrequencyThreshold) {
      return true;
    }

    return false;
  }

  /**
   * Create an emotional trigger
   */
  private createTrigger(
    type: EmotionalTrigger['type'],
    severity: EmotionalTrigger['severity'],
    date: string,
    operationIds: string[]
  ): EmotionalTrigger {
    const descriptions: Record<string, string> = {
      panic: 'Паническая продажа после резкого падения',
      fomo: 'Импульсивная покупка (FOMO)',
      price_drop: 'Резкое падение цены',
      price_spike: 'Резкий рост цены',
      news: 'Реакция на новости',
      volatility: 'Высокая волатильность',
    };

    return {
      type,
      severity,
      detectedAt: new Date(date),
      description: descriptions[type] || 'Эмоциональный триггер',
      relatedOperations: operationIds,
    };
  }

  /**
   * Calculate statistics for all patterns
   */
  private calculateStatistics(patterns: TradingPattern[]): PatternStats[] {
    const categories: PatternCategory[] = [
      'panic_sell',
      'fomo_buy',
      'strategic',
      'emotional',
    ];

    return categories.map((category) => {
      const categoryPatterns = patterns.filter((p) => p.category === category);

      const successCount = categoryPatterns.filter(
        (p) => p.metrics.profitLoss > 0
      ).length;
      const failureCount = categoryPatterns.filter(
        (p) => p.metrics.profitLoss < 0
      ).length;

      const totalCount = categoryPatterns.length;
      const successRate = totalCount > 0 ? (successCount / totalCount) * 100 : 0;

      const averageProfitLoss =
        totalCount > 0
          ? categoryPatterns.reduce((sum, p) => sum + p.metrics.profitLoss, 0) /
            totalCount
          : 0;

      const averageTimeToComplete =
        totalCount > 0
          ? categoryPatterns.reduce(
              (sum, p) => sum + p.metrics.timeToComplete,
              0
            ) / totalCount
          : 0;

      const totalVolume = categoryPatterns.reduce(
        (sum, p) => sum + Math.abs(p.metrics.profitLossAbsolute),
        0
      );

      // Count common triggers
      const triggerCounts = new Map<string, number>();
      categoryPatterns.forEach((p) => {
        p.triggers.forEach((t) => {
          triggerCounts.set(t.type, (triggerCounts.get(t.type) || 0) + 1);
        });
      });

      const commonTriggers = Array.from(triggerCounts.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);

      return {
        category,
        totalCount,
        successCount,
        failureCount,
        successRate,
        averageProfitLoss,
        averageTimeToComplete,
        totalVolume,
        commonTriggers,
      };
    });
  }

  /**
   * Generate summary
   */
  private generateSummary(
    patterns: TradingPattern[],
    statistics: PatternStats[],
    allOperations: Operation[]
  ) {
    const totalPatterns = patterns.length;
    const totalOperations = allOperations.length;

    const overallProfitLoss =
      totalPatterns > 0
        ? patterns.reduce((sum, p) => sum + p.metrics.profitLoss, 0) /
          totalPatterns
        : 0;

    const mostCommonCategory =
      statistics.sort((a, b) => b.totalCount - a.totalCount)[0]?.category ||
      'strategic';

    const mostSuccessfulCategory =
      statistics.sort((a, b) => b.successRate - a.successRate)[0]?.category ||
      'strategic';

    // Calculate risk score (0-100, higher = more emotional/risky)
    const emotionalCount =
      statistics.find((s) => s.category === 'emotional')?.totalCount || 0;
    const panicCount =
      statistics.find((s) => s.category === 'panic_sell')?.totalCount || 0;
    const fomoCount =
      statistics.find((s) => s.category === 'fomo_buy')?.totalCount || 0;

    const riskScore = Math.min(
      100,
      ((emotionalCount + panicCount + fomoCount) / Math.max(totalPatterns, 1)) *
        100
    );

    return {
      totalPatterns,
      totalOperations,
      overallProfitLoss,
      mostCommonCategory,
      mostSuccessfulCategory,
      riskScore,
    };
  }

  /**
   * Generate recommendations based on patterns
   */
  private generateRecommendations(
    statistics: PatternStats[],
    summary: ReturnType<typeof this.generateSummary>
  ) {
    const recommendations: PatternAnalysis['recommendations'] = [];

    // High risk score
    if (summary.riskScore > 60) {
      recommendations.push({
        category: 'risk',
        message:
          'Высокий уровень эмоциональных сделок. Рекомендуется придерживаться стратегии и избегать импульсивных решений.',
        severity: 'critical',
      });
    }

    // Panic sells
    const panicStats = statistics.find((s) => s.category === 'panic_sell');
    if (panicStats && panicStats.totalCount > 0) {
      recommendations.push({
        category: 'panic_sell',
        message: `Обнаружено ${panicStats.totalCount} панических продаж со средним убытком ${panicStats.averageProfitLoss.toFixed(1)}%. Рассмотрите установку стоп-лоссов заранее.`,
        severity: panicStats.totalCount > 5 ? 'critical' : 'warning',
      });
    }

    // FOMO buys
    const fomoStats = statistics.find((s) => s.category === 'fomo_buy');
    if (fomoStats && fomoStats.totalCount > 0) {
      recommendations.push({
        category: 'fomo_buy',
        message: `Обнаружено ${fomoStats.totalCount} импульсивных покупок (FOMO). Успешность: ${fomoStats.successRate.toFixed(0)}%. Избегайте покупок на эмоциях.`,
        severity: fomoStats.successRate < 40 ? 'critical' : 'warning',
      });
    }

    // Strategic success
    const strategicStats = statistics.find((s) => s.category === 'strategic');
    if (strategicStats && strategicStats.successRate > 60) {
      recommendations.push({
        category: 'strategic',
        message: `Стратегические сделки показывают хорошую эффективность (${strategicStats.successRate.toFixed(0)}%). Продолжайте следовать плану.`,
        severity: 'info',
      });
    }

    return recommendations;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a pattern recognition service instance
 */
export function createPatternRecognitionService(
  config?: Partial<PatternDetectionConfig>
): PatternRecognitionService {
  return new PatternRecognitionService(config);
}

/**
 * Format pattern category for display
 */
export function formatPatternCategory(category: PatternCategory): string {
  const labels: Record<PatternCategory, string> = {
    panic_sell: 'Паническая продажа',
    fomo_buy: 'FOMO покупка',
    strategic: 'Стратегическая',
    emotional: 'Эмоциональная',
  };

  return labels[category];
}

/**
 * Get color for pattern category
 */
export function getPatternCategoryColor(category: PatternCategory): string {
  const colors: Record<PatternCategory, string> = {
    panic_sell: 'text-red-500',
    fomo_buy: 'text-orange-500',
    strategic: 'text-green-500',
    emotional: 'text-yellow-500',
  };

  return colors[category];
}

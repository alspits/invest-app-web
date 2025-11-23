import { calculateStatistics } from '../statistics-analyzer';
import type { TradingPattern } from '@/types/trading-pattern';

// Helper to create mock pattern
function createMockPattern(
  category: TradingPattern['category'],
  profitLoss: number
): TradingPattern {
  return {
    id: `pattern-${Math.random()}`,
    accountId: 'test-account',
    category,
    operations: [],
    detectedAt: new Date(),
    confidence: 80,
    metrics: {
      profitLoss,
      profitLossAbsolute: profitLoss * 1000,
      timeToComplete: 30,
      priceChangeAtEntry: 0,
      marketContext: 'sideways',
      volatility: 0.5,
    },
    triggers: [],
  };
}

describe('calculateStatistics', () => {
  describe('successRate calculation', () => {
    it('should calculate successRate correctly when there are wins and losses', () => {
      const patterns: TradingPattern[] = [
        createMockPattern('panic_sell', 10), // Win
        createMockPattern('panic_sell', -5), // Loss
        createMockPattern('panic_sell', 15), // Win
        createMockPattern('panic_sell', -3), // Loss
      ];

      const stats = calculateStatistics(patterns);
      const panicStats = stats.find((s) => s.category === 'panic_sell');

      expect(panicStats).toBeDefined();
      expect(panicStats!.totalCount).toBe(4);
      expect(panicStats!.successCount).toBe(2);
      expect(panicStats!.failureCount).toBe(2);
      expect(panicStats!.breakEvenCount).toBe(0);
      expect(panicStats!.successRate).toBe(50); // 2 / (2 + 2) * 100
    });

    it('should set successRate to null when all patterns are break-even', () => {
      const patterns: TradingPattern[] = [
        createMockPattern('fomo_buy', 0), // Break-even
        createMockPattern('fomo_buy', 0), // Break-even
        createMockPattern('fomo_buy', 0), // Break-even
      ];

      const stats = calculateStatistics(patterns);
      const fomoStats = stats.find((s) => s.category === 'fomo_buy');

      expect(fomoStats).toBeDefined();
      expect(fomoStats!.totalCount).toBe(3);
      expect(fomoStats!.successCount).toBe(0);
      expect(fomoStats!.failureCount).toBe(0);
      expect(fomoStats!.breakEvenCount).toBe(3);
      expect(fomoStats!.successRate).toBeNull();
    });

    it('should set successRate to null when category has no patterns', () => {
      const patterns: TradingPattern[] = [];

      const stats = calculateStatistics(patterns);
      const strategicStats = stats.find((s) => s.category === 'strategic');

      expect(strategicStats).toBeDefined();
      expect(strategicStats!.totalCount).toBe(0);
      expect(strategicStats!.successCount).toBe(0);
      expect(strategicStats!.failureCount).toBe(0);
      expect(strategicStats!.breakEvenCount).toBe(0);
      expect(strategicStats!.successRate).toBeNull();
    });

    it('should exclude break-even patterns from successRate calculation', () => {
      const patterns: TradingPattern[] = [
        createMockPattern('strategic', 20), // Win
        createMockPattern('strategic', 0), // Break-even (excluded)
        createMockPattern('strategic', -10), // Loss
        createMockPattern('strategic', 0), // Break-even (excluded)
        createMockPattern('strategic', 5), // Win
      ];

      const stats = calculateStatistics(patterns);
      const strategicStats = stats.find((s) => s.category === 'strategic');

      expect(strategicStats).toBeDefined();
      expect(strategicStats!.totalCount).toBe(5);
      expect(strategicStats!.successCount).toBe(2);
      expect(strategicStats!.failureCount).toBe(1);
      expect(strategicStats!.breakEvenCount).toBe(2);
      // successRate = 2 / (2 + 1) * 100 = 66.67%
      expect(strategicStats!.successRate).toBeCloseTo(66.67, 1);
    });
  });

  describe('breakEvenCount calculation', () => {
    it('should correctly count break-even patterns', () => {
      const patterns: TradingPattern[] = [
        createMockPattern('emotional', 10), // Win
        createMockPattern('emotional', 0), // Break-even
        createMockPattern('emotional', 0), // Break-even
        createMockPattern('emotional', -5), // Loss
        createMockPattern('emotional', 0), // Break-even
      ];

      const stats = calculateStatistics(patterns);
      const emotionalStats = stats.find((s) => s.category === 'emotional');

      expect(emotionalStats).toBeDefined();
      expect(emotionalStats!.totalCount).toBe(5);
      expect(emotionalStats!.successCount).toBe(1);
      expect(emotionalStats!.failureCount).toBe(1);
      expect(emotionalStats!.breakEvenCount).toBe(3);
    });

    it('should handle mixed scenarios correctly', () => {
      const patterns: TradingPattern[] = [
        createMockPattern('panic_sell', 5), // Win
        createMockPattern('panic_sell', 10), // Win
        createMockPattern('panic_sell', -3), // Loss
        createMockPattern('fomo_buy', 0), // Break-even
        createMockPattern('fomo_buy', -2), // Loss
        createMockPattern('strategic', 15), // Win
        createMockPattern('strategic', 0), // Break-even
        createMockPattern('strategic', 0), // Break-even
        createMockPattern('emotional', -1), // Loss
      ];

      const stats = calculateStatistics(patterns);

      const panicStats = stats.find((s) => s.category === 'panic_sell');
      expect(panicStats!.totalCount).toBe(3);
      expect(panicStats!.breakEvenCount).toBe(0);
      expect(panicStats!.successRate).toBeCloseTo(66.67, 1); // 2/(2+1)

      const fomoStats = stats.find((s) => s.category === 'fomo_buy');
      expect(fomoStats!.totalCount).toBe(2);
      expect(fomoStats!.breakEvenCount).toBe(1);
      expect(fomoStats!.successRate).toBe(0); // 0/(0+1)

      const strategicStats = stats.find((s) => s.category === 'strategic');
      expect(strategicStats!.totalCount).toBe(3);
      expect(strategicStats!.breakEvenCount).toBe(2);
      expect(strategicStats!.successRate).toBe(100); // 1/(1+0)

      const emotionalStats = stats.find((s) => s.category === 'emotional');
      expect(emotionalStats!.totalCount).toBe(1);
      expect(emotionalStats!.breakEvenCount).toBe(0);
      expect(emotionalStats!.successRate).toBe(0); // 0/(0+1)
    });
  });

  describe('all categories present', () => {
    it('should return stats for all 4 categories even if some are empty', () => {
      const patterns: TradingPattern[] = [
        createMockPattern('panic_sell', 5),
      ];

      const stats = calculateStatistics(patterns);

      expect(stats).toHaveLength(4);
      expect(stats.map((s) => s.category).sort()).toEqual([
        'emotional',
        'fomo_buy',
        'panic_sell',
        'strategic',
      ]);
    });
  });
});

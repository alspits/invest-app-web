/**
 * Alert Engine Tests
 *
 * Basic tests to verify alert engine functionality
 */

import { AlertEngine, MarketData, NewsData } from '../engine';
import {
  Alert,
  createAlert,
  createConditionGroup,
  createAlertCondition,
  DEFAULT_ALERT_FREQUENCY,
  DEFAULT_DND_SETTINGS,
} from '@/types/alert';

describe('AlertEngine', () => {
  const mockMarketData: MarketData = {
    ticker: 'SBER',
    price: 255.5,
    previousClose: 250.0,
    volume: 10000000,
    averageVolume: 8000000,
    peRatio: 4.2,
    rsi: 65,
    movingAvg50: 248.0,
    movingAvg200: 240.0,
    timestamp: new Date(),
  };

  describe('Threshold Alerts', () => {
    test('should trigger when price exceeds threshold', async () => {
      const alert = createAlert(
        'SBER',
        'Price Alert',
        'THRESHOLD',
        [
          createConditionGroup('AND', [
            createAlertCondition('PRICE', 'GREATER_THAN', 250),
          ]),
        ]
      );

      const fullAlert: Alert = {
        ...alert,
        id: 'test-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        triggeredCount: 0,
      };

      const { triggered, event } = await AlertEngine.evaluateAlert(
        fullAlert,
        mockMarketData
      );

      expect(triggered).toBe(true);
      expect(event).toBeDefined();
      expect(event?.priceAtTrigger).toBe(255.5);
    });

    test('should not trigger when price below threshold', async () => {
      const alert = createAlert(
        'SBER',
        'Price Alert',
        'THRESHOLD',
        [
          createConditionGroup('AND', [
            createAlertCondition('PRICE', 'GREATER_THAN', 300),
          ]),
        ]
      );

      const fullAlert: Alert = {
        ...alert,
        id: 'test-2',
        createdAt: new Date(),
        updatedAt: new Date(),
        triggeredCount: 0,
      };

      const { triggered } = await AlertEngine.evaluateAlert(
        fullAlert,
        mockMarketData
      );

      expect(triggered).toBe(false);
    });
  });

  describe('Multi-Condition Alerts', () => {
    test('should trigger when all AND conditions met', async () => {
      const alert = createAlert(
        'SBER',
        'Multi-Condition Alert',
        'MULTI_CONDITION',
        [
          createConditionGroup('AND', [
            createAlertCondition('PRICE', 'GREATER_THAN', 250),
            createAlertCondition('PE_RATIO', 'LESS_THAN', 5),
            createAlertCondition('RSI', 'GREATER_THAN', 60),
          ]),
        ]
      );

      const fullAlert: Alert = {
        ...alert,
        id: 'test-3',
        createdAt: new Date(),
        updatedAt: new Date(),
        triggeredCount: 0,
      };

      const { triggered, event } = await AlertEngine.evaluateAlert(
        fullAlert,
        mockMarketData
      );

      expect(triggered).toBe(true);
      expect(event?.conditionsMet.length).toBeGreaterThan(0);
    });

    test('should not trigger when one AND condition fails', async () => {
      const alert = createAlert(
        'SBER',
        'Multi-Condition Alert',
        'MULTI_CONDITION',
        [
          createConditionGroup('AND', [
            createAlertCondition('PRICE', 'GREATER_THAN', 250),
            createAlertCondition('PE_RATIO', 'LESS_THAN', 3), // This fails
            createAlertCondition('RSI', 'GREATER_THAN', 60),
          ]),
        ]
      );

      const fullAlert: Alert = {
        ...alert,
        id: 'test-4',
        createdAt: new Date(),
        updatedAt: new Date(),
        triggeredCount: 0,
      };

      const { triggered } = await AlertEngine.evaluateAlert(
        fullAlert,
        mockMarketData
      );

      expect(triggered).toBe(false);
    });

    test('should trigger when any OR condition met', async () => {
      const alert = createAlert(
        'SBER',
        'OR Alert',
        'MULTI_CONDITION',
        [
          createConditionGroup('OR', [
            createAlertCondition('PRICE', 'GREATER_THAN', 300), // Fails
            createAlertCondition('PE_RATIO', 'LESS_THAN', 5),    // Passes
          ]),
        ]
      );

      const fullAlert: Alert = {
        ...alert,
        id: 'test-5',
        createdAt: new Date(),
        updatedAt: new Date(),
        triggeredCount: 0,
      };

      const { triggered } = await AlertEngine.evaluateAlert(
        fullAlert,
        mockMarketData
      );

      expect(triggered).toBe(true);
    });
  });

  describe('DND Mode', () => {
    test('should not trigger during DND period', async () => {
      const now = new Date();
      const currentHour = now.getHours();

      // Set DND to current time
      const dndStart = `${currentHour.toString().padStart(2, '0')}:00`;
      const dndEnd = `${((currentHour + 1) % 24).toString().padStart(2, '0')}:00`;

      const alert = createAlert(
        'SBER',
        'DND Alert',
        'THRESHOLD',
        [
          createConditionGroup('AND', [
            createAlertCondition('PRICE', 'GREATER_THAN', 250),
          ]),
        ]
      );

      const fullAlert: Alert = {
        ...alert,
        id: 'test-6',
        createdAt: new Date(),
        updatedAt: new Date(),
        triggeredCount: 0,
        dndSettings: {
          enabled: true,
          startTime: dndStart,
          endTime: dndEnd,
          days: [0, 1, 2, 3, 4, 5, 6],
        },
      };

      const { triggered } = await AlertEngine.evaluateAlert(
        fullAlert,
        mockMarketData
      );

      expect(triggered).toBe(false);
    });
  });

  describe('Anomaly Detection', () => {
    test('should detect price change anomaly', async () => {
      const anomalyMarketData: MarketData = {
        ticker: 'SBER',
        price: 287.5, // 15% increase from 250
        previousClose: 250.0,
        volume: 8000000,
        averageVolume: 8000000,
        timestamp: new Date(),
      };

      const alert = createAlert('SBER', 'Anomaly Detector', 'ANOMALY', []);

      const fullAlert: Alert = {
        ...alert,
        id: 'test-7',
        createdAt: new Date(),
        updatedAt: new Date(),
        triggeredCount: 0,
        anomalyConfig: {
          priceChangeThreshold: 15,
          volumeSpikeMultiplier: 5,
          statisticalSigma: 2,
          requiresNoNews: false, // Don't require news check
          newsLookbackHours: 24,
        },
      };

      const { triggered, event } = await AlertEngine.evaluateAlert(
        fullAlert,
        anomalyMarketData
      );

      expect(triggered).toBe(true);
      expect(event?.triggerReason).toContain('Anomaly');
    });

    test('should detect volume spike anomaly', async () => {
      const anomalyMarketData: MarketData = {
        ticker: 'SBER',
        price: 252.0,
        previousClose: 250.0,
        volume: 40000000, // 5x average
        averageVolume: 8000000,
        timestamp: new Date(),
      };

      const alert = createAlert('SBER', 'Volume Anomaly', 'ANOMALY', []);

      const fullAlert: Alert = {
        ...alert,
        id: 'test-8',
        createdAt: new Date(),
        updatedAt: new Date(),
        triggeredCount: 0,
        anomalyConfig: {
          priceChangeThreshold: 15,
          volumeSpikeMultiplier: 5,
          statisticalSigma: 2,
          requiresNoNews: false,
          newsLookbackHours: 24,
        },
      };

      const { triggered, event } = await AlertEngine.evaluateAlert(
        fullAlert,
        anomalyMarketData
      );

      expect(triggered).toBe(true);
      expect(event?.conditionsMet.some(c => c.includes('Volume spike'))).toBe(true);
    });
  });
});

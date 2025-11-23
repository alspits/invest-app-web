import { NextRequest, NextResponse } from 'next/server';
import { AlertEngine, MarketData, NewsData } from '@/lib/alerts/engine';
import { Alert, AlertTriggerEvent } from '@/types/alert';

/**
 * POST /api/alerts/evaluate
 * Evaluate all active alerts against current market data
 */
export async function POST(request: NextRequest) {
  try {
    // In a real implementation, you would:
    // 1. Fetch all active alerts from database
    // 2. Fetch current market data for each ticker
    // 3. Fetch recent news for each ticker
    // 4. Evaluate each alert
    // 5. Send notifications for triggered alerts
    // 6. Update alert statistics

    console.log('🔔 Evaluating all active alerts...');

    // Mock implementation for demonstration
    const mockMarketData: Record<string, MarketData> = {
      SBER: {
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
      },
      GAZP: {
        ticker: 'GAZP',
        price: 232.0,
        previousClose: 230.0,
        volume: 5000000,
        averageVolume: 4500000,
        peRatio: 4.8,
        rsi: 28,
        movingAvg50: 225.0,
        movingAvg200: 220.0,
        timestamp: new Date(),
      },
      TMOS: {
        ticker: 'TMOS',
        price: 1650.0,
        previousClose: 1420.0,
        volume: 3500000,
        averageVolume: 700000,
        timestamp: new Date(),
      },
    };

    const results = {
      evaluated: 0,
      triggered: 0,
      triggeredAlerts: [] as AlertTriggerEvent[],
    };

    // Simulate alert evaluation
    // In production, fetch alerts from database
    const activeAlerts: Alert[] = []; // Would fetch from DB

    for (const alert of activeAlerts) {
      const marketData = mockMarketData[alert.ticker];
      if (!marketData) {
        console.warn(`No market data for ticker: ${alert.ticker}`);
        continue;
      }

      // Fetch news data (if needed)
      const newsData: NewsData | undefined = undefined;

      // Evaluate alert
      const { triggered, event } = await AlertEngine.evaluateAlert(
        alert,
        marketData,
        newsData
      );

      results.evaluated++;

      if (triggered && event) {
        results.triggered++;
        results.triggeredAlerts.push(event);

        console.log(`🔔 Alert triggered: ${alert.name} for ${alert.ticker}`);

        // Send notification (integrate with notification store)
        await sendNotification(alert, event);
      }
    }

    console.log(
      `✅ Evaluation complete: ${results.evaluated} evaluated, ${results.triggered} triggered`
    );

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('❌ Alert evaluation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to evaluate alerts',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

/**
 * Send notification for triggered alert
 */
async function sendNotification(
  alert: Alert,
  event: AlertTriggerEvent
): Promise<void> {
  try {
    // Send push notification if enabled
    if (alert.notifyViaPush) {
      // Integrate with notification system
      console.log('📨 Sending push notification:', {
        ticker: alert.ticker,
        name: alert.name,
        reason: event.triggerReason,
      });
    }

    // Send email notification if enabled
    if (alert.notifyViaEmail) {
      console.log('📧 Sending email notification:', {
        ticker: alert.ticker,
        name: alert.name,
      });
    }
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}

import { AlertTriggerEvent } from '@/types/alert';

/**
 * Alert batching engine for grouping multiple alerts within a time window
 * Helps reduce notification spam by batching alerts for the same ticker
 */
export class AlertBatcher {
  private batchedAlerts: Map<string, AlertTriggerEvent[]> = new Map();
  private batchTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Add alert to batch
   * @param ticker - Ticker symbol
   * @param event - Alert trigger event
   * @param windowMinutes - Batch window in minutes
   * @param onBatchReady - Callback when batch is ready
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
   * @param onBatchReady - Callback for each batch
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

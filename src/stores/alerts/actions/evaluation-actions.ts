/**
 * Evaluates all active alerts against current market data
 */
export async function evaluateAlertsAction(
  set: any,
  get: any
): Promise<void> {
  set({ isEvaluating: true, error: null });

  try {
    const response = await fetch('/api/alerts/evaluate', {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to evaluate alerts');
    }

    const data = await response.json();

    console.log('✅ Alert evaluation complete:', data);

    // Reload alerts and history to get updated state
    await get().loadAlerts();
    await get().loadTriggerHistory();

    set({ isEvaluating: false });
  } catch (error) {
    console.error('Error evaluating alerts:', error);
    set({
      isEvaluating: false,
      error: (error as Error).message,
    });
  }
}

/**
 * Evaluates a single alert against current market data
 */
export async function evaluateSingleAlertAction(
  set: any,
  get: any,
  alertId: string
): Promise<void> {
  try {
    const response = await fetch(`/api/alerts/${alertId}/evaluate`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to evaluate alert');
    }

    const data = await response.json();

    console.log('✅ Single alert evaluation:', data);
  } catch (error) {
    console.error('Error evaluating alert:', error);
  }
}

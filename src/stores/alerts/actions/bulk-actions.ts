import { Alert } from '@/types/alert';

/**
 * Deletes all alerts (with confirmation)
 */
export function deleteAllAlertsAction(
  set: any,
  get: any
): void {
  if (confirm('Удалить все оповещения? Это действие необратимо.')) {
    set({ alerts: [] });
    console.log('🗑️ All alerts deleted');
  }
}

/**
 * Enables all alerts
 */
export function enableAllAlertsAction(
  set: any,
  get: any
): void {
  set((state: any) => ({
    alerts: state.alerts.map((alert: Alert) => ({
      ...alert,
      status: 'ACTIVE',
    })),
  }));
  console.log('✅ All alerts enabled');
}

/**
 * Disables all alerts
 */
export function disableAllAlertsAction(
  set: any,
  get: any
): void {
  set((state: any) => ({
    alerts: state.alerts.map((alert: Alert) => ({
      ...alert,
      status: 'DISABLED',
    })),
  }));
  console.log('⏸️ All alerts disabled');
}

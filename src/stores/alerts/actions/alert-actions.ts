import { AlertTriggerEvent } from '@/types/alert';

/**
 * Snoozes an alert for a specified number of hours
 */
export function snoozeAlertAction(
  set: any,
  get: any,
  id: string,
  hours: number
): void {
  const snoozedUntil = new Date();
  snoozedUntil.setHours(snoozedUntil.getHours() + hours);

  get().updateAlert(id, {
    status: 'SNOOZED',
    // Store snoozedUntil in a custom field (would need to add to Alert type)
  });

  console.log(`⏰ Alert snoozed until ${snoozedUntil.toLocaleString()}`);
}

/**
 * Dismisses a triggered alert event
 */
export function dismissAlertAction(
  set: any,
  get: any,
  eventId: string
): void {
  set((state: any) => ({
    triggerHistory: state.triggerHistory.map((event: AlertTriggerEvent) =>
      event.id === eventId
        ? { ...event, userAction: 'DISMISSED', actionAt: new Date() }
        : event
    ),
  }));

  console.log('✅ Alert event dismissed:', eventId);
}

/**
 * Marks an alert event as viewed
 */
export function markEventAsViewedAction(
  set: any,
  get: any,
  eventId: string
): void {
  set((state: any) => ({
    triggerHistory: state.triggerHistory.map((event: AlertTriggerEvent) =>
      event.id === eventId
        ? { ...event, userAction: 'VIEWED', actionAt: new Date() }
        : event
    ),
  }));
}

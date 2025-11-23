import { Alert, AlertStatus } from '@/types/alert';

/**
 * Creates a new alert
 */
export function addAlertAction(
  set: any,
  get: any,
  alertData: Omit<Alert, 'id' | 'createdAt' | 'updatedAt' | 'triggeredCount'>
): void {
  const newAlert: Alert = {
    ...alertData,
    id: crypto.randomUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
    triggeredCount: 0,
  };

  set((state: any) => ({
    alerts: [...state.alerts, newAlert],
  }));

  // Persist to backend (if available)
  fetch('/api/alerts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newAlert),
  }).catch((error) => {
    console.error('Failed to save alert:', error);
  });

  console.log('✅ Alert created:', newAlert.name);
}

/**
 * Updates an existing alert
 */
export function updateAlertAction(
  set: any,
  get: any,
  id: string,
  updates: Partial<Alert>
): void {
  set((state: any) => ({
    alerts: state.alerts.map((alert: Alert) =>
      alert.id === id
        ? { ...alert, ...updates, updatedAt: new Date() }
        : alert
    ),
  }));

  // Persist to backend
  fetch(`/api/alerts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  }).catch((error) => {
    console.error('Failed to update alert:', error);
  });

  console.log('✅ Alert updated:', id);
}

/**
 * Deletes an alert
 */
export function deleteAlertAction(
  set: any,
  get: any,
  id: string
): void {
  set((state: any) => ({
    alerts: state.alerts.filter((alert: Alert) => alert.id !== id),
  }));

  // Persist to backend
  fetch(`/api/alerts/${id}`, {
    method: 'DELETE',
  }).catch((error) => {
    console.error('Failed to delete alert:', error);
  });

  console.log('✅ Alert deleted:', id);
}

/**
 * Toggles alert between ACTIVE and DISABLED status
 */
export function toggleAlertAction(
  set: any,
  get: any,
  id: string
): void {
  const alert = get().alerts.find((a: Alert) => a.id === id);
  if (!alert) return;

  const newStatus: AlertStatus =
    alert.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';

  updateAlertAction(set, get, id, { status: newStatus });
}

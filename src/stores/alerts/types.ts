import {
  Alert,
  AlertTriggerEvent,
  AlertStatistics,
} from '@/types/alert';

/**
 * Alert Store State and Actions
 *
 * Manages alert configuration, trigger history, and evaluation.
 */
export interface AlertStore {
  // State
  alerts: Alert[];
  triggerHistory: AlertTriggerEvent[];
  statistics: AlertStatistics | null;

  isLoadingAlerts: boolean;
  isLoadingHistory: boolean;
  isEvaluating: boolean;
  error: string | null;

  // Alert Management
  addAlert: (alert: Omit<Alert, 'id' | 'createdAt' | 'updatedAt' | 'triggeredCount'>) => void;
  updateAlert: (id: string, updates: Partial<Alert>) => void;
  deleteAlert: (id: string) => void;
  toggleAlert: (id: string) => void;

  // Alert Actions
  snoozeAlert: (id: string, hours: number) => void;
  dismissAlert: (eventId: string) => void;
  markEventAsViewed: (eventId: string) => void;

  // Bulk Operations
  deleteAllAlerts: () => void;
  enableAllAlerts: () => void;
  disableAllAlerts: () => void;

  // Data Loading
  loadAlerts: () => Promise<void>;
  loadTriggerHistory: (days?: number) => Promise<void>;
  loadStatistics: () => Promise<void>;

  // Alert Evaluation
  evaluateAlerts: () => Promise<void>;
  evaluateSingleAlert: (alertId: string) => Promise<void>;

  // Helpers
  getAlertsByTicker: (ticker: string) => Alert[];
  getActiveAlerts: () => Alert[];
  getTodaysTriggers: () => AlertTriggerEvent[];

  // Reset
  reset: () => void;
}

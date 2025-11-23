/**
 * Alert Store - Public API
 *
 * Manages alert configuration, trigger history, and evaluation.
 */

export { useAlertStore } from './alert-store';
export type { AlertStore } from './types';

// Export mock data for testing
export {
  mockAlerts,
  mockTriggerHistory,
  mockStatistics,
} from './mock-data';

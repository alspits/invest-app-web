import { create } from 'zustand';
import { AlertStore } from './types';
import {
  addAlertAction,
  updateAlertAction,
  deleteAlertAction,
  toggleAlertAction,
} from './actions/crud-actions';
import {
  snoozeAlertAction,
  dismissAlertAction,
  markEventAsViewedAction,
} from './actions/alert-actions';
import {
  deleteAllAlertsAction,
  enableAllAlertsAction,
  disableAllAlertsAction,
} from './actions/bulk-actions';
import {
  loadAlertsAction,
  loadTriggerHistoryAction,
  loadStatisticsAction,
} from './actions/loader-actions';
import {
  evaluateAlertsAction,
  evaluateSingleAlertAction,
} from './actions/evaluation-actions';

// ============================================================================
// Initial State
// ============================================================================

const initialState = {
  alerts: [],
  triggerHistory: [],
  statistics: null,
  isLoadingAlerts: false,
  isLoadingHistory: false,
  isEvaluating: false,
  error: null,
};

// ============================================================================
// Alert Store
// ============================================================================

export const useAlertStore = create<AlertStore>((set, get) => ({
  ...initialState,

  // ========================================================================
  // CRUD Operations
  // ========================================================================

  addAlert: (alertData) => {
    addAlertAction(set, get, alertData);
  },

  updateAlert: (id, updates) => {
    updateAlertAction(set, get, id, updates);
  },

  deleteAlert: (id) => {
    deleteAlertAction(set, get, id);
  },

  toggleAlert: (id) => {
    toggleAlertAction(set, get, id);
  },

  // ========================================================================
  // Alert Actions
  // ========================================================================

  snoozeAlert: (id, hours) => {
    snoozeAlertAction(set, get, id, hours);
  },

  dismissAlert: (eventId) => {
    dismissAlertAction(set, get, eventId);
  },

  markEventAsViewed: (eventId) => {
    markEventAsViewedAction(set, get, eventId);
  },

  // ========================================================================
  // Bulk Operations
  // ========================================================================

  deleteAllAlerts: () => {
    deleteAllAlertsAction(set, get);
  },

  enableAllAlerts: () => {
    enableAllAlertsAction(set, get);
  },

  disableAllAlerts: () => {
    disableAllAlertsAction(set, get);
  },

  // ========================================================================
  // Data Loading
  // ========================================================================

  loadAlerts: async () => {
    await loadAlertsAction(set);
  },

  loadTriggerHistory: async (days?: number) => {
    await loadTriggerHistoryAction(set, days);
  },

  loadStatistics: async () => {
    await loadStatisticsAction(set);
  },

  // ========================================================================
  // Alert Evaluation
  // ========================================================================

  evaluateAlerts: async () => {
    await evaluateAlertsAction(set, get);
  },

  evaluateSingleAlert: async (alertId: string) => {
    await evaluateSingleAlertAction(set, get, alertId);
  },

  // ========================================================================
  // Helpers
  // ========================================================================

  getAlertsByTicker: (ticker) => {
    return get().alerts.filter((alert) => alert.ticker === ticker);
  },

  getActiveAlerts: () => {
    return get().alerts.filter((alert) => alert.status === 'ACTIVE');
  },

  getTodaysTriggers: () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return get().triggerHistory.filter(
      (event) => event.triggeredAt >= today
    );
  },

  // ========================================================================
  // Reset
  // ========================================================================

  reset: () => set(initialState),
}));

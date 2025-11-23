import { create } from 'zustand';
import {
  Alert,
  AlertTriggerEvent,
  AlertStatistics,
  AlertStatus,
  createAlert,
  createConditionGroup,
  createAlertCondition,
  AlertTriggerType,
  AlertConditionField,
  AlertOperator,
  AlertLogic,
} from '@/types/alert';

// ============================================================================
// Alert Store State
// ============================================================================

interface AlertStore {
  // State
  alerts: Alert[];
  triggerHistory: AlertTriggerEvent[];
  statistics: AlertStatistics | null;

  isLoadingAlerts: boolean;
  isLoadingHistory: boolean;
  isEvaluating: boolean;
  error: string | null;

  // Alert Management
  addAlert: (alert: Omit<Alert, 'id' | 'createdAt' | 'updatedAt'>) => void;
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
// Mock Data (for development)
// ============================================================================

const mockAlerts: Alert[] = [
  {
    id: 'mock-alert-1',
    ticker: 'SBER',
    name: 'Сбербанк - Ценовое оповещение',
    description: 'Уведомить когда цена превысит 250₽',
    type: 'THRESHOLD',
    priority: 'MEDIUM',
    status: 'ACTIVE',
    conditionGroups: [
      {
        id: 'cg-1',
        logic: 'AND',
        conditions: [
          {
            id: 'c-1',
            field: 'PRICE',
            operator: 'GREATER_THAN',
            value: 250,
          },
        ],
      },
    ],
    frequency: {
      maxPerDay: 3,
      cooldownMinutes: 60,
      batchingEnabled: true,
      batchingWindowMinutes: 15,
    },
    dndSettings: {
      enabled: true,
      startTime: '22:00',
      endTime: '08:00',
      days: [0, 1, 2, 3, 4, 5, 6],
    },
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
    triggeredCount: 0,
    notifyViaApp: true,
    notifyViaPush: true,
    notifyViaEmail: false,
  },
  {
    id: 'mock-alert-2',
    ticker: 'GAZP',
    name: 'Газпром - Мультиусловия',
    description: 'Триггер при низкой оценке и перепроданности',
    type: 'MULTI_CONDITION',
    priority: 'HIGH',
    status: 'ACTIVE',
    conditionGroups: [
      {
        id: 'cg-2',
        logic: 'AND',
        conditions: [
          {
            id: 'c-2',
            field: 'PRICE',
            operator: 'GREATER_THAN',
            value: 230,
          },
          {
            id: 'c-3',
            field: 'PE_RATIO',
            operator: 'LESS_THAN',
            value: 5,
          },
          {
            id: 'c-4',
            field: 'RSI',
            operator: 'LESS_THAN',
            value: 30,
          },
        ],
      },
    ],
    frequency: {
      maxPerDay: 3,
      cooldownMinutes: 60,
      batchingEnabled: true,
      batchingWindowMinutes: 15,
    },
    dndSettings: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00',
      days: [0, 1, 2, 3, 4, 5, 6],
    },
    createdAt: new Date('2024-01-10T14:30:00Z'),
    updatedAt: new Date('2024-01-10T14:30:00Z'),
    lastTriggeredAt: new Date('2024-01-20T09:15:00Z'),
    triggeredCount: 2,
    notifyViaApp: true,
    notifyViaPush: true,
    notifyViaEmail: false,
  },
  {
    id: 'mock-alert-3',
    ticker: 'TMOS',
    name: 'TMOS - Детектор аномалий',
    description: 'Резкие движения цены без новостей',
    type: 'ANOMALY',
    priority: 'CRITICAL',
    status: 'ACTIVE',
    conditionGroups: [],
    anomalyConfig: {
      priceChangeThreshold: 15,
      volumeSpikeMultiplier: 5,
      statisticalSigma: 2,
      requiresNoNews: true,
      newsLookbackHours: 24,
    },
    frequency: {
      maxPerDay: 5,
      cooldownMinutes: 30,
      batchingEnabled: false,
      batchingWindowMinutes: 15,
    },
    dndSettings: {
      enabled: true,
      startTime: '22:00',
      endTime: '08:00',
      days: [0, 1, 2, 3, 4, 5, 6],
    },
    createdAt: new Date('2024-01-05T16:00:00Z'),
    updatedAt: new Date('2024-01-05T16:00:00Z'),
    triggeredCount: 1,
    notifyViaApp: true,
    notifyViaPush: true,
    notifyViaEmail: true,
  },
];

const mockTriggerHistory: AlertTriggerEvent[] = [
  {
    id: 'event-1',
    alertId: 'mock-alert-2',
    ticker: 'GAZP',
    triggeredAt: new Date('2024-01-20T09:15:00Z'),
    triggerReason: 'Условия выполнены: Цена > 230, P/E < 5, RSI < 30',
    conditionsMet: ['PRICE > 230', 'PE_RATIO < 5', 'RSI < 30'],
    priceAtTrigger: 235.5,
    volumeAtTrigger: 1500000,
    userAction: 'VIEWED',
    actionAt: new Date('2024-01-20T09:20:00Z'),
  },
  {
    id: 'event-2',
    alertId: 'mock-alert-3',
    ticker: 'TMOS',
    triggeredAt: new Date('2024-01-18T14:30:00Z'),
    triggerReason: 'Аномалия: Рост цены 16.5% без новостей',
    conditionsMet: ['Price change: 16.5%', 'No recent news'],
    priceAtTrigger: 1580,
    volumeAtTrigger: 750000,
    userAction: 'DISMISSED',
    actionAt: new Date('2024-01-18T14:35:00Z'),
  },
];

const mockStatistics: AlertStatistics = {
  totalAlerts: 3,
  activeAlerts: 3,
  triggeredToday: 0,
  triggeredThisWeek: 2,
  triggeredThisMonth: 3,
  averageTriggersPerDay: 0.5,
  mostTriggeredTicker: 'GAZP',
  mostTriggeredAlertType: 'MULTI_CONDITION',
};

// ============================================================================
// Zustand Store
// ============================================================================

export const useAlertStore = create<AlertStore>((set, get) => ({
  ...initialState,

  // ========================================================================
  // Alert Management
  // ========================================================================

  addAlert: (alertData) => {
    const newAlert: Alert = {
      ...alertData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      triggeredCount: 0,
    };

    set((state) => ({
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
  },

  updateAlert: (id, updates) => {
    set((state) => ({
      alerts: state.alerts.map((alert) =>
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
  },

  deleteAlert: (id) => {
    set((state) => ({
      alerts: state.alerts.filter((alert) => alert.id !== id),
    }));

    // Persist to backend
    fetch(`/api/alerts/${id}`, {
      method: 'DELETE',
    }).catch((error) => {
      console.error('Failed to delete alert:', error);
    });

    console.log('✅ Alert deleted:', id);
  },

  toggleAlert: (id) => {
    const alert = get().alerts.find((a) => a.id === id);
    if (!alert) return;

    const newStatus: AlertStatus =
      alert.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';

    get().updateAlert(id, { status: newStatus });
  },

  // ========================================================================
  // Alert Actions
  // ========================================================================

  snoozeAlert: (id, hours) => {
    const snoozedUntil = new Date();
    snoozedUntil.setHours(snoozedUntil.getHours() + hours);

    get().updateAlert(id, {
      status: 'SNOOZED',
      // Store snoozedUntil in a custom field (would need to add to Alert type)
    });

    console.log(`⏰ Alert snoozed until ${snoozedUntil.toLocaleString()}`);
  },

  dismissAlert: (eventId) => {
    set((state) => ({
      triggerHistory: state.triggerHistory.map((event) =>
        event.id === eventId
          ? { ...event, userAction: 'DISMISSED', actionAt: new Date() }
          : event
      ),
    }));

    console.log('✅ Alert event dismissed:', eventId);
  },

  markEventAsViewed: (eventId) => {
    set((state) => ({
      triggerHistory: state.triggerHistory.map((event) =>
        event.id === eventId
          ? { ...event, userAction: 'VIEWED', actionAt: new Date() }
          : event
      ),
    }));
  },

  // ========================================================================
  // Bulk Operations
  // ========================================================================

  deleteAllAlerts: () => {
    if (confirm('Удалить все оповещения? Это действие необратимо.')) {
      set({ alerts: [] });
      console.log('🗑️ All alerts deleted');
    }
  },

  enableAllAlerts: () => {
    set((state) => ({
      alerts: state.alerts.map((alert) => ({
        ...alert,
        status: 'ACTIVE',
      })),
    }));
    console.log('✅ All alerts enabled');
  },

  disableAllAlerts: () => {
    set((state) => ({
      alerts: state.alerts.map((alert) => ({
        ...alert,
        status: 'DISABLED',
      })),
    }));
    console.log('⏸️ All alerts disabled');
  },

  // ========================================================================
  // Data Loading
  // ========================================================================

  loadAlerts: async () => {
    set({ isLoadingAlerts: true, error: null });

    try {
      // Check if in development mode
      const isDev = process.env.NODE_ENV === 'development';

      if (isDev) {
        console.log('🔧 Development mode: Using mock alerts data');
        await new Promise((resolve) => setTimeout(resolve, 500));

        set({
          alerts: mockAlerts,
          isLoadingAlerts: false,
        });
        return;
      }

      // Production: fetch from API
      const response = await fetch('/api/alerts');

      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }

      const data = await response.json();

      set({
        alerts: data.alerts || [],
        isLoadingAlerts: false,
      });

      console.log(`✅ Loaded ${data.alerts?.length || 0} alerts`);
    } catch (error) {
      console.error('Error loading alerts:', error);
      set({
        isLoadingAlerts: false,
        error: (error as Error).message,
        alerts: [],
      });
    }
  },

  loadTriggerHistory: async (days = 30) => {
    set({ isLoadingHistory: true, error: null });

    try {
      // Check if in development mode
      const isDev = process.env.NODE_ENV === 'development';

      if (isDev) {
        console.log('🔧 Development mode: Using mock trigger history');
        await new Promise((resolve) => setTimeout(resolve, 300));

        set({
          triggerHistory: mockTriggerHistory,
          isLoadingHistory: false,
        });
        return;
      }

      // Production: fetch from API
      const response = await fetch(`/api/alerts/history?days=${days}`);

      if (!response.ok) {
        throw new Error('Failed to fetch trigger history');
      }

      const data = await response.json();

      set({
        triggerHistory: data.history || [],
        isLoadingHistory: false,
      });

      console.log(`✅ Loaded ${data.history?.length || 0} trigger events`);
    } catch (error) {
      console.error('Error loading trigger history:', error);
      set({
        isLoadingHistory: false,
        error: (error as Error).message,
        triggerHistory: [],
      });
    }
  },

  loadStatistics: async () => {
    try {
      // Check if in development mode
      const isDev = process.env.NODE_ENV === 'development';

      if (isDev) {
        console.log('🔧 Development mode: Using mock statistics');
        set({ statistics: mockStatistics });
        return;
      }

      // Production: fetch from API
      const response = await fetch('/api/alerts/statistics');

      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }

      const data = await response.json();

      set({ statistics: data.statistics });

      console.log('✅ Loaded alert statistics');
    } catch (error) {
      console.error('Error loading statistics:', error);
      set({ error: (error as Error).message });
    }
  },

  // ========================================================================
  // Alert Evaluation
  // ========================================================================

  evaluateAlerts: async () => {
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
  },

  evaluateSingleAlert: async (alertId) => {
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

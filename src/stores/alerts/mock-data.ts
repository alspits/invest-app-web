import {
  Alert,
  AlertTriggerEvent,
  AlertStatistics,
} from '@/types/alert';

/**
 * Mock data for development and testing
 */

export const mockAlerts: Alert[] = [
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

export const mockTriggerHistory: AlertTriggerEvent[] = [
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

export const mockStatistics: AlertStatistics = {
  totalAlerts: 3,
  activeAlerts: 3,
  triggeredToday: 0,
  triggeredThisWeek: 2,
  triggeredThisMonth: 3,
  averageTriggersPerDay: 0.5,
  mostTriggeredTicker: 'GAZP',
  mostTriggeredAlertType: 'MULTI_CONDITION',
};

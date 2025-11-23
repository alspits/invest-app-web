import { z } from 'zod';

// ============================================================================
// Alert Condition Types
// ============================================================================

/**
 * Alert condition operator types
 */
export type AlertOperator =
  | 'GREATER_THAN'        // >
  | 'LESS_THAN'           // <
  | 'GREATER_THAN_EQUAL'  // >=
  | 'LESS_THAN_EQUAL'     // <=
  | 'EQUAL'               // ==
  | 'NOT_EQUAL'           // !=
  | 'PERCENTAGE_CHANGE'   // % change from baseline
  | 'CROSSES_ABOVE'       // price crosses above value
  | 'CROSSES_BELOW';      // price crosses below value

/**
 * Alert condition field types
 */
export type AlertConditionField =
  | 'PRICE'               // Current price
  | 'PRICE_CHANGE'        // Price change %
  | 'VOLUME'              // Trading volume
  | 'VOLUME_RATIO'        // Volume ratio (current vs avg)
  | 'PE_RATIO'            // P/E ratio
  | 'RSI'                 // Relative Strength Index
  | 'MOVING_AVG_50'       // 50-day moving average
  | 'MOVING_AVG_200'      // 200-day moving average
  | 'NEWS_SENTIMENT'      // News sentiment score
  | 'MARKET_CAP';         // Market capitalization

/**
 * Boolean logic for combining conditions
 */
export type AlertLogic = 'AND' | 'OR';

/**
 * Single alert condition
 */
export interface AlertCondition {
  id: string;
  field: AlertConditionField;
  operator: AlertOperator;
  value: number;
  baselineValue?: number; // For percentage change calculations
}

/**
 * Group of conditions with boolean logic
 */
export interface AlertConditionGroup {
  id: string;
  logic: AlertLogic;
  conditions: AlertCondition[];
}

// ============================================================================
// Alert Types
// ============================================================================

/**
 * Alert trigger types
 */
export type AlertTriggerType =
  | 'THRESHOLD'           // Basic threshold alert (price > X)
  | 'NEWS_TRIGGERED'      // Triggered by news sentiment
  | 'ANOMALY'             // Anomaly detection alert
  | 'MULTI_CONDITION';    // Complex multi-condition alert

/**
 * Alert priority levels
 */
export type AlertPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Alert status
 */
export type AlertStatus =
  | 'ACTIVE'              // Currently monitoring
  | 'TRIGGERED'           // Condition met, notification sent
  | 'SNOOZED'             // Temporarily disabled
  | 'DISMISSED'           // User dismissed
  | 'EXPIRED'             // Time-based expiration
  | 'DISABLED';           // Manually disabled

/**
 * Alert frequency settings
 */
export interface AlertFrequency {
  maxPerDay: number;          // Max alerts per day (default: 3)
  cooldownMinutes: number;    // Cooldown between same alert (default: 60)
  batchingEnabled: boolean;   // Batch similar alerts
  batchingWindowMinutes: number; // Batching window (default: 15)
}

/**
 * Do Not Disturb settings
 */
export interface DNDSettings {
  enabled: boolean;
  startTime: string;  // 24h format: "22:00"
  endTime: string;    // 24h format: "08:00"
  days: number[];     // 0-6 (Sunday-Saturday)
}

/**
 * Alert anomaly detection config
 */
export interface AnomalyConfig {
  priceChangeThreshold: number;      // % change to trigger (default: 15)
  volumeSpikeMultiplier: number;     // Volume spike multiplier (default: 5)
  statisticalSigma: number;          // Standard deviations (default: 2)
  requiresNoNews: boolean;           // Only trigger if no recent news (default: true)
  newsLookbackHours: number;         // How far back to check news (default: 24)
}

/**
 * Main alert definition
 */
export interface Alert {
  id: string;
  userId?: string;
  ticker: string;
  name: string;
  description?: string;

  // Alert type and configuration
  type: AlertTriggerType;
  priority: AlertPriority;
  status: AlertStatus;

  // Conditions
  conditionGroups: AlertConditionGroup[];

  // Anomaly detection (if type === ANOMALY)
  anomalyConfig?: AnomalyConfig;

  // Timing and frequency
  frequency: AlertFrequency;
  dndSettings: DNDSettings;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastTriggeredAt?: Date;
  triggeredCount: number;

  // Expiration (optional)
  expiresAt?: Date;

  // Notification settings
  notifyViaApp: boolean;
  notifyViaPush: boolean;
  notifyViaEmail: boolean;
}

// ============================================================================
// Alert History
// ============================================================================

/**
 * Alert trigger event
 */
export interface AlertTriggerEvent {
  id: string;
  alertId: string;
  ticker: string;

  // Trigger details
  triggeredAt: Date;
  triggerReason: string;
  conditionsMet: string[];

  // Market data at trigger time
  priceAtTrigger: number;
  volumeAtTrigger?: number;
  newsCount?: number;
  sentiment?: number;

  // User action
  userAction: 'VIEWED' | 'DISMISSED' | 'SNOOZED' | 'PENDING';
  actionAt?: Date;
  snoozedUntil?: Date;
}

/**
 * Alert statistics
 */
export interface AlertStatistics {
  totalAlerts: number;
  activeAlerts: number;
  triggeredToday: number;
  triggeredThisWeek: number;
  triggeredThisMonth: number;
  averageTriggersPerDay: number;
  mostTriggeredTicker: string;
  mostTriggeredAlertType: AlertTriggerType;
}

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

export const AlertConditionSchema = z.object({
  id: z.string(),
  field: z.enum([
    'PRICE',
    'PRICE_CHANGE',
    'VOLUME',
    'VOLUME_RATIO',
    'PE_RATIO',
    'RSI',
    'MOVING_AVG_50',
    'MOVING_AVG_200',
    'NEWS_SENTIMENT',
    'MARKET_CAP',
  ]),
  operator: z.enum([
    'GREATER_THAN',
    'LESS_THAN',
    'GREATER_THAN_EQUAL',
    'LESS_THAN_EQUAL',
    'EQUAL',
    'NOT_EQUAL',
    'PERCENTAGE_CHANGE',
    'CROSSES_ABOVE',
    'CROSSES_BELOW',
  ]),
  value: z.number(),
  baselineValue: z.number().optional(),
});

export const AlertConditionGroupSchema = z.object({
  id: z.string(),
  logic: z.enum(['AND', 'OR']),
  conditions: z.array(AlertConditionSchema),
});

export const AlertFrequencySchema = z.object({
  maxPerDay: z.number().min(1).max(100),
  cooldownMinutes: z.number().min(0),
  batchingEnabled: z.boolean(),
  batchingWindowMinutes: z.number().min(1).max(1440),
});

export const DNDSettingsSchema = z.object({
  enabled: z.boolean(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  days: z.array(z.number().min(0).max(6)),
});

export const AnomalyConfigSchema = z.object({
  priceChangeThreshold: z.number().min(0).max(100),
  volumeSpikeMultiplier: z.number().min(1).max(100),
  statisticalSigma: z.number().min(0.5).max(5),
  requiresNoNews: z.boolean(),
  newsLookbackHours: z.number().min(1).max(168),
});

export const AlertSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  ticker: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),

  type: z.enum(['THRESHOLD', 'NEWS_TRIGGERED', 'ANOMALY', 'MULTI_CONDITION']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  status: z.enum(['ACTIVE', 'TRIGGERED', 'SNOOZED', 'DISMISSED', 'EXPIRED', 'DISABLED']),

  conditionGroups: z.array(AlertConditionGroupSchema),
  anomalyConfig: AnomalyConfigSchema.optional(),

  frequency: AlertFrequencySchema,
  dndSettings: DNDSettingsSchema,

  createdAt: z.date(),
  updatedAt: z.date(),
  lastTriggeredAt: z.date().optional(),
  triggeredCount: z.number().min(0),

  expiresAt: z.date().optional(),

  notifyViaApp: z.boolean(),
  notifyViaPush: z.boolean(),
  notifyViaEmail: z.boolean(),
});

export const AlertTriggerEventSchema = z.object({
  id: z.string(),
  alertId: z.string(),
  ticker: z.string(),

  triggeredAt: z.date(),
  triggerReason: z.string(),
  conditionsMet: z.array(z.string()),

  priceAtTrigger: z.number(),
  volumeAtTrigger: z.number().optional(),
  newsCount: z.number().optional(),
  sentiment: z.number().optional(),

  userAction: z.enum(['VIEWED', 'DISMISSED', 'SNOOZED', 'PENDING']),
  actionAt: z.date().optional(),
  snoozedUntil: z.date().optional(),
});

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_ALERT_FREQUENCY: AlertFrequency = {
  maxPerDay: 3,
  cooldownMinutes: 60,
  batchingEnabled: true,
  batchingWindowMinutes: 15,
};

export const DEFAULT_DND_SETTINGS: DNDSettings = {
  enabled: false,
  startTime: '22:00',
  endTime: '08:00',
  days: [0, 1, 2, 3, 4, 5, 6], // All days
};

export const DEFAULT_ANOMALY_CONFIG: AnomalyConfig = {
  priceChangeThreshold: 15,
  volumeSpikeMultiplier: 5,
  statisticalSigma: 2,
  requiresNoNews: true,
  newsLookbackHours: 24,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a new alert condition
 */
export function createAlertCondition(
  field: AlertConditionField,
  operator: AlertOperator,
  value: number,
  baselineValue?: number
): AlertCondition {
  return {
    id: crypto.randomUUID(),
    field,
    operator,
    value,
    baselineValue,
  };
}

/**
 * Create a new condition group
 */
export function createConditionGroup(
  logic: AlertLogic,
  conditions: AlertCondition[] = []
): AlertConditionGroup {
  return {
    id: crypto.randomUUID(),
    logic,
    conditions,
  };
}

/**
 * Create a new alert
 */
export function createAlert(
  ticker: string,
  name: string,
  type: AlertTriggerType,
  conditionGroups: AlertConditionGroup[] = []
): Omit<Alert, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    ticker,
    name,
    type,
    priority: 'MEDIUM',
    status: 'ACTIVE',
    conditionGroups,
    frequency: DEFAULT_ALERT_FREQUENCY,
    dndSettings: DEFAULT_DND_SETTINGS,
    triggeredCount: 0,
    notifyViaApp: true,
    notifyViaPush: true,
    notifyViaEmail: false,
  };
}

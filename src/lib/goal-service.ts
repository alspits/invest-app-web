import { z } from 'zod';

// ============================================================================
// Zod Schemas for Runtime Validation
// ============================================================================

export const GoalTypeEnum = z.enum([
  'TARGET_VALUE',       // Target portfolio value (e.g., reach 1M RUB)
  'TARGET_RETURN',      // Target return percentage (e.g., achieve 20% ROI)
  'TARGET_POSITION',    // Target position value (e.g., accumulate 100 shares)
  'SAVE_AMOUNT',        // Save specific amount by deadline
  'DIVERSIFICATION',    // Achieve diversification score
]);

export const GoalStatusEnum = z.enum([
  'ACTIVE',      // Goal is in progress
  'COMPLETED',   // Goal achieved
  'MISSED',      // Deadline passed without completion
  'PAUSED',      // Goal temporarily paused
]);

export const GoalSchema = z.object({
  id: z.string(),
  portfolioId: z.string(),
  name: z.string().min(1, 'Goal name is required'),
  description: z.string().optional(),
  goalType: GoalTypeEnum,
  targetValue: z.number().positive('Target value must be positive'),
  currentValue: z.number().default(0),
  deadline: z.string(), // ISO date string
  status: GoalStatusEnum.default('ACTIVE'),
  createdAt: z.string(), // ISO date string
  updatedAt: z.string(), // ISO date string
  completedAt: z.string().optional(),
});

export const CreateGoalSchema = GoalSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
  status: true,
});

export const UpdateGoalSchema = GoalSchema.partial().required({ id: true });

// ============================================================================
// TypeScript Types
// ============================================================================

export type GoalType = z.infer<typeof GoalTypeEnum>;
export type GoalStatus = z.infer<typeof GoalStatusEnum>;
export type Goal = z.infer<typeof GoalSchema>;
export type CreateGoalInput = z.infer<typeof CreateGoalSchema>;
export type UpdateGoalInput = z.infer<typeof UpdateGoalSchema>;

export interface GoalProgress {
  goal: Goal;
  progress: number; // Percentage (0-100)
  remaining: number; // Amount remaining to reach target
  daysRemaining: number; // Days until deadline
  isOnTrack: boolean; // Whether goal is likely to be met
  status: 'on-track' | 'at-risk' | 'overdue' | 'completed';
}

export interface GoalAlert {
  goalId: string;
  goalName: string;
  type: 'deadline-near' | 'deadline-passed' | 'goal-achieved' | 'at-risk';
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate unique ID for goals
 */
export function generateGoalId(): string {
  return `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(currentValue: number, targetValue: number): number {
  if (targetValue === 0) return 0;
  const progress = (currentValue / targetValue) * 100;
  return Math.min(Math.max(progress, 0), 100); // Clamp between 0-100
}

/**
 * Calculate days remaining until deadline
 */
export function calculateDaysRemaining(deadline: string): number {
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Check if goal is on track based on linear projection
 */
export function isGoalOnTrack(goal: Goal): boolean {
  const progress = calculateProgress(goal.currentValue, goal.targetValue);
  const daysRemaining = calculateDaysRemaining(goal.deadline);

  // If already completed
  if (progress >= 100) return true;

  // If deadline passed
  if (daysRemaining < 0) return false;

  // Calculate expected progress based on time elapsed
  const createdAt = new Date(goal.createdAt);
  const deadline = new Date(goal.deadline);
  const totalDuration = deadline.getTime() - createdAt.getTime();
  const elapsed = Date.now() - createdAt.getTime();

  if (totalDuration <= 0) return progress >= 100;

  const expectedProgress = (elapsed / totalDuration) * 100;

  // Goal is on track if actual progress is >= 80% of expected progress
  return progress >= expectedProgress * 0.8;
}

/**
 * Determine goal status
 */
export function determineGoalStatus(goal: Goal): GoalProgress['status'] {
  const progress = calculateProgress(goal.currentValue, goal.targetValue);
  const daysRemaining = calculateDaysRemaining(goal.deadline);

  if (progress >= 100) return 'completed';
  if (daysRemaining < 0) return 'overdue';
  if (!isGoalOnTrack(goal)) return 'at-risk';
  return 'on-track';
}

/**
 * Calculate goal progress with metadata
 */
export function calculateGoalProgress(goal: Goal): GoalProgress {
  const progress = calculateProgress(goal.currentValue, goal.targetValue);
  const remaining = Math.max(goal.targetValue - goal.currentValue, 0);
  const daysRemaining = calculateDaysRemaining(goal.deadline);
  const onTrack = isGoalOnTrack(goal);
  const status = determineGoalStatus(goal);

  return {
    goal,
    progress,
    remaining,
    daysRemaining,
    isOnTrack: onTrack,
    status,
  };
}

/**
 * Generate alerts for a goal
 */
export function generateGoalAlerts(goalProgress: GoalProgress): GoalAlert[] {
  const alerts: GoalAlert[] = [];
  const { goal, progress, daysRemaining, status } = goalProgress;

  // Goal achieved
  if (progress >= 100 && goal.status !== 'COMPLETED') {
    alerts.push({
      goalId: goal.id,
      goalName: goal.name,
      type: 'goal-achieved',
      message: `Поздравляем! Цель "${goal.name}" достигнута!`,
      severity: 'success',
    });
  }

  // Deadline passed
  if (daysRemaining < 0 && progress < 100) {
    alerts.push({
      goalId: goal.id,
      goalName: goal.name,
      type: 'deadline-passed',
      message: `Срок цели "${goal.name}" истёк. Достигнуто ${progress.toFixed(1)}% от цели.`,
      severity: 'error',
    });
  }

  // Deadline near (7 days)
  if (daysRemaining >= 0 && daysRemaining <= 7 && progress < 100) {
    alerts.push({
      goalId: goal.id,
      goalName: goal.name,
      type: 'deadline-near',
      message: `До срока цели "${goal.name}" осталось ${daysRemaining} дней. Прогресс: ${progress.toFixed(1)}%`,
      severity: 'warning',
    });
  }

  // At risk
  if (status === 'at-risk') {
    alerts.push({
      goalId: goal.id,
      goalName: goal.name,
      type: 'at-risk',
      message: `Цель "${goal.name}" под угрозой срыва. Текущий прогресс ниже ожидаемого.`,
      severity: 'warning',
    });
  }

  return alerts;
}

/**
 * Format goal type for display
 */
export function formatGoalType(goalType: GoalType): string {
  const typeMap: Record<GoalType, string> = {
    TARGET_VALUE: 'Целевая стоимость портфеля',
    TARGET_RETURN: 'Целевая доходность',
    TARGET_POSITION: 'Целевая позиция',
    SAVE_AMOUNT: 'Накопить сумму',
    DIVERSIFICATION: 'Диверсификация',
  };
  return typeMap[goalType];
}

/**
 * Format value based on goal type
 */
export function formatGoalValue(value: number, goalType: GoalType): string {
  switch (goalType) {
    case 'TARGET_RETURN':
    case 'DIVERSIFICATION':
      return `${value.toFixed(2)}%`;
    case 'TARGET_VALUE':
    case 'SAVE_AMOUNT':
      return value.toLocaleString('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    case 'TARGET_POSITION':
      return `${value.toFixed(0)} шт.`;
    default:
      return value.toString();
  }
}

// ============================================================================
// Goal Service (localStorage-based)
// ============================================================================

const GOALS_STORAGE_KEY = 'investment_goals';

export class GoalService {
  /**
   * Get all goals from localStorage
   */
  static getAllGoals(): Goal[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(GOALS_STORAGE_KEY);
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      return z.array(GoalSchema).parse(parsed);
    } catch (error) {
      console.error('Error loading goals:', error);
      return [];
    }
  }

  /**
   * Get goals for specific portfolio
   */
  static getGoalsByPortfolio(portfolioId: string): Goal[] {
    const allGoals = this.getAllGoals();
    return allGoals.filter((goal) => goal.portfolioId === portfolioId);
  }

  /**
   * Get goal by ID
   */
  static getGoalById(id: string): Goal | null {
    const allGoals = this.getAllGoals();
    return allGoals.find((goal) => goal.id === id) || null;
  }

  /**
   * Create new goal
   */
  static createGoal(input: CreateGoalInput): Goal {
    const validated = CreateGoalSchema.parse(input);

    const newGoal: Goal = {
      ...validated,
      id: generateGoalId(),
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const allGoals = this.getAllGoals();
    allGoals.push(newGoal);
    this.saveGoals(allGoals);

    return newGoal;
  }

  /**
   * Update existing goal
   */
  static updateGoal(input: UpdateGoalInput): Goal {
    const validated = UpdateGoalSchema.parse(input);
    const allGoals = this.getAllGoals();

    const index = allGoals.findIndex((goal) => goal.id === validated.id);
    if (index === -1) {
      throw new Error(`Goal with id ${validated.id} not found`);
    }

    const updatedGoal: Goal = {
      ...allGoals[index],
      ...validated,
      updatedAt: new Date().toISOString(),
    };

    allGoals[index] = updatedGoal;
    this.saveGoals(allGoals);

    return updatedGoal;
  }

  /**
   * Update goal's current value
   */
  static updateGoalProgress(id: string, currentValue: number): Goal {
    return this.updateGoal({ id, currentValue });
  }

  /**
   * Mark goal as completed
   */
  static completeGoal(id: string): Goal {
    const goal = this.getGoalById(id);
    if (!goal) {
      throw new Error(`Goal with id ${id} not found`);
    }

    return this.updateGoal({
      id,
      status: 'COMPLETED',
      completedAt: new Date().toISOString(),
      currentValue: goal.targetValue, // Set to target
    });
  }

  /**
   * Delete goal
   */
  static deleteGoal(id: string): void {
    const allGoals = this.getAllGoals();
    const filtered = allGoals.filter((goal) => goal.id !== id);
    this.saveGoals(filtered);
  }

  /**
   * Reset goal progress
   */
  static resetGoalProgress(id: string): Goal {
    return this.updateGoal({
      id,
      currentValue: 0,
      status: 'ACTIVE',
      completedAt: undefined,
    });
  }

  /**
   * Auto-update goals based on portfolio metrics
   */
  static autoUpdateGoals(
    portfolioId: string,
    metrics: {
      totalValue?: number;
      returnPercent?: number;
      diversificationScore?: number;
    }
  ): Goal[] {
    const goals = this.getGoalsByPortfolio(portfolioId);
    const updatedGoals: Goal[] = [];

    goals.forEach((goal) => {
      let newValue = goal.currentValue;

      // Update based on goal type
      switch (goal.goalType) {
        case 'TARGET_VALUE':
        case 'SAVE_AMOUNT':
          if (metrics.totalValue !== undefined) {
            newValue = metrics.totalValue;
          }
          break;
        case 'TARGET_RETURN':
          if (metrics.returnPercent !== undefined) {
            newValue = metrics.returnPercent;
          }
          break;
        case 'DIVERSIFICATION':
          if (metrics.diversificationScore !== undefined) {
            newValue = metrics.diversificationScore * 100; // Convert to percentage
          }
          break;
        // TARGET_POSITION is manually updated
      }

      // Only update if value changed
      if (newValue !== goal.currentValue) {
        const updatedGoal = this.updateGoalProgress(goal.id, newValue);
        updatedGoals.push(updatedGoal);

        // Auto-complete if target reached
        const progress = calculateProgress(newValue, goal.targetValue);
        if (progress >= 100 && goal.status === 'ACTIVE') {
          this.completeGoal(goal.id);
        }
      }
    });

    return updatedGoals;
  }

  /**
   * Get all alerts for portfolio goals
   */
  static getPortfolioAlerts(portfolioId: string): GoalAlert[] {
    const goals = this.getGoalsByPortfolio(portfolioId);
    const alerts: GoalAlert[] = [];

    goals.forEach((goal) => {
      const progress = calculateGoalProgress(goal);
      const goalAlerts = generateGoalAlerts(progress);
      alerts.push(...goalAlerts);
    });

    return alerts;
  }

  /**
   * Save goals to localStorage
   */
  private static saveGoals(goals: Goal[]): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
    } catch (error) {
      console.error('Error saving goals:', error);
    }
  }
}

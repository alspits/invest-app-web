import { create } from 'zustand';
import {
  Goal,
  CreateGoalInput,
  UpdateGoalInput,
  GoalProgress,
  GoalAlert,
  GoalService,
  calculateGoalProgress,
  generateGoalAlerts,
} from '@/lib/goal-service';

interface GoalState {
  // Goals state
  goals: Goal[];
  isLoadingGoals: boolean;
  goalError: string | null;

  // Computed state
  goalProgresses: Map<string, GoalProgress>;
  alerts: GoalAlert[];

  // Actions
  setGoals: (goals: Goal[]) => void;
  setIsLoadingGoals: (isLoading: boolean) => void;
  setGoalError: (error: string | null) => void;

  // CRUD operations
  loadGoals: (portfolioId: string) => void;
  createGoal: (input: CreateGoalInput) => void;
  updateGoal: (input: UpdateGoalInput) => void;
  deleteGoal: (id: string) => void;
  resetGoalProgress: (id: string) => void;
  completeGoal: (id: string) => void;

  // Auto-update
  autoUpdateGoals: (
    portfolioId: string,
    metrics: {
      totalValue?: number;
      returnPercent?: number;
      diversificationScore?: number;
    }
  ) => void;

  // Utility
  refreshProgresses: () => void;
  getGoalById: (id: string) => Goal | undefined;
  reset: () => void;
}

const initialState = {
  goals: [],
  isLoadingGoals: false,
  goalError: null,
  goalProgresses: new Map(),
  alerts: [],
};

export const useGoalStore = create<GoalState>((set, get) => ({
  ...initialState,

  // Setters
  setGoals: (goals) => {
    set({ goals });
    get().refreshProgresses();
  },
  setIsLoadingGoals: (isLoading) => set({ isLoadingGoals: isLoading }),
  setGoalError: (error) => set({ goalError: error }),

  // Load goals for specific portfolio
  loadGoals: (portfolioId: string) => {
    set({ isLoadingGoals: true, goalError: null });

    try {
      const goals = GoalService.getGoalsByPortfolio(portfolioId);
      set({
        goals,
        isLoadingGoals: false,
        goalError: null,
      });
      get().refreshProgresses();
    } catch (error) {
      console.error('Error loading goals:', error);
      set({
        isLoadingGoals: false,
        goalError: (error as Error).message,
        goals: [],
      });
    }
  },

  // Create new goal
  createGoal: (input: CreateGoalInput) => {
    set({ goalError: null });

    try {
      const newGoal = GoalService.createGoal(input);
      const goals = [...get().goals, newGoal];
      set({ goals });
      get().refreshProgresses();
    } catch (error) {
      console.error('Error creating goal:', error);
      set({ goalError: (error as Error).message });
      throw error;
    }
  },

  // Update existing goal
  updateGoal: (input: UpdateGoalInput) => {
    set({ goalError: null });

    try {
      const updatedGoal = GoalService.updateGoal(input);
      const goals = get().goals.map((goal) =>
        goal.id === updatedGoal.id ? updatedGoal : goal
      );
      set({ goals });
      get().refreshProgresses();
    } catch (error) {
      console.error('Error updating goal:', error);
      set({ goalError: (error as Error).message });
      throw error;
    }
  },

  // Delete goal
  deleteGoal: (id: string) => {
    set({ goalError: null });

    try {
      GoalService.deleteGoal(id);
      const goals = get().goals.filter((goal) => goal.id !== id);
      set({ goals });
      get().refreshProgresses();
    } catch (error) {
      console.error('Error deleting goal:', error);
      set({ goalError: (error as Error).message });
      throw error;
    }
  },

  // Reset goal progress
  resetGoalProgress: (id: string) => {
    set({ goalError: null });

    try {
      const resetGoal = GoalService.resetGoalProgress(id);
      const goals = get().goals.map((goal) =>
        goal.id === resetGoal.id ? resetGoal : goal
      );
      set({ goals });
      get().refreshProgresses();
    } catch (error) {
      console.error('Error resetting goal:', error);
      set({ goalError: (error as Error).message });
      throw error;
    }
  },

  // Complete goal
  completeGoal: (id: string) => {
    set({ goalError: null });

    try {
      const completedGoal = GoalService.completeGoal(id);
      const goals = get().goals.map((goal) =>
        goal.id === completedGoal.id ? completedGoal : goal
      );
      set({ goals });
      get().refreshProgresses();
    } catch (error) {
      console.error('Error completing goal:', error);
      set({ goalError: (error as Error).message });
      throw error;
    }
  },

  // Auto-update goals based on portfolio metrics
  autoUpdateGoals: (portfolioId, metrics) => {
    try {
      const updatedGoals = GoalService.autoUpdateGoals(portfolioId, metrics);

      if (updatedGoals.length > 0) {
        // Reload goals to get latest state
        const goals = GoalService.getGoalsByPortfolio(portfolioId);
        set({ goals });
        get().refreshProgresses();

        console.log(`✅ Auto-updated ${updatedGoals.length} goals`);
      }
    } catch (error) {
      console.error('Error auto-updating goals:', error);
    }
  },

  // Refresh goal progresses and alerts
  refreshProgresses: () => {
    const goals = get().goals;
    const progressMap = new Map<string, GoalProgress>();
    const allAlerts: GoalAlert[] = [];

    goals.forEach((goal) => {
      const progress = calculateGoalProgress(goal);
      progressMap.set(goal.id, progress);

      const alerts = generateGoalAlerts(progress);
      allAlerts.push(...alerts);
    });

    set({
      goalProgresses: progressMap,
      alerts: allAlerts,
    });
  },

  // Get goal by ID
  getGoalById: (id: string) => {
    return get().goals.find((goal) => goal.id === id);
  },

  // Reset store to initial state
  reset: () => set(initialState),
}));

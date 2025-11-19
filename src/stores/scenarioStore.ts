/**
 * Scenario Store
 *
 * Zustand store for managing what-if scenarios with localStorage persistence.
 */

import { create } from 'zustand';
import {
  Scenario,
  PositionAdjustment,
  NewPosition,
  HypotheticalPosition,
  ScenarioMetrics,
  ScenarioComparison,
} from '@/types/scenario';
import {
  applyScenarioToPortfolio,
  calculateScenarioMetrics,
  calculateCurrentMetrics,
  compareScenarios,
} from '@/lib/scenario-calculations';
import { PortfolioPosition } from '@/lib/tinkoff-api';

interface ScenarioState {
  // Saved scenarios
  scenarios: Scenario[];

  // Current working scenario (unsaved)
  currentScenario: {
    adjustments: PositionAdjustment[];
    newPositions: NewPosition[];
  };

  // Computed state
  hypotheticalPositions: HypotheticalPosition[];
  currentMetrics: ScenarioMetrics | null;
  scenarioMetrics: ScenarioMetrics | null;
  comparison: ScenarioComparison | null;

  // UI state
  loading: boolean;
  error: string | null;

  // Actions
  loadScenarios: (portfolioId: string) => void;
  createScenario: (
    portfolioId: string,
    name: string,
    description?: string
  ) => void;
  updateScenario: (id: string, updates: Partial<Scenario>) => void;
  deleteScenario: (id: string) => void;
  loadScenario: (id: string) => void;
  clearCurrentScenario: () => void;

  // Adjustment actions
  addAdjustment: (adjustment: PositionAdjustment) => void;
  updateAdjustment: (figi: string, quantityChange: number) => void;
  removeAdjustment: (figi: string) => void;

  // New position actions
  addNewPosition: (position: NewPosition) => void;
  updateNewPosition: (figi: string, quantity: number) => void;
  removeNewPosition: (figi: string) => void;

  // Calculation actions
  calculateScenario: (currentPositions: PortfolioPosition[]) => void;
  reset: () => void;
}

const STORAGE_KEY = 'investment_scenarios';

/**
 * Load scenarios from localStorage
 */
function loadScenariosFromStorage(portfolioId: string): Scenario[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const allScenarios: Scenario[] = JSON.parse(stored);
    return allScenarios.filter((s) => s.portfolioId === portfolioId);
  } catch (error) {
    console.error('Failed to load scenarios from localStorage:', error);
    return [];
  }
}

/**
 * Save scenarios to localStorage
 */
function saveScenariosToStorage(scenarios: Scenario[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
  } catch (error) {
    console.error('Failed to save scenarios to localStorage:', error);
  }
}

/**
 * Generate unique scenario ID
 */
function generateScenarioId(): string {
  return `scenario_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const useScenarioStore = create<ScenarioState>((set, get) => ({
  // Initial state
  scenarios: [],
  currentScenario: {
    adjustments: [],
    newPositions: [],
  },
  hypotheticalPositions: [],
  currentMetrics: null,
  scenarioMetrics: null,
  comparison: null,
  loading: false,
  error: null,

  // Load scenarios for a portfolio
  loadScenarios: (portfolioId: string) => {
    const scenarios = loadScenariosFromStorage(portfolioId);
    set({ scenarios, error: null });
  },

  // Create a new scenario
  createScenario: (portfolioId: string, name: string, description?: string) => {
    const { currentScenario, scenarios } = get();

    const newScenario: Scenario = {
      id: generateScenarioId(),
      portfolioId,
      name,
      description,
      adjustments: [...currentScenario.adjustments],
      newPositions: [...currentScenario.newPositions],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedScenarios = [...scenarios, newScenario];
    saveScenariosToStorage(updatedScenarios);
    set({ scenarios: updatedScenarios, error: null });
  },

  // Update an existing scenario
  updateScenario: (id: string, updates: Partial<Scenario>) => {
    const { scenarios } = get();

    const updatedScenarios = scenarios.map((scenario) =>
      scenario.id === id
        ? { ...scenario, ...updates, updatedAt: new Date().toISOString() }
        : scenario
    );

    saveScenariosToStorage(updatedScenarios);
    set({ scenarios: updatedScenarios, error: null });
  },

  // Delete a scenario
  deleteScenario: (id: string) => {
    const { scenarios } = get();
    const updatedScenarios = scenarios.filter((s) => s.id !== id);
    saveScenariosToStorage(updatedScenarios);
    set({ scenarios: updatedScenarios, error: null });
  },

  // Load a saved scenario into current scenario
  loadScenario: (id: string) => {
    const { scenarios } = get();
    const scenario = scenarios.find((s) => s.id === id);

    if (scenario) {
      set({
        currentScenario: {
          adjustments: [...scenario.adjustments],
          newPositions: [...scenario.newPositions],
        },
        error: null,
      });
    }
  },

  // Clear current scenario
  clearCurrentScenario: () => {
    set({
      currentScenario: {
        adjustments: [],
        newPositions: [],
      },
      hypotheticalPositions: [],
      scenarioMetrics: null,
      comparison: null,
      error: null,
    });
  },

  // Add or update an adjustment
  addAdjustment: (adjustment: PositionAdjustment) => {
    const { currentScenario } = get();
    const existingIndex = currentScenario.adjustments.findIndex(
      (adj) => adj.figi === adjustment.figi
    );

    let updatedAdjustments: PositionAdjustment[];

    if (existingIndex >= 0) {
      updatedAdjustments = currentScenario.adjustments.map((adj, i) =>
        i === existingIndex ? adjustment : adj
      );
    } else {
      updatedAdjustments = [...currentScenario.adjustments, adjustment];
    }

    set({
      currentScenario: {
        ...currentScenario,
        adjustments: updatedAdjustments,
      },
      error: null,
    });
  },

  // Update an adjustment's quantity change
  updateAdjustment: (figi: string, quantityChange: number) => {
    const { currentScenario } = get();
    const updatedAdjustments = currentScenario.adjustments.map((adj) =>
      adj.figi === figi ? { ...adj, quantityChange } : adj
    );

    set({
      currentScenario: {
        ...currentScenario,
        adjustments: updatedAdjustments,
      },
      error: null,
    });
  },

  // Remove an adjustment
  removeAdjustment: (figi: string) => {
    const { currentScenario } = get();
    const updatedAdjustments = currentScenario.adjustments.filter(
      (adj) => adj.figi !== figi
    );

    set({
      currentScenario: {
        ...currentScenario,
        adjustments: updatedAdjustments,
      },
      error: null,
    });
  },

  // Add a new position
  addNewPosition: (position: NewPosition) => {
    const { currentScenario } = get();
    const existingIndex = currentScenario.newPositions.findIndex(
      (pos) => pos.figi === position.figi
    );

    let updatedNewPositions: NewPosition[];

    if (existingIndex >= 0) {
      updatedNewPositions = currentScenario.newPositions.map((pos, i) =>
        i === existingIndex ? position : pos
      );
    } else {
      updatedNewPositions = [...currentScenario.newPositions, position];
    }

    set({
      currentScenario: {
        ...currentScenario,
        newPositions: updatedNewPositions,
      },
      error: null,
    });
  },

  // Update a new position's quantity
  updateNewPosition: (figi: string, quantity: number) => {
    const { currentScenario } = get();
    const updatedNewPositions = currentScenario.newPositions.map((pos) =>
      pos.figi === figi ? { ...pos, quantity } : pos
    );

    set({
      currentScenario: {
        ...currentScenario,
        newPositions: updatedNewPositions,
      },
      error: null,
    });
  },

  // Remove a new position
  removeNewPosition: (figi: string) => {
    const { currentScenario } = get();
    const updatedNewPositions = currentScenario.newPositions.filter(
      (pos) => pos.figi !== figi
    );

    set({
      currentScenario: {
        ...currentScenario,
        newPositions: updatedNewPositions,
      },
      error: null,
    });
  },

  // Calculate scenario metrics and comparison
  calculateScenario: (currentPositions: PortfolioPosition[]) => {
    const { currentScenario } = get();

    try {
      // Calculate current metrics
      const currentMetrics = calculateCurrentMetrics(currentPositions);

      // Apply scenario to portfolio
      const hypotheticalPositions = applyScenarioToPortfolio(
        currentPositions,
        currentScenario.adjustments,
        currentScenario.newPositions
      );

      // Calculate scenario metrics
      const scenarioMetrics = calculateScenarioMetrics(hypotheticalPositions);

      // Compare scenarios
      const comparison = compareScenarios(currentMetrics, scenarioMetrics);

      set({
        currentMetrics,
        hypotheticalPositions,
        scenarioMetrics,
        comparison,
        error: null,
      });
    } catch (error) {
      console.error('Failed to calculate scenario:', error);
      set({
        error:
          error instanceof Error ? error.message : 'Failed to calculate scenario',
      });
    }
  },

  // Reset store
  reset: () => {
    set({
      currentScenario: {
        adjustments: [],
        newPositions: [],
      },
      hypotheticalPositions: [],
      currentMetrics: null,
      scenarioMetrics: null,
      comparison: null,
      error: null,
    });
  },
}));

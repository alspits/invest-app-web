/**
 * Scenario Store Types
 */

import type { Scenario, ScenarioResult } from '@/lib/scenario/types';

/**
 * Scenario Store State
 */
export interface ScenarioState {
  // Saved scenarios
  scenarios: Scenario[];

  // Currently selected scenario
  selectedScenarioId: string | null;

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions
  createScenario: (scenario: Omit<Scenario, 'id' | 'createdAt' | 'updatedAt'>) => Scenario;
  updateScenario: (id: string, updates: Partial<Scenario>) => void;
  deleteScenario: (id: string) => void;
  duplicateScenario: (id: string) => Scenario;

  selectScenario: (id: string | null) => void;
  getScenario: (id: string) => Scenario | undefined;

  // Result caching
  cacheResult: (scenarioId: string, result: ScenarioResult) => void;
  clearCache: (scenarioId: string) => void;

  // Persistence
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

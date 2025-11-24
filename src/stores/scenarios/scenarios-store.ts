/**
 * Scenario Store
 * State management for What-If scenarios
 */

import { create } from 'zustand';
import type { Scenario, ScenarioResult } from '@/lib/scenario/types';
import type { ScenarioState } from './types';

const STORAGE_KEY = 'scenarios-v1';

export const useScenarioStore = create<ScenarioState>((set, get) => ({
  scenarios: [],
  selectedScenarioId: null,
  isLoading: false,
  error: null,

  createScenario: (data) => {
    const newScenario: Scenario = {
      ...data,
      id: `scenario-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({
      scenarios: [...state.scenarios, newScenario],
    }));

    get().saveToStorage();
    return newScenario;
  },

  updateScenario: (id, updates) => {
    set((state) => ({
      scenarios: state.scenarios.map((s) =>
        s.id === id ? { ...s, ...updates, updatedAt: new Date() } : s
      ),
    }));
    get().saveToStorage();
  },

  deleteScenario: (id) => {
    set((state) => ({
      scenarios: state.scenarios.filter((s) => s.id !== id),
      selectedScenarioId: state.selectedScenarioId === id ? null : state.selectedScenarioId,
    }));
    get().saveToStorage();
  },

  duplicateScenario: (id) => {
    const original = get().scenarios.find((s) => s.id === id);
    if (!original) throw new Error(`Scenario ${id} not found`);

    const duplicate: Scenario = {
      ...original,
      id: `scenario-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `${original.name} (Copy)`,
      result: undefined, // Clear cached result
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({
      scenarios: [...state.scenarios, duplicate],
    }));

    get().saveToStorage();
    return duplicate;
  },

  selectScenario: (id) => {
    set({ selectedScenarioId: id });
  },

  getScenario: (id) => {
    return get().scenarios.find((s) => s.id === id);
  },

  cacheResult: (scenarioId, result) => {
    get().updateScenario(scenarioId, { result });
  },

  clearCache: (scenarioId) => {
    get().updateScenario(scenarioId, { result: undefined });
  },

  loadFromStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);

        // Validate data structure
        if (!data || !Array.isArray(data.scenarios)) {
          console.warn('Invalid scenarios data in storage, resetting');
          set({ scenarios: [] });
          return;
        }

        // Convert date strings back to Date objects
        const scenarios = data.scenarios.map((s: Scenario) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
        }));
        set({ scenarios });
      }
    } catch (error) {
      console.error('Failed to load scenarios from storage:', error);
      set({ scenarios: [] });
    }
  },

  saveToStorage: () => {
    try {
      const { scenarios } = get();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ scenarios }));
    } catch (error) {
      console.error('Failed to save scenarios to storage:', error);
    }
  },
}));

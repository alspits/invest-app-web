import { create } from 'zustand';
import type {
  PatternAnalysis,
  TradingPattern,
  PatternStats,
  PatternCategory,
} from '@/types/trading-pattern';

// ============================================================================
// Pattern Store State
// ============================================================================

interface PatternState {
  // Data
  analysis: PatternAnalysis | null;
  selectedCategory: PatternCategory | null;
  analysisWindowDays: number;

  // UI State
  isLoading: boolean;
  error: string | null;

  // Actions
  loadPatterns: (accountId: string, days?: number) => Promise<void>;
  setSelectedCategory: (category: PatternCategory | null) => void;
  setAnalysisWindowDays: (days: number) => void;
  clearError: () => void;
  reset: () => void;

  // Computed getters
  getPatternsByCategory: (category: PatternCategory) => TradingPattern[];
  getStatsByCategory: (category: PatternCategory) => PatternStats | undefined;
  getFilteredPatterns: () => TradingPattern[];
}

// ============================================================================
// Pattern Store
// ============================================================================

export const usePatternStore = create<PatternState>((set, get) => ({
  // Initial state
  analysis: null,
  selectedCategory: null,
  analysisWindowDays: 90,
  isLoading: false,
  error: null,

  // Load patterns from API
  loadPatterns: async (accountId: string, days?: number) => {
    const windowDays = days || get().analysisWindowDays;

    set({ isLoading: true, error: null });

    try {
      console.log('📊 Loading trading patterns...', {
        accountId,
        days: windowDays,
      });

      const response = await fetch(
        `/api/patterns?accountId=${accountId}&days=${windowDays}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to load patterns');
      }

      const analysis: PatternAnalysis = await response.json();

      console.log('✅ Patterns loaded successfully', {
        totalPatterns: analysis.patterns.length,
        riskScore: analysis.summary.riskScore,
      });

      set({
        analysis,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('❌ Error loading patterns:', error);

      set({
        isLoading: false,
        error: (error as Error).message || 'Failed to load patterns',
      });
    }
  },

  // Set selected category filter
  setSelectedCategory: (category) => {
    set({ selectedCategory: category });
  },

  // Set analysis window
  setAnalysisWindowDays: (days) => {
    set({ analysisWindowDays: days });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Reset store
  reset: () => {
    set({
      analysis: null,
      selectedCategory: null,
      analysisWindowDays: 90,
      isLoading: false,
      error: null,
    });
  },

  // Get patterns by category
  getPatternsByCategory: (category) => {
    const { analysis } = get();
    if (!analysis) return [];

    return analysis.patterns.filter((p) => p.category === category);
  },

  // Get statistics by category
  getStatsByCategory: (category) => {
    const { analysis } = get();
    if (!analysis) return undefined;

    return analysis.statistics.find((s) => s.category === category);
  },

  // Get filtered patterns (by selected category)
  getFilteredPatterns: () => {
    const { analysis, selectedCategory } = get();
    if (!analysis) return [];

    if (!selectedCategory) {
      return analysis.patterns;
    }

    return analysis.patterns.filter((p) => p.category === selectedCategory);
  },
}));

// ============================================================================
// Helper Hooks
// ============================================================================

/**
 * Hook to get pattern statistics
 */
export function usePatternStats(): PatternStats[] {
  return usePatternStore((state) => state.analysis?.statistics || []);
}

/**
 * Hook to get pattern summary
 */
export function usePatternSummary() {
  return usePatternStore((state) => state.analysis?.summary || null);
}

/**
 * Hook to get recommendations
 */
export function usePatternRecommendations() {
  return usePatternStore((state) => state.analysis?.recommendations || []);
}

/**
 * Hook to get filtered patterns
 */
export function useFilteredPatterns(): TradingPattern[] {
  return usePatternStore((state) => state.getFilteredPatterns());
}

/**
 * Hook to get loading state
 */
export function usePatternLoading(): boolean {
  return usePatternStore((state) => state.isLoading);
}

/**
 * Hook to get error state
 */
export function usePatternError(): string | null {
  return usePatternStore((state) => state.error);
}

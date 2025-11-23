import { StoreApi } from 'zustand';
import { AlertStore } from '../types';
import {
  mockAlerts,
  mockTriggerHistory,
  mockStatistics,
} from '../mock-data';

// Type aliases for Zustand store functions
type SetState = StoreApi<AlertStore>['setState'];

/**
 * Loads all alerts from API or mock data
 */
export async function loadAlertsAction(
  set: SetState
): Promise<void> {
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
}

/**
 * Loads trigger history for the specified number of days
 */
export async function loadTriggerHistoryAction(
  set: SetState,
  days: number = 30
): Promise<void> {
  // Validate days parameter
  if (!Number.isFinite(days) || days <= 0) {
    throw new Error(
      `Invalid days parameter: must be a positive finite number, got ${days}`
    );
  }

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
}

/**
 * Loads alert statistics
 */
export async function loadStatisticsAction(
  set: SetState
): Promise<void> {
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
}

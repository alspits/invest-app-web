import { create } from 'zustand';

/**
 * Notification permission states
 */
type PermissionState = 'default' | 'granted' | 'denied';

/**
 * Notification settings
 */
interface NotificationSettings {
  priceAlerts: boolean;
  portfolioUpdates: boolean;
  newsAlerts: boolean;
  goalAchievements: boolean;
}

/**
 * Notification store state
 */
interface NotificationStore {
  permission: PermissionState;
  isSupported: boolean;
  subscription: PushSubscription | null;
  settings: NotificationSettings;

  // Actions
  checkSupport: () => void;
  requestPermission: () => Promise<boolean>;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  sendTestNotification: () => Promise<void>;
}

/**
 * Default notification settings
 */
const defaultSettings: NotificationSettings = {
  priceAlerts: true,
  portfolioUpdates: true,
  newsAlerts: false,
  goalAchievements: true,
};

/**
 * Notification store for managing push notifications
 */
export const useNotificationStore = create<NotificationStore>((set, get) => ({
  permission: 'default',
  isSupported: false,
  subscription: null,
  settings: defaultSettings,

  /**
   * Check if push notifications are supported
   */
  checkSupport: () => {
    const isSupported =
      typeof window !== 'undefined' &&
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window;

    set({ isSupported });

    if (isSupported) {
      set({ permission: Notification.permission });
    }
  },

  /**
   * Request notification permission from user
   */
  requestPermission: async () => {
    const { isSupported } = get();

    if (!isSupported) {
      console.error('[Notifications] Not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      set({ permission });

      if (permission === 'granted') {
        // Auto-subscribe after granting permission
        await get().subscribe();
        return true;
      }

      return false;
    } catch (error) {
      console.error('[Notifications] Permission request failed:', error);
      return false;
    }
  },

  /**
   * Subscribe to push notifications
   */
  subscribe: async () => {
    const { permission } = get();

    if (permission !== 'granted') {
      console.error('[Notifications] Permission not granted');
      return;
    }

    try {
      // Wait for service worker to be ready
      const registration = await navigator.serviceWorker.ready;

      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // Create new subscription
        // Note: In production, use your own VAPID public key
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

        if (!vapidPublicKey) {
          console.warn('[Notifications] VAPID key not configured');
          // For development, we can still create subscription without VAPID
        }

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidPublicKey || undefined,
        });

        // Send subscription to backend
        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription,
            settings: get().settings,
          }),
        });

        console.log('[Notifications] Subscribed successfully');
      }

      set({ subscription });
    } catch (error) {
      console.error('[Notifications] Subscription failed:', error);
    }
  },

  /**
   * Unsubscribe from push notifications
   */
  unsubscribe: async () => {
    const { subscription } = get();

    if (!subscription) {
      console.warn('[Notifications] No active subscription');
      return;
    }

    try {
      // Unsubscribe from push manager
      await subscription.unsubscribe();

      // Notify backend
      await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription }),
      });

      set({ subscription: null });
      console.log('[Notifications] Unsubscribed successfully');
    } catch (error) {
      console.error('[Notifications] Unsubscribe failed:', error);
    }
  },

  /**
   * Update notification settings
   */
  updateSettings: (newSettings) => {
    const settings = { ...get().settings, ...newSettings };
    set({ settings });

    // Sync with backend
    fetch('/api/notifications/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings }),
    }).catch((error) => {
      console.error('[Notifications] Failed to update settings:', error);
    });
  },

  /**
   * Send test notification
   */
  sendTestNotification: async () => {
    const { permission, subscription } = get();

    if (permission !== 'granted' || !subscription) {
      console.error('[Notifications] Not subscribed');
      return;
    }

    try {
      await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription }),
      });

      console.log('[Notifications] Test notification sent');
    } catch (error) {
      console.error('[Notifications] Test notification failed:', error);
    }
  },
}));

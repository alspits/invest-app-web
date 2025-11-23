import { Alert } from '@/types/alert';

/**
 * Check if current time is in DND period
 * @param dndSettings - Do Not Disturb settings
 * @returns true if in DND period
 */
export function isInDNDPeriod(dndSettings: Alert['dndSettings']): boolean {
  if (!dndSettings.enabled) return false;

  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  // Check if current day is in DND days
  if (!dndSettings.days.includes(currentDay)) {
    return false;
  }

  // Check if current time is in DND time range
  const { startTime, endTime } = dndSettings;

  // Handle overnight DND (e.g., 22:00 to 08:00)
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime <= endTime;
  }

  // Handle same-day DND (e.g., 12:00 to 14:00)
  return currentTime >= startTime && currentTime <= endTime;
}

/**
 * Check if alert is in cooldown period
 * @param alert - Alert to check
 * @returns true if in cooldown period
 */
export function isInCooldownPeriod(alert: Alert): boolean {
  if (!alert.lastTriggeredAt) return false;

  const cooldownMs = alert.frequency.cooldownMinutes * 60 * 1000;
  const timeSinceLastTrigger = Date.now() - alert.lastTriggeredAt.getTime();

  return timeSinceLastTrigger < cooldownMs;
}

/**
 * Check if alert has reached daily limit
 * @param alert - Alert to check
 * @returns true if daily limit reached
 * @note This would require checking trigger history from database
 *       Currently returns false - implement in store/database layer
 */
export function hasReachedDailyLimit(alert: Alert): boolean {
  // This would require checking trigger history
  // For now, we'll implement this in the store/database layer
  return false;
}

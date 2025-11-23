import type { EmotionalTrigger } from '@/types/trading-pattern';

/**
 * Create an emotional trigger instance with localized description
 *
 * @param type - Type of emotional trigger
 * @param severity - Severity level (low, medium, high)
 * @param date - Date when trigger was detected
 * @param operationIds - IDs of related operations
 * @returns Emotional trigger object
 *
 * @example
 * ```typescript
 * const trigger = createTrigger('panic', 'high', '2024-01-15', ['op-123']);
 * console.log(trigger.description); // "Паническая продажа после резкого падения"
 * ```
 */
export function createTrigger(
  type: EmotionalTrigger['type'],
  severity: EmotionalTrigger['severity'],
  date: string,
  operationIds: string[]
): EmotionalTrigger {
  const descriptions: Record<string, string> = {
    panic: 'Паническая продажа после резкого падения',
    fomo: 'Импульсивная покупка (FOMO)',
    price_drop: 'Резкое падение цены',
    price_spike: 'Резкий рост цены',
    news: 'Реакция на новости',
    volatility: 'Высокая волатильность',
  };

  return {
    type,
    severity,
    detectedAt: new Date(date),
    description: descriptions[type] || 'Эмоциональный триггер',
    relatedOperations: operationIds,
  };
}

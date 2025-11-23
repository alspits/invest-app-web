import type { PatternCategory } from '@/types/trading-pattern';

/**
 * Format pattern category for user-friendly display (Russian)
 *
 * @param category - Pattern category to format
 * @returns Localized category name
 *
 * @example
 * ```typescript
 * formatPatternCategory('panic_sell'); // "Паническая продажа"
 * formatPatternCategory('fomo_buy'); // "FOMO покупка"
 * ```
 */
export function formatPatternCategory(category: PatternCategory): string {
  const labels: Record<PatternCategory, string> = {
    panic_sell: 'Паническая продажа',
    fomo_buy: 'FOMO покупка',
    strategic: 'Стратегическая',
    emotional: 'Эмоциональная',
  };

  return labels[category];
}

/**
 * Get Tailwind CSS color class for pattern category
 *
 * Color scheme:
 * - Panic Sell: Red (negative)
 * - FOMO Buy: Orange (warning)
 * - Strategic: Green (positive)
 * - Emotional: Yellow (caution)
 *
 * @param category - Pattern category
 * @returns Tailwind CSS color class
 *
 * @example
 * ```typescript
 * getPatternCategoryColor('panic_sell'); // "text-red-500"
 * getPatternCategoryColor('strategic'); // "text-green-500"
 * ```
 */
export function getPatternCategoryColor(category: PatternCategory): string {
  const colors: Record<PatternCategory, string> = {
    panic_sell: 'text-red-500',
    fomo_buy: 'text-orange-500',
    strategic: 'text-green-500',
    emotional: 'text-yellow-500',
  };

  return colors[category];
}

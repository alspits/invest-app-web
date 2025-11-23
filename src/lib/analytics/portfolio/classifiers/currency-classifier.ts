/**
 * Currency Classifier
 *
 * Determines currency classification from ticker or instrument data
 */

import type { CurrencyType } from '@/types/analytics';
import { GEOGRAPHY_MAP } from '../data/geography-map';

/**
 * Determine currency from ticker or instrument data
 *
 * @param ticker - Instrument ticker symbol
 * @param currency - Optional explicit currency code (e.g., 'RUB', 'USD')
 * @returns Currency classification ('RUB', 'USD', 'EUR', etc.)
 */
export function determineCurrency(
  ticker: string,
  currency?: string
): CurrencyType {
  // If currency is explicitly provided
  if (currency) {
    if (currency === 'RUB' || currency === 'rub') return 'RUB';
    if (currency === 'USD' || currency === 'usd') return 'USD';
    if (currency === 'EUR' || currency === 'eur') return 'EUR';
    if (currency === 'CNY' || currency === 'cny') return 'CNY';
    return 'other';
  }

  // Infer from ticker
  if (GEOGRAPHY_MAP[ticker] === 'usa') {
    return 'USD';
  }

  // Default to RUB for Russian stocks
  return 'RUB';
}

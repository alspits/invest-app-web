import {
  AlertOperator,
  AlertConditionField,
} from '@/types/alert';
import { MarketData, NewsData } from '../types';

/**
 * Compare values using operator
 * @param actual - Actual value to compare
 * @param operator - Comparison operator
 * @param target - Target value to compare against
 * @returns true if condition is met
 */
export function compareValues(
  actual: number,
  operator: AlertOperator,
  target: number
): boolean {
  switch (operator) {
    case 'GREATER_THAN':
      return actual > target;

    case 'LESS_THAN':
      return actual < target;

    case 'GREATER_THAN_EQUAL':
      return actual >= target;

    case 'LESS_THAN_EQUAL':
      return actual <= target;

    case 'EQUAL':
      return Math.abs(actual - target) < 0.01; // Floating point tolerance

    case 'NOT_EQUAL':
      return Math.abs(actual - target) >= 0.01;

    case 'PERCENTAGE_CHANGE':
      // Target is the percentage change threshold
      return Math.abs(actual) >= target;

    case 'CROSSES_ABOVE':
    case 'CROSSES_BELOW':
      // These require historical data, handled separately
      return false;

    default:
      return false;
  }
}

/**
 * Convert operator to symbol for display
 * @param operator - Alert operator
 * @returns symbol representation
 */
export function operatorToSymbol(operator: AlertOperator): string {
  const symbols: Record<AlertOperator, string> = {
    GREATER_THAN: '>',
    LESS_THAN: '<',
    GREATER_THAN_EQUAL: '≥',
    LESS_THAN_EQUAL: '≤',
    EQUAL: '=',
    NOT_EQUAL: '≠',
    PERCENTAGE_CHANGE: '%Δ',
    CROSSES_ABOVE: '↑',
    CROSSES_BELOW: '↓',
  };

  return symbols[operator] || operator;
}

/**
 * Get field value from market/news data
 * @param field - Alert condition field
 * @param marketData - Market data
 * @param newsData - Optional news data
 * @returns field value or null if unavailable
 */
export function getFieldValue(
  field: AlertConditionField,
  marketData: MarketData,
  newsData?: NewsData
): number | null {
  switch (field) {
    case 'PRICE':
      return marketData.price;

    case 'PRICE_CHANGE':
      return (
        ((marketData.price - marketData.previousClose) / marketData.previousClose) *
        100
      );

    case 'VOLUME':
      return marketData.volume;

    case 'VOLUME_RATIO':
      return marketData.averageVolume
        ? marketData.volume / marketData.averageVolume
        : null;

    case 'PE_RATIO':
      return marketData.peRatio ?? null;

    case 'RSI':
      return marketData.rsi ?? null;

    case 'MOVING_AVG_50':
      return marketData.movingAvg50 ?? null;

    case 'MOVING_AVG_200':
      return marketData.movingAvg200 ?? null;

    case 'NEWS_SENTIMENT':
      return newsData?.averageSentiment ?? null;

    case 'MARKET_CAP':
      return marketData.marketCap ?? null;

    default:
      return null;
  }
}

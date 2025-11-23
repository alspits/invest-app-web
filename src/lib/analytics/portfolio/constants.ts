/**
 * Portfolio Analysis Constants
 *
 * Defines market cap thresholds for classification
 */

// Market cap thresholds in RUB
export const MARKET_CAP_THRESHOLDS = {
  LARGE_CAP: 200_000_000_000, // 200B RUB
  MID_CAP: 10_000_000_000, // 10B RUB
} as const;

/**
 * Market Cap Classifier
 *
 * Classifies instruments by market capitalization size
 */

import type { MarketCapType } from '@/types/analytics';
import { MARKET_CAP_MAP } from '../data/market-cap-map';
import { MARKET_CAP_THRESHOLDS } from '../constants';

/**
 * Classify market cap for a given ticker
 *
 * @param ticker - Instrument ticker symbol
 * @returns Market cap classification ('large', 'mid', 'small')
 */
export function classifyMarketCap(ticker: string): MarketCapType {
  const marketCap = MARKET_CAP_MAP[ticker];

  if (!marketCap) {
    return 'mid'; // Default to mid cap if unknown
  }

  if (marketCap >= MARKET_CAP_THRESHOLDS.LARGE_CAP) {
    return 'large';
  } else if (marketCap >= MARKET_CAP_THRESHOLDS.MID_CAP) {
    return 'mid';
  } else {
    return 'small';
  }
}

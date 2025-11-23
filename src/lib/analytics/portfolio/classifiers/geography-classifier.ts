/**
 * Geography Classifier
 *
 * Classifies instruments into geographic regions
 */

import type { GeographyType } from '@/types/analytics';
import { GEOGRAPHY_MAP } from '../data/geography-map';

/**
 * Classify geography for a given ticker
 *
 * @param ticker - Instrument ticker symbol
 * @returns Geography classification ('russia', 'usa', 'europe', etc.)
 */
export function classifyGeography(ticker: string): GeographyType {
  return GEOGRAPHY_MAP[ticker] || 'russia';
}

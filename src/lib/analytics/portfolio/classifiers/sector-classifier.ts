/**
 * Sector Classifier
 *
 * Classifies instruments into sector categories
 */

import type { SectorType } from '@/types/analytics';
import { SECTOR_MAP } from '../data/sector-map';

/**
 * Classify sector for a given ticker
 *
 * @param ticker - Instrument ticker symbol
 * @returns Sector classification ('finance', 'energy', 'tech', etc.)
 */
export function classifySector(ticker: string): SectorType {
  return SECTOR_MAP[ticker] || 'other';
}

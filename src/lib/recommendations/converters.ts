/**
 * Converter utilities for Tinkoff API data transformations
 *
 * Handles conversion of MoneyValue and Quotation types to numbers,
 * ID generation, and instrument type mapping.
 */

import { MoneyValue, Quotation } from '../tinkoff-api';
import { RecommendationType } from './types';

/**
 * Convert MoneyValue to number
 *
 * @param money - MoneyValue object from Tinkoff API
 * @returns Numeric value
 */
export function moneyValueToNumber(money: MoneyValue): number {
  const units = parseFloat(money.units);
  const nano = money.nano / 1_000_000_000;
  return units + nano;
}

/**
 * Convert Quotation to number
 *
 * @param quotation - Quotation object from Tinkoff API
 * @returns Numeric value
 */
export function quotationToNumber(quotation: Quotation): number {
  const units = parseFloat(quotation.units);
  const nano = quotation.nano / 1_000_000_000;
  return units + nano;
}

/**
 * Generate unique recommendation ID
 *
 * @param type - Recommendation type
 * @param index - Index in the list
 * @returns Unique recommendation ID
 */
export function generateRecommendationId(type: RecommendationType, index: number): string {
  return `rec_${type}_${index}_${Date.now()}`;
}

/**
 * Map instrument type to sector (simplified categorization)
 *
 * @param instrumentType - Instrument type from Tinkoff API
 * @returns Sector name in Russian
 */
export function mapInstrumentTypeToSector(instrumentType: string): string {
  const sectorMap: Record<string, string> = {
    share: 'Акции',
    bond: 'Облигации',
    etf: 'ETF',
    currency: 'Валюта',
    futures: 'Фьючерсы',
  };

  return sectorMap[instrumentType.toLowerCase()] || 'Прочее';
}

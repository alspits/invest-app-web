/**
 * Sector Allocation Analyzer
 *
 * Calculates portfolio distribution across different sectors (stocks, bonds,
 * ETFs, futures) to identify sector concentration and diversification levels.
 */

import { PortfolioResponse } from '../../tinkoff-api';
import { SectorAllocation } from '../types';
import { moneyValueToNumber, quotationToNumber, mapInstrumentTypeToSector } from '../converters';

/**
 * Calculate sector allocation breakdown
 *
 * Groups portfolio positions by sector and calculates:
 * - Total value per sector
 * - Percentage allocation per sector
 * - List of positions in each sector
 *
 * @param portfolio - Portfolio data from Tinkoff API
 * @returns Array of sector allocations sorted by percentage (descending)
 */
export function calculateSectorAllocation(portfolio: PortfolioResponse): SectorAllocation[] {
  const positions = portfolio.positions;

  // Calculate total portfolio value (excluding cash)
  const totalValue =
    moneyValueToNumber(portfolio.totalAmountShares) +
    moneyValueToNumber(portfolio.totalAmountBonds) +
    moneyValueToNumber(portfolio.totalAmountEtf) +
    moneyValueToNumber(portfolio.totalAmountFutures);

  // Group positions by sector
  const sectorMap = new Map<string, { value: number; positions: string[] }>();

  positions.forEach((pos) => {
    const sector = mapInstrumentTypeToSector(pos.instrumentType);
    const currentPrice = pos.currentPrice ? moneyValueToNumber(pos.currentPrice) : 0;
    const quantity = quotationToNumber(pos.quantity);
    const value = currentPrice * quantity;

    if (value > 0 && sector !== 'Валюта') {
      // Exclude cash from sector allocation
      const existing = sectorMap.get(sector) || { value: 0, positions: [] };
      existing.value += value;
      existing.positions.push(pos.ticker || pos.figi);
      sectorMap.set(sector, existing);
    }
  });

  // Convert to array and calculate percentages
  const sectorAllocations: SectorAllocation[] = Array.from(sectorMap.entries())
    .map(([sector, data]) => ({
      sector,
      value: data.value,
      percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
      positions: data.positions,
    }))
    .sort((a, b) => b.percentage - a.percentage);

  return sectorAllocations;
}

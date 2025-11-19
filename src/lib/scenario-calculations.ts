/**
 * Scenario Calculation Utilities
 *
 * Functions for calculating hypothetical portfolio metrics
 * and comparing scenarios with current portfolio.
 */

import {
  PositionAdjustment,
  NewPosition,
  HypotheticalPosition,
  ScenarioMetrics,
  ScenarioComparison,
} from '@/types/scenario';
import { PortfolioPosition, quotationToNumber } from '@/lib/tinkoff-api';

/**
 * Apply scenario adjustments to portfolio positions
 */
export function applyScenarioToPortfolio(
  currentPositions: PortfolioPosition[],
  adjustments: PositionAdjustment[],
  newPositions: NewPosition[]
): HypotheticalPosition[] {
  const hypotheticalPositions: HypotheticalPosition[] = [];

  // Create a map for quick lookup of adjustments
  const adjustmentMap = new Map(adjustments.map((adj) => [adj.figi, adj]));

  // Apply adjustments to existing positions
  for (const position of currentPositions) {
    const quantity = quotationToNumber(position.quantity);
    const currentPrice = position.currentPrice
      ? quotationToNumber(position.currentPrice)
      : quotationToNumber(position.averagePositionPrice);
    const adjustment = adjustmentMap.get(position.figi);

    const newQuantity = adjustment
      ? quantity + adjustment.quantityChange
      : quantity;

    // Only include positions with positive quantity
    if (newQuantity > 0) {
      hypotheticalPositions.push({
        figi: position.figi,
        ticker: position.ticker || 'N/A',
        name: position.name || 'Unknown',
        instrumentType: position.instrumentType || 'unknown',
        quantity: newQuantity,
        currentPrice,
        totalValue: newQuantity * currentPrice,
        currency: position.averagePositionPrice.currency || 'RUB',
        isModified: !!adjustment,
        originalQuantity: quantity,
      });
    }
  }

  // Add new positions
  for (const newPos of newPositions) {
    // Skip if position already exists (should be in adjustments instead)
    if (hypotheticalPositions.some((p) => p.figi === newPos.figi)) {
      continue;
    }

    if (newPos.quantity > 0) {
      hypotheticalPositions.push({
        figi: newPos.figi,
        ticker: newPos.ticker,
        name: newPos.name,
        instrumentType: newPos.instrumentType,
        quantity: newPos.quantity,
        currentPrice: newPos.pricePerUnit,
        totalValue: newPos.quantity * newPos.pricePerUnit,
        currency: newPos.currency,
        isNew: true,
      });
    }
  }

  return hypotheticalPositions;
}

/**
 * Calculate scenario metrics from hypothetical positions
 */
export function calculateScenarioMetrics(
  positions: HypotheticalPosition[]
): ScenarioMetrics {
  // Calculate total value
  const totalValue = positions.reduce((sum, pos) => sum + pos.totalValue, 0);

  // Calculate sector allocation
  const sectorAllocation: {
    [key: string]: {
      value: number;
      percentage: number;
      count: number;
    };
  } = {};

  positions.forEach((pos) => {
    const type = pos.instrumentType || 'unknown';
    if (!sectorAllocation[type]) {
      sectorAllocation[type] = { value: 0, percentage: 0, count: 0 };
    }
    sectorAllocation[type].value += pos.totalValue;
    sectorAllocation[type].count += 1;
  });

  // Calculate percentages
  Object.keys(sectorAllocation).forEach((type) => {
    sectorAllocation[type].percentage =
      totalValue > 0 ? (sectorAllocation[type].value / totalValue) * 100 : 0;
  });

  // Calculate HHI (Herfindahl-Hirschman Index)
  let hhi = 0;
  if (totalValue > 0) {
    positions.forEach((pos) => {
      const share = (pos.totalValue / totalValue) * 100;
      hhi += share * share;
    });
  }

  // Calculate diversification score (inverse of normalized HHI)
  // HHI ranges from 100/n (perfectly diversified) to 10000 (concentrated)
  // We normalize to 0-1 where 1 is perfectly diversified
  const maxHHI = 10000;
  const minHHI = positions.length > 0 ? 10000 / positions.length : 0;
  const diversificationScore =
    maxHHI > minHHI ? 1 - (hhi - minHHI) / (maxHHI - minHHI) : 0;

  // Get top 5 positions by value
  const topPositions = [...positions]
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 5)
    .map((pos) => ({
      ticker: pos.ticker,
      name: pos.name,
      value: pos.totalValue,
      percentage: totalValue > 0 ? (pos.totalValue / totalValue) * 100 : 0,
    }));

  // Calculate cash impact
  const cashImpact = positions
    .filter((p) => p.isNew || p.isModified)
    .reduce((sum, pos) => {
      if (pos.isNew) {
        return sum + pos.totalValue;
      }
      if (pos.isModified && pos.originalQuantity !== undefined) {
        const quantityChange = pos.quantity - pos.originalQuantity;
        return sum + quantityChange * pos.currentPrice;
      }
      return sum;
    }, 0);

  return {
    totalValue,
    diversificationScore: Math.max(0, Math.min(1, diversificationScore)),
    hhi: Math.round(hhi),
    sectorAllocation,
    topPositions,
    positionCount: positions.length,
    cashImpact,
  };
}

/**
 * Calculate metrics for current portfolio
 */
export function calculateCurrentMetrics(
  positions: PortfolioPosition[]
): ScenarioMetrics {
  const hypotheticalPositions: HypotheticalPosition[] = positions.map(
    (pos) => {
      const currentPrice = pos.currentPrice
        ? quotationToNumber(pos.currentPrice)
        : quotationToNumber(pos.averagePositionPrice);
      const quantity = quotationToNumber(pos.quantity);

      return {
        figi: pos.figi,
        ticker: pos.ticker || 'N/A',
        name: pos.name || 'Unknown',
        instrumentType: pos.instrumentType || 'unknown',
        quantity,
        currentPrice,
        totalValue: currentPrice * quantity,
        currency: pos.averagePositionPrice.currency || 'RUB',
      };
    }
  );

  return calculateScenarioMetrics(hypotheticalPositions);
}

/**
 * Compare current portfolio with scenario
 */
export function compareScenarios(
  currentMetrics: ScenarioMetrics,
  scenarioMetrics: ScenarioMetrics
): ScenarioComparison {
  const totalValueDiff = scenarioMetrics.totalValue - currentMetrics.totalValue;
  const totalValuePercent =
    currentMetrics.totalValue > 0
      ? (totalValueDiff / currentMetrics.totalValue) * 100
      : 0;

  return {
    current: currentMetrics,
    scenario: scenarioMetrics,
    diff: {
      totalValue: totalValueDiff,
      totalValuePercent,
      diversificationScore:
        scenarioMetrics.diversificationScore -
        currentMetrics.diversificationScore,
      hhi: scenarioMetrics.hhi - currentMetrics.hhi,
      positionCount:
        scenarioMetrics.positionCount - currentMetrics.positionCount,
      cashImpact: scenarioMetrics.cashImpact,
    },
  };
}

/**
 * Format currency value
 */
export function formatCurrency(value: number, currency = 'RUB'): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format percentage value
 */
export function formatPercentage(value: number, decimals = 2): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

/**
 * Get instrument type label in Russian
 */
export function getInstrumentTypeLabel(type: string): string {
  const labels: { [key: string]: string } = {
    share: 'Акции',
    bond: 'Облигации',
    etf: 'ETF',
    currency: 'Валюта',
    futures: 'Фьючерсы',
    option: 'Опционы',
    unknown: 'Неизвестно',
  };
  return labels[type.toLowerCase()] || type;
}

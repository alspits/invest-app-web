/**
 * What-If Scenario Engine
 * Core logic for simulating portfolio changes and calculating impact
 */

import type { PortfolioPosition } from '@/lib/tinkoff-api';
import { moneyValueToNumber, quotationToNumber } from '@/lib/tinkoff-api';
import type {
  Position,
  ScenarioChange,
  ScenarioResult,
  ScenarioSnapshot,
  ScenarioComparison,
} from './types';

// ============================================================================
// Conversion Utilities
// ============================================================================

/**
 * Convert PortfolioPosition to simplified Position
 */
export function convertToPosition(portfolioPosition: PortfolioPosition): Position {
  const quantity = quotationToNumber(portfolioPosition.quantity);
  const currentPrice = moneyValueToNumber(portfolioPosition.currentPrice);
  const averagePrice = moneyValueToNumber(portfolioPosition.averagePositionPrice);
  const expectedYield = quotationToNumber(portfolioPosition.expectedYield);

  return {
    figi: portfolioPosition.figi,
    ticker: portfolioPosition.ticker,
    name: portfolioPosition.name,
    quantity,
    currentPrice,
    currentValue: currentPrice * quantity,
    averagePositionPrice: averagePrice,
    expectedYield,
    currency: portfolioPosition.currentPrice.currency,
    sector: undefined, // To be enriched by analytics
  };
}

// ============================================================================
// Snapshot Creation
// ============================================================================

/**
 * Create snapshot from current portfolio positions
 */
export function createSnapshot(
  positions: Position[],
  cashBalance: number = 0
): ScenarioSnapshot {
  const totalValue = positions.reduce((sum, p) => sum + p.currentValue, 0) + cashBalance;

  // Guard against division by zero
  const sectorWeights: Record<string, number> = {};
  const geoWeights: Record<string, number> = {};

  if (totalValue === 0) {
    // Return empty weights for zero-value portfolio
    return {
      totalValue,
      positions: structuredClone(positions),
      sectorWeights,
      geoWeights,
      cashBalance,
      timestamp: new Date(),
    };
  }

  // Calculate sector weights
  positions.forEach((p) => {
    const sector = p.sector || 'Unknown';
    sectorWeights[sector] = (sectorWeights[sector] || 0) + p.currentValue / totalValue;
  });

  // Calculate geography weights (simplified - use currency as proxy)
  positions.forEach((p) => {
    const country = mapCurrencyToCountry(p.currency);
    geoWeights[country] = (geoWeights[country] || 0) + p.currentValue / totalValue;
  });

  return {
    totalValue,
    positions: structuredClone(positions),
    sectorWeights,
    geoWeights,
    cashBalance,
    timestamp: new Date(),
  };
}

/**
 * Map currency to country (simplified)
 */
function mapCurrencyToCountry(currency: string): string {
  const map: Record<string, string> = {
    RUB: 'Russia',
    USD: 'USA',
    EUR: 'Europe',
    CNY: 'China',
    GBP: 'UK',
  };
  return map[currency] || 'Other';
}

// ============================================================================
// Scenario Application
// ============================================================================

/**
 * Apply scenario changes to portfolio and calculate result
 */
export function applyScenario(
  basePositions: Position[],
  changes: ScenarioChange[],
  cashBalance: number = 0
): ScenarioResult {
  const baseSnapshot = createSnapshot(basePositions, cashBalance);
  const scenarioPositions = structuredClone(basePositions);

  // Apply each change sequentially
  changes.forEach((change) => {
    applyChange(scenarioPositions, change);
  });

  const scenarioSnapshot = createSnapshot(scenarioPositions, cashBalance);

  // Calculate deltas
  const valueChange = scenarioSnapshot.totalValue - baseSnapshot.totalValue;
  // Guard against division by zero
  const valueChangePercent = baseSnapshot.totalValue > 0
    ? (valueChange / baseSnapshot.totalValue) * 100
    : 0;

  const sectorWeightChanges = calculateWeightDeltas(
    baseSnapshot.sectorWeights,
    scenarioSnapshot.sectorWeights
  );

  const geoWeightChanges = calculateWeightDeltas(
    baseSnapshot.geoWeights,
    scenarioSnapshot.geoWeights
  );

  const diversificationChange = {
    herfindahlBefore: calculateHerfindahl(baseSnapshot.positions, baseSnapshot.totalValue),
    herfindahlAfter: calculateHerfindahl(scenarioSnapshot.positions, scenarioSnapshot.totalValue),
    delta: 0,
  };
  diversificationChange.delta =
    diversificationChange.herfindahlAfter - diversificationChange.herfindahlBefore;

  return {
    scenarioId: generateScenarioId(),
    label: generateLabel(changes),
    baseSnapshot,
    scenarioSnapshot,
    valueChange,
    valueChangePercent,
    diversificationChange,
    sectorWeightChanges,
    geoWeightChanges,
    appliedChanges: changes,
    createdAt: new Date(),
  };
}

/**
 * Apply individual change to positions array (mutates)
 */
function applyChange(positions: Position[], change: ScenarioChange): void {
  switch (change.type) {
    case 'price_change':
      applyPriceChange(positions, change);
      break;
    case 'quantity_change':
      applyQuantityChange(positions, change);
      break;
    case 'add_position':
      applyAddPosition(positions, change);
      break;
    case 'remove_position':
      applyRemovePosition(positions, change);
      break;
    case 'market_event':
      applyMarketEvent(positions, change);
      break;
  }
}

function applyPriceChange(positions: Position[], change: ScenarioChange): void {
  const position = positions.find((p) => p.figi === change.figi || p.ticker === change.ticker);
  if (!position || !change.priceChangePercent) return;

  const multiplier = 1 + change.priceChangePercent / 100;
  position.currentPrice *= multiplier;
  position.currentValue = position.currentPrice * position.quantity;
}

function applyQuantityChange(positions: Position[], change: ScenarioChange): void {
  const position = positions.find((p) => p.figi === change.figi || p.ticker === change.ticker);
  if (!position || change.newQuantity === undefined) return;

  position.quantity = change.newQuantity;
  position.currentValue = position.currentPrice * position.quantity;
}

function applyAddPosition(positions: Position[], change: ScenarioChange): void {
  if (!change.addPosition) return;

  const newPosition: Position = {
    figi: change.addPosition.figi,
    ticker: change.addPosition.ticker,
    name: change.addPosition.name,
    quantity: change.addPosition.quantity,
    currentPrice: change.addPosition.price,
    currentValue: change.addPosition.price * change.addPosition.quantity,
    currency: change.addPosition.currency,
    averagePositionPrice: change.addPosition.price,
    expectedYield: 0,
    sector: 'Unknown',
  };

  positions.push(newPosition);
}

function applyRemovePosition(positions: Position[], change: ScenarioChange): void {
  const index = positions.findIndex((p) => p.figi === change.figi || p.ticker === change.ticker);
  if (index !== -1) {
    positions.splice(index, 1);
  }
}

function applyMarketEvent(positions: Position[], change: ScenarioChange): void {
  if (!change.marketMultipliers) return;

  positions.forEach((position) => {
    const multiplier = change.marketMultipliers![position.figi];
    if (multiplier !== undefined) {
      position.currentPrice *= multiplier;
      position.currentValue = position.currentPrice * position.quantity;
    }
  });
}

// ============================================================================
// Scenario Comparison
// ============================================================================

/**
 * Compare multiple scenario results
 */
export function compareScenarios(results: ScenarioResult[]): ScenarioComparison {
  if (results.length === 0) {
    throw new Error('No scenarios to compare');
  }

  const values = results.map((r) => r.scenarioSnapshot.totalValue);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  const bestCase = results.reduce((best, current) =>
    current.scenarioSnapshot.totalValue > best.scenarioSnapshot.totalValue ? current : best
  );

  const worstCase = results.reduce((worst, current) =>
    current.scenarioSnapshot.totalValue < worst.scenarioSnapshot.totalValue ? current : worst
  );

  return {
    scenarios: results,
    bestCase: {
      scenarioId: bestCase.scenarioId,
      value: bestCase.scenarioSnapshot.totalValue,
    },
    worstCase: {
      scenarioId: worstCase.scenarioId,
      value: worstCase.scenarioSnapshot.totalValue,
    },
    valueRange: {
      min: minValue,
      max: maxValue,
      spread: maxValue - minValue,
    },
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function calculateWeightDeltas(
  before: Record<string, number>,
  after: Record<string, number>
): Record<string, number> {
  const deltas: Record<string, number> = {};
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  allKeys.forEach((key) => {
    const beforeWeight = before[key] || 0;
    const afterWeight = after[key] || 0;
    deltas[key] = afterWeight - beforeWeight;
  });

  return deltas;
}

function calculateHerfindahl(positions: Position[], totalValue: number): number {
  if (totalValue === 0) return 0;

  const weights = positions.map((p) => p.currentValue / totalValue);
  return weights.reduce((sum, w) => sum + w * w, 0);
}

function generateScenarioId(): string {
  return `scenario-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function generateLabel(changes: ScenarioChange[]): string {
  if (changes.length === 0) return 'Empty Scenario';
  if (changes.length === 1) return changes[0].label;
  return `${changes.length} Changes`;
}

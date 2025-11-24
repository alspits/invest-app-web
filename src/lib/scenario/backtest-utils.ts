/**
 * Backtest Utilities
 * Historical scenario presets and replay logic
 */

import type { Position, HistoricalScenario, ScenarioChange, ScenarioResult } from './types';
import { applyScenario } from './whatif-engine';

// ============================================================================
// Historical Scenario Presets
// ============================================================================

/**
 * Load preset historical market events
 */
export function loadPresets(): HistoricalScenario[] {
  return [
    {
      id: 'covid-crash-2020',
      name: 'COVID-19 Crash (Feb-Mar 2020)',
      description: 'Sharp market decline at pandemic onset',
      startDate: new Date('2020-02-19'),
      endDate: new Date('2020-03-23'),
      marketMultipliers: {
        // Major indices
        'SPX': 0.66, // S&P 500 -34%
        'MOEX': 0.75, // MOEX -25%
        // Tech stocks
        'AAPL': 0.70, // Apple -30%
        'MSFT': 0.72, // Microsoft -28%
        'GOOGL': 0.68, // Google -32%
        // Russian stocks
        'SBER': 0.60, // Sberbank -40%
        'GAZP': 0.55, // Gazprom -45%
        'LKOH': 0.58, // Lukoil -42%
      },
      spx500Change: -34,
      moexChange: -25,
      tags: ['crash', 'pandemic', 'bear-market'],
    },
    {
      id: 'recovery-2020',
      name: '2020 Recovery (Mar-Aug 2020)',
      description: 'V-shaped recovery from COVID crash',
      startDate: new Date('2020-03-23'),
      endDate: new Date('2020-08-18'),
      marketMultipliers: {
        'SPX': 1.52, // S&P 500 +52%
        'MOEX': 1.35, // MOEX +35%
        'AAPL': 1.95, // Apple +95%
        'MSFT': 1.68, // Microsoft +68%
        'GOOGL': 1.45, // Google +45%
        'SBER': 1.48, // Sberbank +48%
        'GAZP': 1.22, // Gazprom +22%
        'LKOH': 1.30, // Lukoil +30%
      },
      spx500Change: 52,
      moexChange: 35,
      tags: ['recovery', 'bull-market', 'tech-boom'],
    },
    {
      id: 'tech-correction-2022',
      name: 'Tech Correction (Jan-Oct 2022)',
      description: 'Fed rate hikes & tech selloff',
      startDate: new Date('2022-01-03'),
      endDate: new Date('2022-10-12'),
      marketMultipliers: {
        'SPX': 0.75, // S&P 500 -25%
        'MOEX': 0.55, // MOEX -45% (war impact)
        'AAPL': 0.73, // Apple -27%
        'MSFT': 0.70, // Microsoft -30%
        'GOOGL': 0.62, // Google -38%
        'SBER': 0.20, // Sberbank -80% (sanctions)
        'GAZP': 0.35, // Gazprom -65%
        'LKOH': 0.40, // Lukoil -60%
      },
      spx500Change: -25,
      moexChange: -45,
      tags: ['correction', 'bear-market', 'rate-hikes'],
    },
    {
      id: 'ai-rally-2023',
      name: 'AI Rally (Jan-Nov 2023)',
      description: 'AI hype drives tech stocks',
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-11-30'),
      marketMultipliers: {
        'SPX': 1.24, // S&P 500 +24%
        'MOEX': 1.42, // MOEX +42%
        'AAPL': 1.48, // Apple +48%
        'MSFT': 1.57, // Microsoft +57%
        'GOOGL': 1.52, // Google +52%
        'NVDA': 2.39, // Nvidia +139%
        'SBER': 1.85, // Sberbank +85%
        'GAZP': 1.60, // Gazprom +60%
        'LKOH': 1.55, // Lukoil +55%
      },
      spx500Change: 24,
      moexChange: 42,
      tags: ['rally', 'bull-market', 'ai-boom'],
    },
  ];
}

// ============================================================================
// Historical Replay
// ============================================================================

/**
 * Replay historical scenario on current portfolio
 */
export function replayHistoricalScenario(
  basePositions: Position[],
  event: HistoricalScenario,
  cashBalance: number = 0
): ScenarioResult {
  // Convert historical multipliers to scenario changes
  const changes: ScenarioChange[] = [
    {
      id: `market-event-${event.id}`,
      type: 'market_event',
      label: event.name,
      marketMultipliers: event.marketMultipliers,
    },
  ];

  const result = applyScenario(basePositions, changes, cashBalance);

  // Override label with historical event info
  result.label = `${event.name} (${formatDateRange(event.startDate, event.endDate)})`;

  return result;
}

/**
 * Simulate custom market event
 */
export function simulateMarketMove(
  basePositions: Position[],
  label: string,
  priceChanges: Record<string, number>, // ticker/figi -> % change
  cashBalance: number = 0
): ScenarioResult {
  const changes: ScenarioChange[] = Object.entries(priceChanges).map(([tickerOrFigi, percent]) => ({
    id: `price-${tickerOrFigi}-${Date.now()}`,
    type: 'price_change' as const,
    label: `${tickerOrFigi} ${percent > 0 ? '+' : ''}${percent}%`,
    ticker: tickerOrFigi,
    priceChangePercent: percent,
  }));

  const result = applyScenario(basePositions, changes, cashBalance);
  result.label = label;

  return result;
}

/**
 * Simulate sector-wide move
 */
export function simulateSectorMove(
  basePositions: Position[],
  sector: string,
  percentChange: number,
  cashBalance: number = 0
): ScenarioResult {
  const affectedPositions = basePositions.filter((p) => p.sector === sector);

  const changes: ScenarioChange[] = affectedPositions.map((p) => ({
    id: `sector-${sector}-${p.ticker}-${Date.now()}`,
    type: 'price_change' as const,
    label: `${p.ticker} ${percentChange > 0 ? '+' : ''}${percentChange}%`,
    ticker: p.ticker,
    priceChangePercent: percentChange,
  }));

  const result = applyScenario(basePositions, changes, cashBalance);
  result.label = `${sector} ${percentChange > 0 ? '+' : ''}${percentChange}%`;

  return result;
}

/**
 * Find preset by ID
 */
export function getPresetById(presetId: string): HistoricalScenario | undefined {
  return loadPresets().find((p) => p.id === presetId);
}

/**
 * Get presets filtered by tags
 */
export function getPresetsByTags(tags: string[]): HistoricalScenario[] {
  const presets = loadPresets();
  return presets.filter((preset) => tags.some((tag) => preset.tags.includes(tag)));
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatDateRange(start: Date, end: Date): string {
  const formatOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short' };
  const startStr = start.toLocaleDateString('en-US', formatOptions);
  const endStr = end.toLocaleDateString('en-US', formatOptions);
  return `${startStr} - ${endStr}`;
}

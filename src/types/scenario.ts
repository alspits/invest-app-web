/**
 * What-If Scenario Types
 *
 * Defines data structures for portfolio scenario modeling.
 */

import { PortfolioPosition } from '@/lib/tinkoff-api';

/**
 * Position adjustment in a scenario
 */
export interface PositionAdjustment {
  figi: string;                    // Instrument identifier
  ticker: string;                  // Ticker symbol
  name: string;                    // Instrument name
  instrumentType: string;          // Type (share, bond, etf, etc.)
  quantityChange: number;          // Change in quantity (+/-)
  pricePerUnit: number;            // Current price per unit
  currency: string;                // Currency (e.g., 'RUB')
}

/**
 * New position to add in a scenario
 */
export interface NewPosition {
  figi: string;                    // Instrument identifier
  ticker: string;                  // Ticker symbol
  name: string;                    // Instrument name
  instrumentType: string;          // Type (share, bond, etf, etc.)
  quantity: number;                // Quantity to add
  pricePerUnit: number;            // Current price per unit
  currency: string;                // Currency (e.g., 'RUB')
}

/**
 * Hypothetical portfolio metrics
 */
export interface ScenarioMetrics {
  totalValue: number;              // Total portfolio value
  diversificationScore: number;    // 0-1 (Herfindahl-Hirschman Index based)
  hhi: number;                     // Herfindahl-Hirschman Index (0-10000)
  sectorAllocation: {              // Allocation by instrument type
    [key: string]: {
      value: number;
      percentage: number;
      count: number;
    };
  };
  topPositions: {                  // Top 5 positions by value
    ticker: string;
    name: string;
    value: number;
    percentage: number;
  }[];
  positionCount: number;           // Total number of positions
  cashImpact: number;              // Cash required (+) or freed (-)
}

/**
 * Comparison between current and scenario portfolios
 */
export interface ScenarioComparison {
  current: ScenarioMetrics;
  scenario: ScenarioMetrics;
  diff: {
    totalValue: number;            // Absolute change
    totalValuePercent: number;     // Percentage change
    diversificationScore: number;  // Absolute change
    hhi: number;                   // Absolute change
    positionCount: number;         // Absolute change
    cashImpact: number;            // Cash required
  };
}

/**
 * Complete scenario definition
 */
export interface Scenario {
  id: string;                      // Unique scenario ID
  portfolioId: string;             // Associated portfolio/account
  name: string;                    // Scenario name
  description?: string;            // Optional description
  adjustments: PositionAdjustment[];  // Position changes
  newPositions: NewPosition[];     // New positions to add
  createdAt: string;               // ISO date string
  updatedAt: string;               // ISO date string
}

/**
 * Hypothetical portfolio position (after scenario applied)
 */
export interface HypotheticalPosition {
  figi: string;
  ticker: string;
  name: string;
  instrumentType: string;
  quantity: number;
  currentPrice: number;
  totalValue: number;
  currency: string;
  isNew?: boolean;                 // Flag for new positions
  isModified?: boolean;            // Flag for modified positions
  originalQuantity?: number;       // Original quantity before changes
}

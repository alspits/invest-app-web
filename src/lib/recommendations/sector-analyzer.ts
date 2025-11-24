/**
 * Sector Analyzer
 *
 * Analyzes portfolio sector weights and detects overloaded sectors
 */

import type { EnrichedPosition } from '@/types/analytics';
import type { SectorWeights, OverloadedSector } from './types';

// Threshold for overloaded sector detection (50% = 0.5)
const OVERLOAD_THRESHOLD = 0.5;

// Target allocation strategy: uniform distribution or risk-based
const TARGET_ALLOCATION_STRATEGY = 'uniform'; // 'uniform' | 'risk-based'

/**
 * Calculate sector weights from enriched positions
 *
 * @param positions - Array of enriched positions with sector classification
 * @returns Map of sector names to weights
 */
export function calculateSectorWeights(
  positions: EnrichedPosition[]
): SectorWeights {
  if (positions.length === 0) {
    return {};
  }

  // Calculate total portfolio value
  const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0);

  if (totalValue === 0) {
    return {};
  }

  // Group positions by sector and calculate weights
  const sectorMap: SectorWeights = {};

  positions.forEach((position) => {
    const sector = position.sector;

    if (!sectorMap[sector]) {
      sectorMap[sector] = {
        sector,
        weight: 0,
        value: 0,
        positions: [],
      };
    }

    sectorMap[sector].value += position.value;
    sectorMap[sector].positions.push(position.ticker);
  });

  // Calculate weight percentages
  Object.values(sectorMap).forEach((sectorData) => {
    sectorData.weight = sectorData.value / totalValue;
  });

  return sectorMap;
}

/**
 * Detect overloaded sectors (>50% portfolio weight)
 *
 * @param weights - Sector weights map
 * @param totalValue - Total portfolio value
 * @returns Array of overloaded sectors with recommendations
 */
export function detectOverloadedSectors(
  weights: SectorWeights,
  totalValue: number
): OverloadedSector[] {
  const overloadedSectors: OverloadedSector[] = [];

  Object.values(weights).forEach((sectorData) => {
    if (sectorData.weight > OVERLOAD_THRESHOLD) {
      const targetWeight = calculateTargetWeight(weights, sectorData.sector);
      const adjustmentAmount = (sectorData.weight - targetWeight) * totalValue;

      overloadedSectors.push({
        sector: sectorData.sector,
        currentWeight: sectorData.weight,
        targetWeight,
        recommendation: generateRecommendation(
          sectorData.sector,
          sectorData.weight,
          targetWeight,
          adjustmentAmount
        ),
        adjustmentAmount,
      });
    }
  });

  return overloadedSectors;
}

/**
 * Calculate target weight for a sector
 *
 * @param weights - All sector weights
 * @param sector - Target sector
 * @returns Target weight (0-1)
 */
function calculateTargetWeight(
  weights: SectorWeights,
  sector: string
): number {
  const sectorCount = Object.keys(weights).length;

  if (sectorCount === 0) {
    return 0;
  }

  if (TARGET_ALLOCATION_STRATEGY === 'uniform') {
    // Uniform distribution: divide equally among sectors
    return 1 / sectorCount;
  }

  // Risk-based allocation (can be extended later)
  // For now, use uniform as fallback
  return 1 / sectorCount;
}

/**
 * Generate human-readable recommendation
 *
 * @param sector - Sector name
 * @param currentWeight - Current weight (0-1)
 * @param targetWeight - Target weight (0-1)
 * @param adjustmentAmount - Amount to reduce in currency
 * @returns Recommendation string
 */
function generateRecommendation(
  sector: string,
  currentWeight: number,
  targetWeight: number,
  adjustmentAmount: number
): string {
  const currentPercent = Math.round(currentWeight * 100);
  const targetPercent = Math.round(targetWeight * 100);
  const reductionPercent = currentPercent - targetPercent;
  const formattedAmount = formatCurrency(adjustmentAmount);

  return `Reduce ${sector} from ${currentPercent}% to ${targetPercent}% (sell ~${formattedAmount})`;
}

/**
 * Format currency value
 *
 * @param value - Numeric value
 * @returns Formatted string (e.g., "$50K", "₽1.2M")
 */
function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `₽${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `₽${(value / 1_000).toFixed(0)}K`;
  }
  return `₽${value.toFixed(0)}`;
}

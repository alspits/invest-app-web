/**
 * Diversification Service
 *
 * Main orchestrator for portfolio diversification analysis
 */

import type { EnrichedPosition } from '@/types/analytics';
import type { DiversificationAnalysis } from './types';
import { calculateSectorWeights, detectOverloadedSectors } from './sector-analyzer';
import { classifyError } from '@/lib/http';

/**
 * Analyze portfolio diversification
 *
 * Detects overloaded sectors (>50% weight) and generates recommendations
 *
 * @param positions - Array of enriched positions with sector classification
 * @returns Diversification analysis with overloaded sectors and recommendations
 */
export function analyzeDiversification(
  positions: EnrichedPosition[]
): DiversificationAnalysis {
  try {
    // Validate input
    if (!positions || positions.length === 0) {
      return createEmptyAnalysis();
    }

    // Calculate total portfolio value
    const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0);

    if (totalValue === 0) {
      return createEmptyAnalysis();
    }

    // Calculate sector weights
    const sectorWeights = calculateSectorWeights(positions);

    // Detect overloaded sectors
    const overloadedSectors = detectOverloadedSectors(sectorWeights, totalValue);

    // Calculate diversification score
    const diversificationScore = calculateDiversificationScore(sectorWeights);

    // Calculate confidence based on data quality
    const confidence = calculateConfidence(positions, sectorWeights);

    return {
      id: generateAnalysisId(),
      overloadedSectors,
      sectorWeights,
      confidence,
      timestamp: new Date(),
      totalValue,
      diversificationScore,
    };
  } catch (error) {
    // Handle errors gracefully
    const classifiedError = classifyError(error);
    console.error('Diversification Analysis Error:', classifiedError.message);
    return createEmptyAnalysis();
  }
}

/**
 * Calculate diversification score (0-100)
 *
 * Higher score = more diversified portfolio
 *
 * @param sectorWeights - Sector weights map
 * @returns Score from 0-100
 */
function calculateDiversificationScore(
  sectorWeights: Record<string, any>
): number {
  const sectors = Object.values(sectorWeights);

  if (sectors.length === 0) {
    return 0;
  }

  // Calculate Herfindahl-Hirschman Index (HHI)
  const hhi = sectors.reduce((sum, sector) => {
    return sum + sector.weight * sector.weight;
  }, 0);

  // Normalize HHI to 0-100 score
  // HHI ranges from 1/n (perfectly diversified) to 1 (single sector)
  // Lower HHI = better diversification
  const maxHHI = 1.0;
  const minHHI = 1 / sectors.length;
  const normalizedHHI = (hhi - minHHI) / (maxHHI - minHHI);

  // Invert so higher score = better diversification
  const score = (1 - normalizedHHI) * 100;

  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Calculate confidence level (0-100)
 *
 * Based on data quality and number of positions
 *
 * @param positions - Portfolio positions
 * @param sectorWeights - Sector weights map
 * @returns Confidence score from 0-100
 */
function calculateConfidence(
  positions: EnrichedPosition[],
  sectorWeights: Record<string, any>
): number {
  let confidence = 100;

  // Reduce confidence if too few positions
  if (positions.length < 5) {
    confidence -= 20;
  } else if (positions.length < 10) {
    confidence -= 10;
  }

  // Reduce confidence if too few sectors
  const sectorCount = Object.keys(sectorWeights).length;
  if (sectorCount < 3) {
    confidence -= 20;
  } else if (sectorCount < 5) {
    confidence -= 10;
  }

  // Reduce confidence if many positions are classified as "other"
  const otherSector = sectorWeights['other'];
  if (otherSector && otherSector.weight > 0.2) {
    confidence -= 15;
  }

  return Math.max(0, Math.min(100, confidence));
}

/**
 * Create empty analysis result
 *
 * @returns Empty diversification analysis
 */
function createEmptyAnalysis(): DiversificationAnalysis {
  return {
    id: generateAnalysisId(),
    overloadedSectors: [],
    sectorWeights: {},
    confidence: 0,
    timestamp: new Date(),
    totalValue: 0,
    diversificationScore: 0,
  };
}

/**
 * Generate unique analysis ID
 *
 * @returns Unique ID string
 */
function generateAnalysisId(): string {
  return `div-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

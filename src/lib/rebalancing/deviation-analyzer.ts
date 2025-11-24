/**
 * Deviation Analyzer Module
 * Calculates deviations between current and target portfolio allocation
 */

import type { Portfolio } from '@/types/portfolio';
import type {
  TargetAllocation,
  DeviationAnalysis,
  CategoryDeviation,
} from './types';
import {
  classifySector,
  classifyGeography,
} from '@/lib/analytics/portfolio/classifiers';

// ========== Current Allocation Calculator ==========

interface CurrentAllocation {
  sectors: Record<string, number>;
  geography: Record<string, number>;
  assetTypes: Record<string, number>;
  totalValue: number;
}

export function calculateCurrentAllocation(
  portfolio: Portfolio
): CurrentAllocation {
  const totalValue = portfolio.positions.reduce(
    (sum, pos) => sum + pos.currentValue,
    0
  );

  const sectors: Record<string, number> = {};
  const geography: Record<string, number> = {};
  const assetTypes: Record<string, number> = {};

  // Guard against zero totalValue
  if (totalValue === 0 || isNaN(totalValue)) {
    return { sectors, geography, assetTypes, totalValue: 0 };
  }

  portfolio.positions.forEach((position) => {
    const weight = position.currentValue / totalValue;

    // Sector classification
    const sector = classifySector(position.ticker);
    sectors[sector] = (sectors[sector] || 0) + weight;

    // Geography classification
    const geo = classifyGeography(position.ticker);
    geography[geo] = (geography[geo] || 0) + weight;

    // Asset type classification
    const assetType = classifyAssetType(position.instrumentType);
    assetTypes[assetType] = (assetTypes[assetType] || 0) + weight;
  });

  return { sectors, geography, assetTypes, totalValue };
}

function classifyAssetType(instrumentType: string): string {
  const type = instrumentType.toLowerCase();
  if (type.includes('stock') || type.includes('share')) return 'stocks';
  if (type.includes('bond')) return 'bonds';
  if (type.includes('etf')) return 'etf';
  return 'alternatives';
}

// ========== Deviation Calculation ==========

export function calculateDeviations(
  portfolio: Portfolio,
  targets: TargetAllocation
): DeviationAnalysis {
  const current = calculateCurrentAllocation(portfolio);
  const deviations: CategoryDeviation[] = [];

  // Collect all unique categories from both targets and current allocation
  const allSectors = new Set([
    ...Object.keys(targets.sectors),
    ...Object.keys(current.sectors),
  ]);
  const allGeographies = new Set([
    ...Object.keys(targets.geography),
    ...Object.keys(current.geography),
  ]);
  const allAssetTypes = new Set([
    ...Object.keys(targets.assetTypes),
    ...Object.keys(current.assetTypes),
  ]);

  // Sector deviations (iterate union of categories)
  allSectors.forEach((category) => {
    const currentWeight = current.sectors[category] || 0;
    const targetWeight = targets.sectors[category] || 0;
    deviations.push(
      createCategoryDeviation(
        category,
        'sector',
        currentWeight,
        targetWeight,
        current.totalValue
      )
    );
  });

  // Geography deviations (iterate union of categories)
  allGeographies.forEach((category) => {
    const currentWeight = current.geography[category] || 0;
    const targetWeight = targets.geography[category] || 0;
    deviations.push(
      createCategoryDeviation(
        category,
        'geography',
        currentWeight,
        targetWeight,
        current.totalValue
      )
    );
  });

  // Asset type deviations (iterate union of categories)
  allAssetTypes.forEach((category) => {
    const currentWeight = current.assetTypes[category] || 0;
    const targetWeight = targets.assetTypes[category] || 0;
    deviations.push(
      createCategoryDeviation(
        category,
        'assetType',
        currentWeight,
        targetWeight,
        current.totalValue
      )
    );
  });

  // Calculate total deviation score (sum of squared deviations)
  const totalDeviationScore = deviations.reduce(
    (sum, d) => sum + Math.pow(d.deviationPercent, 2),
    0
  );

  const highPriorityCount = deviations.filter((d) => d.priority === 1).length;
  const needsRebalancing = highPriorityCount > 0 || totalDeviationScore > 0.05;

  return {
    totalDeviationScore,
    categoryDeviations: deviations,
    highPriorityCount,
    needsRebalancing,
    estimatedImpact: estimateRebalancingImpact(deviations),
  };
}

function createCategoryDeviation(
  category: string,
  dimension: 'sector' | 'geography' | 'assetType',
  currentWeight: number,
  targetWeight: number,
  totalValue: number
): CategoryDeviation {
  const deviationPercent = currentWeight - targetWeight;
  const deviationAmount = deviationPercent * totalValue;

  // Priority: 1 = high (>5%), 2 = medium (2-5%), 3 = low (<2%)
  const absDeviation = Math.abs(deviationPercent);
  const priority = absDeviation > 0.05 ? 1 : absDeviation > 0.02 ? 2 : 3;

  // Recommendation
  const recommendation =
    deviationPercent > 0.02 ? 'SELL' : deviationPercent < -0.02 ? 'BUY' : 'HOLD';

  return {
    category,
    dimension,
    currentWeight,
    targetWeight,
    deviationPercent,
    deviationAmount,
    priority,
    recommendation,
  };
}

function estimateRebalancingImpact(
  deviations: CategoryDeviation[]
): { riskReduction: number; diversificationImprovement: number } {
  // Guard against empty deviations array
  if (!deviations || deviations.length === 0) {
    return { riskReduction: 0, diversificationImprovement: 0 };
  }

  // Simplified impact estimation
  const avgAbsDeviation =
    deviations.reduce((sum, d) => sum + Math.abs(d.deviationPercent), 0) /
    deviations.length;

  const riskReduction = Math.min(avgAbsDeviation * 100, 20); // Max 20% risk reduction
  const diversificationImprovement = Math.min(avgAbsDeviation * 50, 15); // Max 15 points

  return {
    riskReduction: Math.round(riskReduction * 10) / 10,
    diversificationImprovement: Math.round(diversificationImprovement * 10) / 10,
  };
}

// ========== Prioritization ==========

export function prioritizeRebalancing(
  deviations: CategoryDeviation[]
): CategoryDeviation[] {
  return [...deviations].sort((a, b) => {
    // Sort by priority first
    if (a.priority !== b.priority) return a.priority - b.priority;

    // Then by absolute deviation
    return Math.abs(b.deviationPercent) - Math.abs(a.deviationPercent);
  });
}

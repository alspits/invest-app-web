/**
 * Risk Profile Definitions & Configurations
 * Defines user risk tolerance levels and corresponding thresholds
 */

export enum RiskProfile {
  CONSERVATIVE = 'CONSERVATIVE',
  MODERATE = 'MODERATE',
  AGGRESSIVE = 'AGGRESSIVE',
}

export interface RiskConfig {
  profile: RiskProfile;
  maxVolatility: number; // Max acceptable portfolio volatility (0-1 scale)
  targetAllocation: {
    bonds: number; // Target % for bonds
    stocks: number; // Target % for stocks
    alternatives: number; // Target % for alternatives (ETFs, commodities)
  };
  rebalancingFrequency: 'monthly' | 'quarterly' | 'yearly';
  description: string;
}

const RISK_CONFIGS: Record<RiskProfile, RiskConfig> = {
  [RiskProfile.CONSERVATIVE]: {
    profile: RiskProfile.CONSERVATIVE,
    maxVolatility: 0.15, // 15% max volatility
    targetAllocation: {
      bonds: 60,
      stocks: 30,
      alternatives: 10,
    },
    rebalancingFrequency: 'monthly',
    description: 'Низкий риск, стабильный доход, защита капитала',
  },
  [RiskProfile.MODERATE]: {
    profile: RiskProfile.MODERATE,
    maxVolatility: 0.25, // 25% max volatility
    targetAllocation: {
      bonds: 30,
      stocks: 50,
      alternatives: 20,
    },
    rebalancingFrequency: 'quarterly',
    description: 'Сбалансированный риск, рост с умеренной защитой',
  },
  [RiskProfile.AGGRESSIVE]: {
    profile: RiskProfile.AGGRESSIVE,
    maxVolatility: 0.40, // 40% max volatility
    targetAllocation: {
      bonds: 10,
      stocks: 70,
      alternatives: 20,
    },
    rebalancingFrequency: 'yearly',
    description: 'Высокий риск, максимальный рост, долгосрочная перспектива',
  },
};

/**
 * Get risk configuration for a specific profile
 */
export function getRiskProfileConfig(profile: RiskProfile): RiskConfig {
  return RISK_CONFIGS[profile];
}

/**
 * Get all available risk profiles with their configs
 */
export function getAllRiskProfiles(): RiskConfig[] {
  return Object.values(RISK_CONFIGS);
}

/**
 * Visual indicators for UI rendering
 */
export const RISK_PROFILE_UI = {
  [RiskProfile.CONSERVATIVE]: {
    icon: '🛡️',
    color: 'blue',
    colorClass: 'text-blue-600 bg-blue-50',
  },
  [RiskProfile.MODERATE]: {
    icon: '⚖️',
    color: 'yellow',
    colorClass: 'text-yellow-600 bg-yellow-50',
  },
  [RiskProfile.AGGRESSIVE]: {
    icon: '🚀',
    color: 'red',
    colorClass: 'text-red-600 bg-red-50',
  },
} as const;

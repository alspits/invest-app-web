/**
 * Ticker Recommendation Engine
 * Generates personalized ticker suggestions based on risk profile
 */

import { RiskProfile, getRiskProfileConfig } from './risk-profiles';
import { PortfolioHolding } from './risk-analyzer';

export interface TickerRecommendation {
  ticker: string;
  name: string;
  category: 'stock' | 'bond' | 'etf' | 'alternative';
  rationale: string;
  suggestedAmount: number; // In RUB
  expectedVolatility: number;
  priority: number; // 1-5 (5 = highest priority)
}

interface TickerInfo {
  ticker: string;
  name: string;
  category: TickerRecommendation['category'];
  volatility: number;
  profiles: RiskProfile[];
}

// Ticker database for Russian market
const TICKER_DATABASE: TickerInfo[] = [
  // Conservative - Bonds & Dividend Stocks
  { ticker: 'RGBI', name: 'Russia Gov Bonds ETF', category: 'bond', volatility: 0.08, profiles: [RiskProfile.CONSERVATIVE, RiskProfile.MODERATE] },
  { ticker: 'SBCB', name: 'Sber Corporate Bonds', category: 'bond', volatility: 0.10, profiles: [RiskProfile.CONSERVATIVE] },
  { ticker: 'SBER', name: 'Sberbank', category: 'stock', volatility: 0.18, profiles: [RiskProfile.CONSERVATIVE, RiskProfile.MODERATE] },
  { ticker: 'GAZP', name: 'Gazprom', category: 'stock', volatility: 0.22, profiles: [RiskProfile.CONSERVATIVE, RiskProfile.MODERATE] },
  { ticker: 'LKOH', name: 'Lukoil', category: 'stock', volatility: 0.20, profiles: [RiskProfile.MODERATE] },

  // Moderate - Balanced Mix
  { ticker: 'IMOEX', name: 'MOEX Russia Index ETF', category: 'etf', volatility: 0.25, profiles: [RiskProfile.MODERATE] },
  { ticker: 'VTBX', name: 'VTB Index ETF', category: 'etf', volatility: 0.23, profiles: [RiskProfile.MODERATE, RiskProfile.AGGRESSIVE] },
  { ticker: 'ROSN', name: 'Rosneft', category: 'stock', volatility: 0.24, profiles: [RiskProfile.MODERATE] },
  { ticker: 'NVTK', name: 'Novatek', category: 'stock', volatility: 0.26, profiles: [RiskProfile.MODERATE, RiskProfile.AGGRESSIVE] },

  // Aggressive - Growth & Tech
  { ticker: 'TMOS', name: 'MOEX Tech Index ETF', category: 'etf', volatility: 0.35, profiles: [RiskProfile.AGGRESSIVE] },
  { ticker: 'YNDX', name: 'Yandex', category: 'stock', volatility: 0.38, profiles: [RiskProfile.AGGRESSIVE] },
  { ticker: 'OZON', name: 'Ozon', category: 'stock', volatility: 0.42, profiles: [RiskProfile.AGGRESSIVE] },
  { ticker: 'VKCO', name: 'VK Company', category: 'stock', volatility: 0.36, profiles: [RiskProfile.AGGRESSIVE] },
  { ticker: 'GOLD', name: 'Polymetal Gold', category: 'alternative', volatility: 0.32, profiles: [RiskProfile.MODERATE, RiskProfile.AGGRESSIVE] },
];

/**
 * Calculate current asset allocation from holdings
 */
function calculateCurrentAllocation(holdings: PortfolioHolding[]): {
  bonds: number;
  stocks: number;
  alternatives: number;
} {
  const totalValue = holdings.reduce((sum, h) => sum + h.totalValue, 0);
  if (totalValue === 0) return { bonds: 0, stocks: 0, alternatives: 0 };

  // Simplified categorization - in real app, would map tickers to categories
  const allocation = { bonds: 0, stocks: 0, alternatives: 0 };

  holdings.forEach((holding) => {
    const weight = (holding.totalValue / totalValue) * 100;

    // Simple heuristic based on ticker patterns
    if (holding.ticker.includes('RGBI') || holding.ticker.includes('BOND')) {
      allocation.bonds += weight;
    } else if (holding.ticker.includes('GOLD') || holding.ticker.includes('COMMODITY')) {
      allocation.alternatives += weight;
    } else {
      allocation.stocks += weight;
    }
  });

  return allocation;
}

/**
 * Generate ticker recommendations based on risk profile
 */
export function suggestTickers(
  profile: RiskProfile,
  holdings: PortfolioHolding[],
  portfolioValue: number
): TickerRecommendation[] {
  const config = getRiskProfileConfig(profile);
  const currentAllocation = calculateCurrentAllocation(holdings);
  const existingTickers = new Set(holdings.map((h) => h.ticker));

  // Filter tickers matching risk profile
  const candidateTickers = TICKER_DATABASE.filter(
    (ticker) => ticker.profiles.includes(profile) && !existingTickers.has(ticker.ticker)
  );

  // Calculate allocation gaps
  const gaps = {
    bonds: config.targetAllocation.bonds - currentAllocation.bonds,
    stocks: config.targetAllocation.stocks - currentAllocation.stocks,
    alternatives: config.targetAllocation.alternatives - currentAllocation.alternatives,
  };

  // Prioritize tickers by allocation gap
  const recommendations: TickerRecommendation[] = [];

  candidateTickers.forEach((ticker) => {
    const gap = gaps[ticker.category === 'bond' ? 'bonds' : ticker.category === 'stock' ? 'stocks' : 'alternatives'];

    if (gap > 5) {
      // Only recommend if gap > 5%
      const suggestedAmount = Math.round((portfolioValue * gap) / 100);
      const priority = Math.min(5, Math.ceil(gap / 10));

      recommendations.push({
        ticker: ticker.ticker,
        name: ticker.name,
        category: ticker.category,
        rationale: generateRationale(ticker, profile, gap),
        suggestedAmount,
        expectedVolatility: ticker.volatility,
        priority,
      });
    }
  });

  // Sort by priority (descending) and return top 5
  return recommendations.sort((a, b) => b.priority - a.priority).slice(0, 5);
}

/**
 * Generate rationale text for a recommendation
 */
function generateRationale(ticker: TickerInfo, profile: RiskProfile, gap: number): string {
  const volPct = (ticker.volatility * 100).toFixed(0);

  const categoryRationales = {
    bond: `Стабильный инструмент с низкой волатильностью (${volPct}%), восполняет недостаток облигаций в портфеле`,
    stock: `Соответствует профилю ${profile.toLowerCase()}, волатильность ${volPct}%`,
    etf: `Диверсифицированный ETF с волатильностью ${volPct}%, снижает концентрацию рисков`,
    alternative: `Альтернативный актив для диверсификации, волатильность ${volPct}%`,
  };

  const baseRationale = categoryRationales[ticker.category];
  const gapText = `(недостаток ${gap.toFixed(0)}%)`;

  return `${baseRationale} ${gapText}`;
}

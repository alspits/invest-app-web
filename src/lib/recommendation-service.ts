/**
 * Investment Recommendation Engine Service
 *
 * Analyzes portfolio data and generates actionable investment recommendations
 * based on diversification, risk, concentration, and cash allocation analysis.
 */

import { PortfolioResponse, MoneyValue, Quotation } from './tinkoff-api';
import { PortfolioMetrics } from './analytics';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Priority levels for recommendations
 */
export type RecommendationPriority = 'high' | 'medium' | 'low';

/**
 * Recommendation categories
 */
export type RecommendationType =
  | 'diversification' // Improve portfolio diversification
  | 'rebalancing' // Rebalance overweight/underweight positions
  | 'cash_allocation' // Invest unused cash
  | 'concentration_risk' // Reduce concentration in single positions
  | 'sector_allocation' // Adjust sector allocation
  | 'risk_management'; // Risk-related recommendations

/**
 * Individual recommendation
 */
export interface Recommendation {
  id: string;
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  description: string;
  actionItems: string[];
  rationale: string;
  affectedPositions?: string[]; // Tickers of affected positions
  targetAllocation?: number; // Target percentage for rebalancing
  currentAllocation?: number; // Current percentage
  potentialImpact?: string; // Expected impact on portfolio
}

/**
 * Sector allocation breakdown
 */
export interface SectorAllocation {
  sector: string;
  value: number;
  percentage: number;
  positions: string[]; // Tickers in this sector
}

/**
 * Concentration risk analysis
 */
export interface ConcentrationRisk {
  topPosition: {
    ticker: string;
    name: string;
    percentage: number;
  };
  top3Concentration: number; // Percentage held in top 3 positions
  top5Concentration: number; // Percentage held in top 5 positions
  herfindahlIndex: number; // HHI score
  isHighRisk: boolean; // True if concentration is too high
}

/**
 * Cash allocation analysis
 */
export interface CashAnalysis {
  totalCash: number;
  cashPercentage: number;
  currency: string;
  isExcessive: boolean; // True if cash > 10% of portfolio
  suggestedInvestmentAmount?: number;
}

/**
 * Target allocation for rebalancing
 */
export interface TargetAllocation {
  instrumentType: string;
  currentPercentage: number;
  targetPercentage: number;
  difference: number; // Percentage points to adjust
  rebalanceAmount: number; // Amount in currency to buy/sell
}

/**
 * Complete recommendation report
 */
export interface RecommendationReport {
  recommendations: Recommendation[];
  concentrationRisk: ConcentrationRisk;
  cashAnalysis: CashAnalysis;
  sectorAllocation: SectorAllocation[];
  targetAllocations: TargetAllocation[];
  overallScore: number; // 0-100 health score
  generatedAt: Date;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert MoneyValue to number
 */
function moneyValueToNumber(money: MoneyValue): number {
  const units = parseFloat(money.units);
  const nano = money.nano / 1_000_000_000;
  return units + nano;
}

/**
 * Convert Quotation to number
 */
function quotationToNumber(quotation: Quotation): number {
  const units = parseFloat(quotation.units);
  const nano = quotation.nano / 1_000_000_000;
  return units + nano;
}

/**
 * Generate unique recommendation ID
 */
function generateRecommendationId(type: RecommendationType, index: number): string {
  return `rec_${type}_${index}_${Date.now()}`;
}

/**
 * Map instrument type to sector (simplified categorization)
 */
function mapInstrumentTypeToSector(instrumentType: string): string {
  const sectorMap: Record<string, string> = {
    share: 'Акции',
    bond: 'Облигации',
    etf: 'ETF',
    currency: 'Валюта',
    futures: 'Фьючерсы',
  };

  return sectorMap[instrumentType.toLowerCase()] || 'Прочее';
}

// ============================================================================
// Analysis Functions
// ============================================================================

/**
 * Analyze concentration risk in portfolio
 */
export function analyzeConcentrationRisk(portfolio: PortfolioResponse): ConcentrationRisk {
  const positions = portfolio.positions;

  // Calculate total portfolio value
  const totalValue = positions.reduce((sum, pos) => {
    const currentPrice = pos.currentPrice ? moneyValueToNumber(pos.currentPrice) : 0;
    const quantity = quotationToNumber(pos.quantity);
    return sum + currentPrice * quantity;
  }, 0);

  // Calculate position values and percentages
  const positionsWithPercentage = positions
    .map((pos) => {
      const currentPrice = pos.currentPrice ? moneyValueToNumber(pos.currentPrice) : 0;
      const quantity = quotationToNumber(pos.quantity);
      const value = currentPrice * quantity;
      const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;

      return {
        ticker: pos.ticker || pos.figi,
        name: pos.name || pos.figi,
        value,
        percentage,
      };
    })
    .filter((pos) => pos.value > 0)
    .sort((a, b) => b.percentage - a.percentage);

  // Get top position
  const topPosition = positionsWithPercentage[0] || {
    ticker: 'N/A',
    name: 'N/A',
    percentage: 0,
  };

  // Calculate top 3 and top 5 concentration
  const top3Concentration = positionsWithPercentage
    .slice(0, 3)
    .reduce((sum, pos) => sum + pos.percentage, 0);

  const top5Concentration = positionsWithPercentage
    .slice(0, 5)
    .reduce((sum, pos) => sum + pos.percentage, 0);

  // Calculate Herfindahl-Hirschman Index (HHI)
  const herfindahlIndex = positionsWithPercentage.reduce((sum, pos) => {
    const weight = pos.percentage / 100;
    return sum + weight * weight;
  }, 0);

  // Determine if risk is high
  // High risk if: top position > 25% OR top 3 > 60% OR HHI > 0.25
  const isHighRisk =
    topPosition.percentage > 25 || top3Concentration > 60 || herfindahlIndex > 0.25;

  return {
    topPosition,
    top3Concentration,
    top5Concentration,
    herfindahlIndex,
    isHighRisk,
  };
}

/**
 * Analyze cash allocation in portfolio
 */
export function analyzeCashAllocation(portfolio: PortfolioResponse): CashAnalysis {
  // Get total cash from currencies
  const totalCash = moneyValueToNumber(portfolio.totalAmountCurrencies);
  const currency = portfolio.totalAmountCurrencies.currency;

  // Calculate total portfolio value
  const totalValue =
    moneyValueToNumber(portfolio.totalAmountShares) +
    moneyValueToNumber(portfolio.totalAmountBonds) +
    moneyValueToNumber(portfolio.totalAmountEtf) +
    moneyValueToNumber(portfolio.totalAmountCurrencies) +
    moneyValueToNumber(portfolio.totalAmountFutures);

  // Calculate cash percentage
  const cashPercentage = totalValue > 0 ? (totalCash / totalValue) * 100 : 0;

  // Cash is excessive if > 10% of portfolio
  const isExcessive = cashPercentage > 10;

  // Suggest investing 70% of excess cash (keeping 30% as emergency buffer)
  let suggestedInvestmentAmount: number | undefined;
  if (isExcessive) {
    const excessCash = totalCash - totalValue * 0.1; // Amount above 10%
    suggestedInvestmentAmount = excessCash * 0.7;
  }

  return {
    totalCash,
    cashPercentage,
    currency,
    isExcessive,
    suggestedInvestmentAmount,
  };
}

/**
 * Calculate sector allocation breakdown
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

/**
 * Generate target allocations for rebalancing
 *
 * Target allocation strategy:
 * - Stocks: 50-70% (growth-focused)
 * - Bonds: 20-30% (stability)
 * - ETF: 10-20% (diversification)
 * - Futures: 0-5% (speculation, optional)
 */
export function generateTargetAllocations(
  portfolio: PortfolioResponse
): TargetAllocation[] {
  // Calculate current allocations
  const totalValue =
    moneyValueToNumber(portfolio.totalAmountShares) +
    moneyValueToNumber(portfolio.totalAmountBonds) +
    moneyValueToNumber(portfolio.totalAmountEtf) +
    moneyValueToNumber(portfolio.totalAmountFutures);

  if (totalValue === 0) {
    return [];
  }

  const currentAllocations = {
    shares: (moneyValueToNumber(portfolio.totalAmountShares) / totalValue) * 100,
    bonds: (moneyValueToNumber(portfolio.totalAmountBonds) / totalValue) * 100,
    etf: (moneyValueToNumber(portfolio.totalAmountEtf) / totalValue) * 100,
    futures: (moneyValueToNumber(portfolio.totalAmountFutures) / totalValue) * 100,
  };

  // Define target allocations (moderate risk profile)
  const targetAllocations = {
    shares: 60,
    bonds: 25,
    etf: 15,
    futures: 0, // Minimize speculative positions
  };

  // Calculate differences and rebalance amounts
  const targetAllocationsList: TargetAllocation[] = [
    {
      instrumentType: 'Акции',
      currentPercentage: currentAllocations.shares,
      targetPercentage: targetAllocations.shares,
      difference: targetAllocations.shares - currentAllocations.shares,
      rebalanceAmount: ((targetAllocations.shares - currentAllocations.shares) / 100) * totalValue,
    },
    {
      instrumentType: 'Облигации',
      currentPercentage: currentAllocations.bonds,
      targetPercentage: targetAllocations.bonds,
      difference: targetAllocations.bonds - currentAllocations.bonds,
      rebalanceAmount: ((targetAllocations.bonds - currentAllocations.bonds) / 100) * totalValue,
    },
    {
      instrumentType: 'ETF',
      currentPercentage: currentAllocations.etf,
      targetPercentage: targetAllocations.etf,
      difference: targetAllocations.etf - currentAllocations.etf,
      rebalanceAmount: ((targetAllocations.etf - currentAllocations.etf) / 100) * totalValue,
    },
  ];

  // Only include futures if currently held
  if (currentAllocations.futures > 0) {
    targetAllocationsList.push({
      instrumentType: 'Фьючерсы',
      currentPercentage: currentAllocations.futures,
      targetPercentage: targetAllocations.futures,
      difference: targetAllocations.futures - currentAllocations.futures,
      rebalanceAmount:
        ((targetAllocations.futures - currentAllocations.futures) / 100) * totalValue,
    });
  }

  // Filter out allocations that are close to target (within 5%)
  return targetAllocationsList.filter((allocation) => Math.abs(allocation.difference) > 5);
}

// ============================================================================
// Recommendation Generation
// ============================================================================

/**
 * Generate diversification recommendations
 */
function generateDiversificationRecommendations(
  portfolio: PortfolioResponse,
  metrics: PortfolioMetrics
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const diversificationScore = metrics.diversificationScore;

  // Low diversification (score < 0.5)
  if (diversificationScore < 0.5) {
    recommendations.push({
      id: generateRecommendationId('diversification', 0),
      type: 'diversification',
      priority: 'high',
      title: 'Низкая диверсификация портфеля',
      description: `Ваш портфель имеет низкий показатель диверсификации (${(diversificationScore * 100).toFixed(0)}%). Рекомендуется увеличить количество активов.`,
      actionItems: [
        'Добавьте 5-10 новых позиций в разных секторах',
        'Рассмотрите покупку ETF для широкой диверсификации',
        'Инвестируйте в облигации для снижения волатильности',
      ],
      rationale:
        'Низкая диверсификация увеличивает риск портфеля. Распределение инвестиций снижает влияние падения отдельных активов.',
      potentialImpact: 'Снижение риска на 20-30%, улучшение стабильности доходности',
    });
  }
  // Moderate diversification (0.5 <= score < 0.7)
  else if (diversificationScore < 0.7) {
    recommendations.push({
      id: generateRecommendationId('diversification', 1),
      type: 'diversification',
      priority: 'medium',
      title: 'Умеренная диверсификация',
      description: `Диверсификация портфеля на приемлемом уровне (${(diversificationScore * 100).toFixed(0)}%), но есть возможности для улучшения.`,
      actionItems: [
        'Добавьте 2-3 позиции в недопредставленных секторах',
        'Рассмотрите международные ETF для географической диверсификации',
      ],
      rationale: 'Улучшение диверсификации может дополнительно снизить риски портфеля.',
      potentialImpact: 'Снижение риска на 10-15%',
    });
  }

  return recommendations;
}

/**
 * Generate rebalancing recommendations
 */
function generateRebalancingRecommendations(
  portfolio: PortfolioResponse,
  targetAllocations: TargetAllocation[]
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  if (targetAllocations.length === 0) {
    return recommendations;
  }

  // Generate recommendation for significant imbalances (> 10%)
  const significantImbalances = targetAllocations.filter(
    (allocation) => Math.abs(allocation.difference) > 10
  );

  if (significantImbalances.length > 0) {
    const actionItems = significantImbalances.map((allocation) => {
      const action = allocation.difference > 0 ? 'Увеличьте' : 'Уменьшите';
      const amount = Math.abs(allocation.rebalanceAmount).toLocaleString('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
      return `${action} долю "${allocation.instrumentType}" на ${Math.abs(allocation.difference).toFixed(1)}% (≈${amount})`;
    });

    recommendations.push({
      id: generateRecommendationId('rebalancing', 0),
      type: 'rebalancing',
      priority: 'high',
      title: 'Требуется ребалансировка портфеля',
      description:
        'Текущее распределение активов значительно отклоняется от рекомендуемого. Ребалансировка поможет оптимизировать соотношение риск/доходность.',
      actionItems,
      rationale:
        'Поддержание целевого распределения активов помогает контролировать риск и обеспечивает соответствие инвестиционной стратегии.',
      targetAllocation: 60, // Target for stocks (example)
      currentAllocation: targetAllocations[0]?.currentPercentage,
      potentialImpact: 'Оптимизация риска и доходности портфеля',
    });
  }

  return recommendations;
}

/**
 * Generate cash allocation recommendations
 */
function generateCashRecommendations(cashAnalysis: CashAnalysis): Recommendation[] {
  const recommendations: Recommendation[] = [];

  if (cashAnalysis.isExcessive && cashAnalysis.suggestedInvestmentAmount) {
    const suggestedAmount = cashAnalysis.suggestedInvestmentAmount.toLocaleString('ru-RU', {
      style: 'currency',
      currency: cashAnalysis.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    recommendations.push({
      id: generateRecommendationId('cash_allocation', 0),
      type: 'cash_allocation',
      priority: 'medium',
      title: 'Неиспользуемые денежные средства',
      description: `У вас ${cashAnalysis.cashPercentage.toFixed(1)}% портфеля в денежных средствах. Рекомендуется инвестировать часть средств для получения доходности.`,
      actionItems: [
        `Инвестируйте ${suggestedAmount} в индексные ETF для рыночной доходности`,
        'Рассмотрите краткосрочные облигации для минимального риска',
        'Сохраните 10% портфеля в наличных для ликвидности',
      ],
      rationale:
        'Избыточные денежные средства не приносят доход и подвержены инфляции. Инвестирование повышает потенциальную доходность портфеля.',
      currentAllocation: cashAnalysis.cashPercentage,
      targetAllocation: 10,
      potentialImpact: `Потенциальный дополнительный доход: ${(cashAnalysis.suggestedInvestmentAmount! * 0.08).toLocaleString('ru-RU', { style: 'currency', currency: cashAnalysis.currency, minimumFractionDigits: 0 })} в год (при 8% годовых)`,
    });
  }

  return recommendations;
}

/**
 * Generate concentration risk recommendations
 */
function generateConcentrationRecommendations(
  concentrationRisk: ConcentrationRisk,
  portfolio: PortfolioResponse
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  if (concentrationRisk.isHighRisk) {
    const actionItems: string[] = [];

    if (concentrationRisk.topPosition.percentage > 25) {
      actionItems.push(
        `Снизьте долю "${concentrationRisk.topPosition.ticker}" с ${concentrationRisk.topPosition.percentage.toFixed(1)}% до 15-20%`
      );
    }

    if (concentrationRisk.top3Concentration > 60) {
      actionItems.push(
        `Уменьшите концентрацию в топ-3 позициях с ${concentrationRisk.top3Concentration.toFixed(1)}% до 40-50%`
      );
    }

    actionItems.push('Реинвестируйте вырученные средства в 3-5 разных активов');
    actionItems.push('Рассмотрите ETF для автоматической диверсификации');

    recommendations.push({
      id: generateRecommendationId('concentration_risk', 0),
      type: 'concentration_risk',
      priority: 'high',
      title: 'Высокий риск концентрации',
      description:
        'Слишком большая доля портфеля сосредоточена в нескольких позициях. Это создает значительный риск потерь при падении этих активов.',
      actionItems,
      rationale:
        'Концентрация риска в отдельных активах увеличивает волатильность портфеля. Диверсификация снижает влияние неудачных инвестиций.',
      affectedPositions: [concentrationRisk.topPosition.ticker],
      potentialImpact: 'Снижение риска портфеля на 25-40%',
    });
  }

  return recommendations;
}

/**
 * Generate sector allocation recommendations
 */
function generateSectorRecommendations(
  sectorAllocation: SectorAllocation[]
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Check if any sector is over-concentrated (> 70%)
  const overConcentratedSector = sectorAllocation.find((sector) => sector.percentage > 70);

  if (overConcentratedSector) {
    recommendations.push({
      id: generateRecommendationId('sector_allocation', 0),
      type: 'sector_allocation',
      priority: 'high',
      title: 'Несбалансированное распределение по секторам',
      description: `Сектор "${overConcentratedSector.sector}" составляет ${overConcentratedSector.percentage.toFixed(1)}% портфеля. Рекомендуется диверсификация по другим секторам.`,
      actionItems: [
        `Снизьте долю сектора "${overConcentratedSector.sector}" до 50-60%`,
        'Инвестируйте в недопредставленные секторы',
        'Рассмотрите широкие индексные ETF для сбалансированной экспозиции',
      ],
      rationale:
        'Концентрация в одном секторе увеличивает риск от отраслевых спадов. Межсекторная диверсификация повышает устойчивость портфеля.',
      affectedPositions: overConcentratedSector.positions,
      potentialImpact: 'Снижение отраслевого риска на 30-40%',
    });
  }

  return recommendations;
}

/**
 * Generate risk management recommendations
 */
function generateRiskRecommendations(
  portfolio: PortfolioResponse,
  metrics: PortfolioMetrics
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // High volatility warning (> 25%)
  if (metrics.volatility > 25) {
    recommendations.push({
      id: generateRecommendationId('risk_management', 0),
      type: 'risk_management',
      priority: 'high',
      title: 'Высокая волатильность портфеля',
      description: `Волатильность портфеля составляет ${metrics.volatility.toFixed(1)}%, что значительно выше среднерыночного уровня.`,
      actionItems: [
        'Увеличьте долю облигаций до 25-30% для стабилизации',
        'Рассмотрите защитные активы (золото, облигации)',
        'Снизьте долю высокорисковых активов (фьючерсы, спекулятивные акции)',
      ],
      rationale:
        'Высокая волатильность означает большие колебания стоимости портфеля, что может привести к значительным временным убыткам.',
      potentialImpact: 'Снижение волатильности до 15-20%',
    });
  }

  // Low Sharpe Ratio (< 0.5)
  if (metrics.sharpeRatio < 0.5 && metrics.sharpeRatio !== 0) {
    recommendations.push({
      id: generateRecommendationId('risk_management', 1),
      type: 'risk_management',
      priority: 'medium',
      title: 'Низкая эффективность портфеля',
      description: `Коэффициент Шарпа составляет ${metrics.sharpeRatio.toFixed(2)}, что указывает на недостаточную доходность относительно принимаемого риска.`,
      actionItems: [
        'Оптимизируйте состав портфеля, избавившись от низкодоходных активов',
        'Рассмотрите более эффективные инструменты (индексные ETF)',
        'Ребалансируйте портфель для улучшения соотношения риск/доходность',
      ],
      rationale:
        'Низкий коэффициент Шарпа означает, что вы принимаете больше риска, чем это оправдано доходностью.',
      potentialImpact: 'Повышение эффективности портфеля на 30-50%',
    });
  }

  return recommendations;
}

/**
 * Calculate overall portfolio health score (0-100)
 */
function calculateOverallScore(
  metrics: PortfolioMetrics,
  concentrationRisk: ConcentrationRisk,
  cashAnalysis: CashAnalysis
): number {
  let score = 100;

  // Diversification score (30 points)
  score -= (1 - metrics.diversificationScore) * 30;

  // Concentration risk (20 points)
  if (concentrationRisk.isHighRisk) {
    score -= 20;
  } else if (concentrationRisk.topPosition.percentage > 20) {
    score -= 10;
  }

  // Cash allocation (15 points)
  if (cashAnalysis.isExcessive) {
    score -= 15;
  } else if (cashAnalysis.cashPercentage < 5) {
    score -= 5; // Too little cash is also a problem
  }

  // Volatility (20 points)
  if (metrics.volatility > 30) {
    score -= 20;
  } else if (metrics.volatility > 20) {
    score -= 10;
  }

  // Sharpe Ratio (15 points)
  if (metrics.sharpeRatio < 0) {
    score -= 15;
  } else if (metrics.sharpeRatio < 0.5) {
    score -= 10;
  } else if (metrics.sharpeRatio < 1) {
    score -= 5;
  }

  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score)));
}

// ============================================================================
// Main Recommendation Engine
// ============================================================================

/**
 * Generate comprehensive investment recommendations
 *
 * @param portfolio - Current portfolio data from Tinkoff API
 * @param metrics - Portfolio metrics from analytics
 * @returns Complete recommendation report with actionable insights
 */
export function generateRecommendations(
  portfolio: PortfolioResponse,
  metrics: PortfolioMetrics
): RecommendationReport {
  // Run all analyses
  const concentrationRisk = analyzeConcentrationRisk(portfolio);
  const cashAnalysis = analyzeCashAllocation(portfolio);
  const sectorAllocation = calculateSectorAllocation(portfolio);
  const targetAllocations = generateTargetAllocations(portfolio);

  // Generate recommendations
  const recommendations: Recommendation[] = [
    ...generateDiversificationRecommendations(portfolio, metrics),
    ...generateRebalancingRecommendations(portfolio, targetAllocations),
    ...generateCashRecommendations(cashAnalysis),
    ...generateConcentrationRecommendations(concentrationRisk, portfolio),
    ...generateSectorRecommendations(sectorAllocation),
    ...generateRiskRecommendations(portfolio, metrics),
  ];

  // Sort recommendations by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Calculate overall health score
  const overallScore = calculateOverallScore(metrics, concentrationRisk, cashAnalysis);

  return {
    recommendations,
    concentrationRisk,
    cashAnalysis,
    sectorAllocation,
    targetAllocations,
    overallScore,
    generatedAt: new Date(),
  };
}

/**
 * Get recommendations by priority
 */
export function getRecommendationsByPriority(
  report: RecommendationReport,
  priority: RecommendationPriority
): Recommendation[] {
  return report.recommendations.filter((rec) => rec.priority === priority);
}

/**
 * Get recommendations by type
 */
export function getRecommendationsByType(
  report: RecommendationReport,
  type: RecommendationType
): Recommendation[] {
  return report.recommendations.filter((rec) => rec.type === type);
}

/**
 * Get health score interpretation
 */
export function getHealthScoreInterpretation(score: number): {
  label: string;
  description: string;
  color: string;
} {
  if (score >= 80) {
    return {
      label: 'Отличное здоровье',
      description: 'Ваш портфель хорошо диверсифицирован и сбалансирован.',
      color: 'green',
    };
  } else if (score >= 60) {
    return {
      label: 'Хорошее здоровье',
      description: 'Портфель в хорошем состоянии с небольшими возможностями для улучшения.',
      color: 'blue',
    };
  } else if (score >= 40) {
    return {
      label: 'Требует внимания',
      description: 'Портфель нуждается в корректировках для снижения рисков.',
      color: 'yellow',
    };
  } else {
    return {
      label: 'Высокий риск',
      description: 'Портфель имеет серьезные проблемы, требующие немедленного внимания.',
      color: 'red',
    };
  }
}

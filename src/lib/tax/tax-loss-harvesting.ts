/**
 * Tax Loss Harvesting Module
 * Implements Russian tax optimization strategies including:
 * - Loss harvesting for 13% НДФЛ savings
 * - Wash sale detection (30-day rule)
 * - IIS deduction calculations
 * - Dividend tax optimization with DTAA
 */

import {
  LossPosition,
  TaxLossHarvestingReport,
  TaxRecommendation,
  WashSaleRule,
  WashSaleViolation,
  DividendTaxInfo,
  DividendTaxSummary,
  IISDeduction,
  IISType,
  TAX_RATES,
  RussianTaxCalculation,
} from '@/types/tax';

// ============================================
// Wash Sale Detection (30-day rule)
// ============================================

/**
 * Detects wash sale violations for a given sale
 * Wash sale: selling at a loss and repurchasing within 30 days
 */
export function detectWashSale(
  figi: string,
  saleDate: Date,
  saleLoss: number,
  saleQuantity: number,
  recentPurchases: Array<{ date: Date; quantity: number }>
): WashSaleRule {
  const washSalePeriodEnd = new Date(saleDate);
  washSalePeriodEnd.setDate(washSalePeriodEnd.getDate() + 30);

  const violations: WashSaleViolation[] = [];

  for (const purchase of recentPurchases) {
    if (purchase.date > saleDate && purchase.date <= washSalePeriodEnd) {
      // Wash sale violation detected
      const violatedQuantity = Math.min(purchase.quantity, saleQuantity);
      const violatedLoss = (saleLoss / saleQuantity) * violatedQuantity;

      violations.push({
        purchaseDate: purchase.date,
        quantity: violatedQuantity,
        violatedLoss,
      });
    }
  }

  return {
    figi,
    ticker: '', // will be filled by caller
    saleDate,
    quantity: saleQuantity,
    loss: saleLoss,
    washSalePeriodEnd,
    violations,
  };
}

/**
 * Checks if selling a position now would trigger wash sale
 */
export function wouldTriggerWashSale(
  figi: string,
  sellDate: Date,
  recentPurchases: Array<{ date: Date; quantity: number }>,
  futurePurchases: Array<{ date: Date; quantity: number }> = []
): boolean {
  const washSaleStart = new Date(sellDate);
  washSaleStart.setDate(washSaleStart.getDate() - 30);

  const washSaleEnd = new Date(sellDate);
  washSaleEnd.setDate(washSaleEnd.getDate() + 30);

  // Check past purchases
  for (const purchase of recentPurchases) {
    if (purchase.date >= washSaleStart && purchase.date < sellDate) {
      return true;
    }
  }

  // Check planned future purchases
  for (const purchase of futurePurchases) {
    if (purchase.date > sellDate && purchase.date <= washSaleEnd) {
      return true;
    }
  }

  return false;
}

// ============================================
// Loss Harvesting Analysis
// ============================================

interface Position {
  figi: string;
  ticker: string;
  name: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
}

interface Transaction {
  figi: string;
  date: Date;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
}

/**
 * Analyzes portfolio for tax loss harvesting opportunities
 */
export function analyzeLossHarvestingOpportunities(
  positions: Position[],
  transactions: Transaction[],
  currentDate: Date = new Date()
): TaxLossHarvestingReport {
  const lossPositions: LossPosition[] = [];
  const harvestablePositions: LossPosition[] = [];
  const blockedPositions: LossPosition[] = [];

  for (const position of positions) {
    const totalCost = position.quantity * position.averageCost;
    const currentValue = position.quantity * position.currentPrice;
    const unrealizedLoss = totalCost - currentValue;

    if (unrealizedLoss <= 0) continue; // Only interested in losses

    const potentialTaxSavings = unrealizedLoss * TAX_RATES.PERSONAL_INCOME;

    // Get recent transactions for this FIGI
    const recentPurchases = transactions
      .filter((t) => t.figi === position.figi && t.type === 'buy')
      .map((t) => ({ date: t.date, quantity: t.quantity }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    const lastSale = transactions
      .filter((t) => t.figi === position.figi && t.type === 'sell')
      .sort((a, b) => b.date.getTime() - a.date.getTime())[0];

    // Check for wash sale risk
    const washSaleRisk = wouldTriggerWashSale(
      position.figi,
      currentDate,
      recentPurchases
    );

    let recommendedAction: 'harvest' | 'wait' | 'avoid' = 'harvest';
    let reason = 'Можно продать для фиксации убытка и снижения налога';

    if (washSaleRisk) {
      recommendedAction = 'avoid';
      reason =
        'Риск wash sale: была покупка в последние 30 дней. Убыток не будет признан';
    } else if (unrealizedLoss < 1000) {
      recommendedAction = 'wait';
      reason = 'Убыток слишком мал для оптимизации (экономия < 130₽)';
    }

    const lossPosition: LossPosition = {
      figi: position.figi,
      ticker: position.ticker,
      name: position.name,
      quantity: position.quantity,
      averageCost: position.averageCost,
      currentPrice: position.currentPrice,
      totalCost,
      currentValue,
      unrealizedLoss,
      potentialTaxSavings,
      washSaleRisk,
      washSaleDate: washSaleRisk
        ? recentPurchases[0]?.date
        : undefined,
      lastSaleDate: lastSale?.date,
      recommendedAction,
      reason,
    };

    lossPositions.push(lossPosition);

    if (recommendedAction === 'harvest') {
      harvestablePositions.push(lossPosition);
    } else if (washSaleRisk) {
      blockedPositions.push(lossPosition);
    }
  }

  const totalUnrealizedLosses = lossPositions.reduce(
    (sum, p) => sum + p.unrealizedLoss,
    0
  );
  const potentialTaxSavings = harvestablePositions.reduce(
    (sum, p) => sum + p.potentialTaxSavings,
    0
  );

  const recommendations = generateLossHarvestingRecommendations(
    harvestablePositions,
    blockedPositions,
    currentDate
  );

  return {
    totalUnrealizedLosses,
    potentialTaxSavings,
    harvestablePositions: harvestablePositions.sort(
      (a, b) => b.potentialTaxSavings - a.potentialTaxSavings
    ),
    blockedPositions,
    recommendations,
  };
}

/**
 * Generates actionable recommendations for loss harvesting
 */
function generateLossHarvestingRecommendations(
  harvestable: LossPosition[],
  blocked: LossPosition[],
  currentDate: Date
): TaxRecommendation[] {
  const recommendations: TaxRecommendation[] = [];
  const yearEnd = new Date(currentDate.getFullYear(), 11, 31);

  // High-priority: Large harvestable losses
  const largeHarvestable = harvestable.filter((p) => p.unrealizedLoss > 50000);
  if (largeHarvestable.length > 0) {
    const totalSavings = largeHarvestable.reduce(
      (sum, p) => sum + p.potentialTaxSavings,
      0
    );
    recommendations.push({
      id: `harvest-large-${Date.now()}`,
      type: 'harvest_loss',
      priority: 'high',
      title: 'Зафиксировать крупные убытки',
      description: `Найдено ${largeHarvestable.length} позиций с убытками > 50,000₽. Фиксация позволит снизить налог на ${Math.round(totalSavings).toLocaleString()}₽`,
      potentialSavings: totalSavings,
      deadline: yearEnd,
      actionItems: largeHarvestable.map(
        (p) =>
          `Продать ${p.ticker} (${p.quantity} шт.) — экономия ${Math.round(p.potentialTaxSavings).toLocaleString()}₽`
      ),
      risks: [
        'Убыток можно учесть только при наличии прибыли в текущем году',
        'Неиспользованный убыток переносится на будущие периоды',
      ],
    });
  }

  // Medium-priority: Blocked positions becoming harvestable
  const soonUnblocked = blocked.filter((p) => {
    if (!p.washSaleDate) return false;
    const unblockDate = new Date(p.washSaleDate);
    unblockDate.setDate(unblockDate.getDate() + 30);
    const daysUntilUnblock =
      (unblockDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntilUnblock <= 14;
  });

  if (soonUnblocked.length > 0) {
    const totalSavings = soonUnblocked.reduce(
      (sum, p) => sum + p.potentialTaxSavings,
      0
    );
    recommendations.push({
      id: `unblock-soon-${Date.now()}`,
      type: 'wash_sale_warning',
      priority: 'medium',
      title: 'Wash sale период скоро завершится',
      description: `${soonUnblocked.length} позиций станут доступны для tax harvesting в ближайшие 2 недели`,
      potentialSavings: totalSavings,
      actionItems: soonUnblocked.map((p) => {
        const unblockDate = new Date(p.washSaleDate!);
        unblockDate.setDate(unblockDate.getDate() + 30);
        return `${p.ticker} — доступна после ${unblockDate.toLocaleDateString('ru-RU')}`;
      }),
      risks: [],
    });
  }

  // Low-priority: Year-end reminder
  const daysUntilYearEnd =
    (yearEnd.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysUntilYearEnd <= 60 && harvestable.length > 0) {
    const totalSavings = harvestable.reduce(
      (sum, p) => sum + p.potentialTaxSavings,
      0
    );
    recommendations.push({
      id: `year-end-${Date.now()}`,
      type: 'harvest_loss',
      priority: 'medium',
      title: 'Оптимизация налогов до конца года',
      description: `До конца года осталось ${Math.ceil(daysUntilYearEnd)} дней. Все убытки должны быть зафиксированы до 31 декабря`,
      potentialSavings: totalSavings,
      deadline: yearEnd,
      actionItems: [
        'Проверить все убыточные позиции',
        'Спланировать продажи до конца года',
        'Учесть wash sale период (30 дней)',
      ],
      risks: [
        'После 31 декабря убытки можно будет учесть только в следующем году',
      ],
    });
  }

  return recommendations;
}

// ============================================
// Dividend Tax Calculations
// ============================================

/**
 * Calculates dividend taxes considering DTAA (Double Tax Avoidance Agreement)
 */
export function calculateDividendTax(
  amount: number,
  currency: string,
  countryOfOrigin: string,
  paymentDate: Date
): Omit<DividendTaxInfo, 'id' | 'figi' | 'ticker'> {
  let withholdingRate = 0;
  let withholdingTax = 0;
  let dtaaCredit = 0;

  // Determine withholding rate by country
  if (countryOfOrigin === 'US') {
    withholdingRate = TAX_RATES.US_DIVIDEND_WITHHOLDING;
    withholdingTax = amount * withholdingRate;
    // DTAA: US withholding can be credited against Russian tax
    dtaaCredit = Math.min(withholdingTax, amount * TAX_RATES.PERSONAL_INCOME);
  } else if (countryOfOrigin === 'RU') {
    // Russian dividends: no withholding for residents
    withholdingRate = 0;
    withholdingTax = 0;
    dtaaCredit = 0;
  } else {
    // Other countries: check DTAA, default to 15%
    withholdingRate = 0.15;
    withholdingTax = amount * withholdingRate;
    dtaaCredit = Math.min(withholdingTax, amount * TAX_RATES.PERSONAL_INCOME);
  }

  const russianTax = amount * TAX_RATES.PERSONAL_INCOME;
  const netTax = Math.max(0, russianTax - dtaaCredit);
  const netAmount = amount - withholdingTax - netTax;

  return {
    paymentDate,
    amount,
    currency,
    countryOfOrigin,
    withholdingTax,
    withholdingRate,
    russianTax,
    dtaaCredit,
    netTax,
    netAmount,
  };
}

/**
 * Generates dividend tax summary for a year
 */
export function generateDividendTaxSummary(
  dividends: DividendTaxInfo[],
  year: number
): DividendTaxSummary {
  const yearDividends = dividends.filter(
    (d) => new Date(d.paymentDate).getFullYear() === year
  );

  const byCountry: Record<string, {
    dividends: number;
    withheld: number;
    russianTax: number;
    credit: number;
  }> = {};

  let totalDividends = 0;
  let totalWithheld = 0;
  let totalRussianTax = 0;
  let totalDTAACredit = 0;

  for (const div of yearDividends) {
    totalDividends += div.amount;
    totalWithheld += div.withholdingTax;
    totalRussianTax += div.russianTax;
    totalDTAACredit += div.dtaaCredit;

    if (!byCountry[div.countryOfOrigin]) {
      byCountry[div.countryOfOrigin] = {
        dividends: 0,
        withheld: 0,
        russianTax: 0,
        credit: 0,
      };
    }

    byCountry[div.countryOfOrigin].dividends += div.amount;
    byCountry[div.countryOfOrigin].withheld += div.withholdingTax;
    byCountry[div.countryOfOrigin].russianTax += div.russianTax;
    byCountry[div.countryOfOrigin].credit += div.dtaaCredit;
  }

  const netTaxOwed = totalRussianTax - totalDTAACredit;

  return {
    year,
    totalDividends,
    totalWithheld,
    totalRussianTax,
    totalDTAACredit,
    netTaxOwed,
    byCountry,
  };
}

// ============================================
// IIS Deduction Calculations
// ============================================

/**
 * Calculates IIS Type A deduction (on contributions)
 */
export function calculateIISTypeADeduction(
  yearlyContributions: number,
  year: number
): IISDeduction {
  const maxContribution = 400000; // Maximum for deduction
  const eligibleAmount = Math.min(yearlyContributions, maxContribution);
  const deduction = eligibleAmount * TAX_RATES.PERSONAL_INCOME;

  return {
    type: 'A',
    year,
    contributions: yearlyContributions,
    deduction: Math.min(deduction, TAX_RATES.IIS_TYPE_A_MAX_DEDUCTION),
  };
}

/**
 * Calculates IIS Type B deduction (on profits)
 */
export function calculateIISTypeBDeduction(
  totalProfit: number,
  year: number
): IISDeduction {
  return {
    type: 'B',
    year,
    profitExemption: totalProfit, // 100% exemption
  };
}

/**
 * Compares Type A vs Type B to recommend optimal IIS strategy
 */
export function recommendIISType(
  yearlyContributions: number,
  estimatedProfit: number,
  yearsHeld: number
): {
  recommended: IISType;
  typeASavings: number;
  typeBSavings: number;
  explanation: string;
} {
  // Type A: Deductions over time
  const typeAYearlySavings = Math.min(
    yearlyContributions * TAX_RATES.PERSONAL_INCOME,
    TAX_RATES.IIS_TYPE_A_MAX_DEDUCTION
  );
  const typeATotalSavings = typeAYearlySavings * yearsHeld;

  // Type B: Tax exemption on all profits
  const typeBSavings = estimatedProfit * TAX_RATES.PERSONAL_INCOME;

  let recommended: IISType;
  let explanation: string;

  if (typeBSavings > typeATotalSavings) {
    recommended = 'B';
    explanation = `Тип Б выгоднее: экономия ${Math.round(typeBSavings).toLocaleString()}₽ vs ${Math.round(typeATotalSavings).toLocaleString()}₽ по типу А. Подходит при высокой доходности.`;
  } else {
    recommended = 'A';
    explanation = `Тип А выгоднее: экономия ${Math.round(typeATotalSavings).toLocaleString()}₽ vs ${Math.round(typeBSavings).toLocaleString()}₽ по типу Б. Подходит при регулярных взносах.`;
  }

  return {
    recommended,
    typeASavings: typeATotalSavings,
    typeBSavings,
    explanation,
  };
}

// ============================================
// Tax Calculation
// ============================================

/**
 * Calculates total Russian tax liability
 */
export function calculateRussianTax(
  capitalGains: number,
  dividends: number,
  foreignTaxCredit: number,
  iisDeduction: number,
  lossCarryForward: number = 0
): RussianTaxCalculation {
  // Calculate taxable income
  const grossIncome = capitalGains + dividends;
  const deductions = iisDeduction + lossCarryForward;
  const taxBase = Math.max(0, grossIncome - deductions);

  // Calculate tax
  const taxRate = TAX_RATES.PERSONAL_INCOME;
  const taxBeforeCredit = taxBase * taxRate;
  const taxAmount = Math.max(0, taxBeforeCredit - foreignTaxCredit);

  return {
    income: grossIncome,
    deductions,
    taxBase,
    taxRate,
    taxAmount,
    breakdown: {
      capitalGains,
      dividends,
      foreignTaxCredit,
      iisDeduction,
    },
  };
}

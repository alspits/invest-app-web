import { TaxCalculation, TaxInput, PositionTaxInfo, TaxLossHarvestingOpportunity, HoldingPeriodAlert } from '@/types/tax';

// Russian tax rates
export const TAX_RATES = {
  SHORT_TERM: 0.13, // 13% for gains < 3 years
  LONG_TERM: 0, // 0% for gains >= 3 years (after 3-year deduction)
  DIVIDEND: 0.13, // 13% on dividends
  COUPON: 0.13, // 13% on bond coupons
} as const;

export const LONG_TERM_HOLDING_DAYS = 365 * 3; // 3 years

/**
 * Calculate tax liability based on income types
 */
export function calculateTax(input: TaxInput): TaxCalculation {
  const shortTermTax = input.shortTermGains * TAX_RATES.SHORT_TERM;
  const longTermTax = input.longTermGains * TAX_RATES.LONG_TERM;
  const dividendTax = input.dividends * TAX_RATES.DIVIDEND;
  const couponTax = input.coupons * TAX_RATES.COUPON;

  const totalIncome =
    input.shortTermGains +
    input.longTermGains +
    input.dividends +
    input.coupons -
    input.deductions;

  const totalTax = shortTermTax + longTermTax + dividendTax + couponTax;

  return {
    totalIncome,
    shortTermGains: input.shortTermGains,
    longTermGains: input.longTermGains,
    dividends: input.dividends,
    coupons: input.coupons,
    totalTax,
    shortTermTax,
    longTermTax,
    dividendTax,
    couponTax,
  };
}

/**
 * Calculate holding period in days
 */
export function calculateHoldingDays(purchaseDate: Date): number {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - purchaseDate.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if position qualifies for long-term tax treatment
 */
export function isLongTermHolding(purchaseDate: Date): boolean {
  return calculateHoldingDays(purchaseDate) >= LONG_TERM_HOLDING_DAYS;
}

/**
 * Calculate days until long-term status
 */
export function daysUntilLongTerm(purchaseDate: Date): number {
  const holdingDays = calculateHoldingDays(purchaseDate);
  return Math.max(0, LONG_TERM_HOLDING_DAYS - holdingDays);
}

/**
 * Calculate potential tax on unrealized gain
 */
export function calculateUnrealizedTax(
  unrealizedGain: number,
  isLongTerm: boolean
): number {
  const rate = isLongTerm ? TAX_RATES.LONG_TERM : TAX_RATES.SHORT_TERM;
  return unrealizedGain * rate;
}

/**
 * Calculate tax savings from holding until long-term
 */
export function calculateTaxSavings(unrealizedGain: number): number {
  const shortTermTax = unrealizedGain * TAX_RATES.SHORT_TERM;
  const longTermTax = unrealizedGain * TAX_RATES.LONG_TERM;
  return shortTermTax - longTermTax;
}

/**
 * Analyze position for tax loss harvesting
 */
export function analyzeTaxLossHarvesting(
  position: PositionTaxInfo
): TaxLossHarvestingOpportunity {
  const unrealizedLoss = Math.abs(Math.min(0, position.unrealizedGain));
  const taxSavings = unrealizedLoss * TAX_RATES.SHORT_TERM;

  let recommendation: 'sell-now' | 'hold' | 'consider' = 'hold';
  let reason = '';

  if (unrealizedLoss === 0) {
    recommendation = 'hold';
    reason = 'Позиция в прибыли, нет убытков для реализации';
  } else if (unrealizedLoss > 0 && taxSavings > 1000) {
    recommendation = 'sell-now';
    reason = `Значительный потенциал экономии налогов: ${taxSavings.toFixed(2)} ₽`;
  } else if (unrealizedLoss > 0 && taxSavings > 500) {
    recommendation = 'consider';
    reason = `Умеренная экономия налогов: ${taxSavings.toFixed(2)} ₽`;
  } else {
    recommendation = 'hold';
    reason = 'Убыток слишком мал для оптимизации';
  }

  return {
    position,
    unrealizedLoss,
    taxSavings,
    recommendation,
    reason,
  };
}

/**
 * Find positions approaching long-term threshold
 */
export function findHoldingPeriodAlerts(
  positions: PositionTaxInfo[],
  daysThreshold: number = 90
): HoldingPeriodAlert[] {
  return positions
    .filter(p => {
      const days = daysUntilLongTerm(p.purchaseDate);
      return days > 0 && days <= daysThreshold && p.unrealizedGain > 0;
    })
    .map(position => {
      const daysRemaining = daysUntilLongTerm(position.purchaseDate);
      const potentialTaxSavings = calculateTaxSavings(position.unrealizedGain);

      let recommendation = '';
      if (daysRemaining <= 30) {
        recommendation = 'Близко к безналоговому статусу! Рекомендуется держать.';
      } else if (daysRemaining <= 90) {
        recommendation = 'Скоро достигнет 3-летнего порога. Избегайте продажи.';
      }

      return {
        position,
        daysRemaining,
        unrealizedGain: position.unrealizedGain,
        potentialTaxSavings,
        recommendation,
      };
    })
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
}

/**
 * Format days into human-readable period
 */
export function formatHoldingPeriod(days: number): string {
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  const remainingDays = days % 30;

  const parts = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? 'год' : years < 5 ? 'года' : 'лет'}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? 'месяц' : months < 5 ? 'месяца' : 'месяцев'}`);
  if (remainingDays > 0 || parts.length === 0) {
    parts.push(`${remainingDays} ${remainingDays === 1 ? 'день' : remainingDays < 5 ? 'дня' : 'дней'}`);
  }

  return parts.join(' ');
}

/**
 * Calculate effective tax rate
 */
export function calculateEffectiveTaxRate(totalIncome: number, totalTax: number): number {
  if (totalIncome === 0) return 0;
  return (totalTax / totalIncome) * 100;
}

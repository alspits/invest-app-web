// Tax calculation types
export interface TaxableIncome {
  id: string;
  type: 'short-term-gain' | 'long-term-gain' | 'dividend' | 'coupon';
  amount: number;
  taxRate: number;
  taxAmount: number;
  year: number;
  date: Date;
  instrumentName: string;
  ticker?: string;
}

export interface TaxCalculation {
  totalIncome: number;
  shortTermGains: number;
  longTermGains: number;
  dividends: number;
  coupons: number;
  totalTax: number;
  shortTermTax: number;
  longTermTax: number;
  dividendTax: number;
  couponTax: number;
}

export interface PositionTaxInfo {
  positionId: string;
  ticker: string;
  instrumentName: string;
  quantity: number;
  purchaseDate: Date;
  purchasePrice: number;
  currentPrice: number;
  unrealizedGain: number;
  unrealizedLoss: number;
  holdingDays: number;
  daysUntilLongTerm: number;
  isLongTerm: boolean;
  potentialTaxSavings: number;
}

export interface TaxLossHarvestingOpportunity {
  position: PositionTaxInfo;
  unrealizedLoss: number;
  taxSavings: number;
  recommendation: 'sell-now' | 'hold' | 'consider';
  reason: string;
}

export interface HoldingPeriodAlert {
  position: PositionTaxInfo;
  daysRemaining: number;
  unrealizedGain: number;
  potentialTaxSavings: number;
  recommendation: string;
}

export interface TaxReport {
  year: number;
  totalIncome: number;
  totalTax: number;
  incomeByType: Record<string, number>;
  taxByType: Record<string, number>;
  transactions: TaxableIncome[];
  generatedAt: Date;
}

export interface TaxInput {
  shortTermGains: number;
  longTermGains: number;
  dividends: number;
  coupons: number;
  deductions: number;
}

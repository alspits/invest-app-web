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

// ============================================
// Russian Tax Optimization Types (Phase 5.2)
// ============================================

// Russian tax rates
export const TAX_RATES = {
  PERSONAL_INCOME: 0.13, // 13% НДФЛ
  US_DIVIDEND_WITHHOLDING: 0.30, // 30% withholding for US dividends
  EFFECTIVE_US_DIVIDEND: 0.13, // 13% after DTAA credit
  IIS_TYPE_A_MAX_DEDUCTION: 52000, // 400,000 * 13%
  IIS_TYPE_B_EXEMPTION: 1.0, // 100% exemption on profits
} as const;

// IIS (Individual Investment Account) types
export type IISType = 'A' | 'B' | null;

export interface IISAccount {
  id: string;
  type: IISType;
  openDate: Date;
  yearlyContributions: Record<number, number>; // year -> amount
  canClaim: boolean;
  eligibleForClosure: boolean; // after 3 years
}

// Loss harvesting types (Russian-specific)
export interface LossPosition {
  figi: string;
  ticker: string;
  name: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  totalCost: number;
  currentValue: number;
  unrealizedLoss: number;
  potentialTaxSavings: number;
  washSaleRisk: boolean;
  washSaleDate?: Date;
  lastSaleDate?: Date;
  recommendedAction: 'harvest' | 'wait' | 'avoid';
  reason: string;
}

export interface TaxLossHarvestingReport {
  totalUnrealizedLosses: number;
  potentialTaxSavings: number;
  harvestablePositions: LossPosition[];
  blockedPositions: LossPosition[]; // wash sale violations
  recommendations: TaxRecommendation[];
}

// Dividend taxation (Russian + foreign)
export interface DividendTaxInfo {
  id: string;
  figi: string;
  ticker: string;
  paymentDate: Date;
  amount: number;
  currency: string;
  countryOfOrigin: string;
  withholdingTax: number; // amount withheld
  withholdingRate: number; // rate applied
  russianTax: number; // 13% НДФЛ
  dtaaCredit: number; // foreign tax credit
  netTax: number; // actual tax owed in Russia
  netAmount: number; // after all taxes
}

export interface DividendTaxSummary {
  year: number;
  totalDividends: number;
  totalWithheld: number;
  totalRussianTax: number;
  totalDTAACredit: number;
  netTaxOwed: number;
  byCountry: Record<string, {
    dividends: number;
    withheld: number;
    russianTax: number;
    credit: number;
  }>;
}

// Tax reporting for 3-НДФЛ
export interface TaxReportData {
  year: number;
  personalInfo: {
    inn: string;
    fullName: string;
    address: string;
  };
  brokerInfo: {
    name: string;
    inn: string;
    agreementNumber: string;
  };
  income: {
    securities: SecurityIncome[];
    dividends: DividendTaxInfo[];
    totalIncome: number;
  };
  deductions: {
    iis: IISDeduction | null;
    losses: number;
    totalDeductions: number;
  };
  taxBase: number;
  taxCalculated: number;
  taxPaid: number;
  taxOwed: number;
}

export interface SecurityIncome {
  figi: string;
  ticker: string;
  name: string;
  buyDate: Date;
  sellDate: Date;
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  income: number;
  expenses: number;
  profit: number;
  taxableProfit: number;
}

export interface IISDeduction {
  type: IISType;
  year: number;
  contributions?: number; // Type A: amount contributed
  deduction?: number; // Type A: 13% of min(contributions, 400k)
  profitExemption?: number; // Type B: profit exempt from tax
}

// Wash sale tracking (30-day rule)
export interface WashSaleRule {
  figi: string;
  ticker: string;
  saleDate: Date;
  quantity: number;
  loss: number;
  washSalePeriodEnd: Date; // 30 days after sale
  violations: WashSaleViolation[];
}

export interface WashSaleViolation {
  purchaseDate: Date;
  quantity: number;
  violatedLoss: number; // portion of loss disallowed
}

// Tax optimization recommendations
export interface TaxRecommendation {
  id: string;
  type: 'harvest_loss' | 'defer_gain' | 'iis_contribution' | 'dividend_timing' | 'wash_sale_warning';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  potentialSavings: number;
  deadline?: Date;
  actionItems: string[];
  risks: string[];
}

// Tax strategy simulation
export interface TaxStrategy {
  name: string;
  description: string;
  actions: TaxAction[];
  estimatedSavings: number;
  risks: string[];
}

export interface TaxAction {
  type: 'sell_position' | 'buy_position' | 'contribute_iis' | 'defer_sale';
  figi?: string;
  ticker?: string;
  quantity?: number;
  amount?: number;
  deadline?: Date;
  reason: string;
}

// Extended tax calculation for Russian rules
export interface RussianTaxCalculation {
  income: number;
  deductions: number;
  taxBase: number;
  taxRate: number;
  taxAmount: number;
  breakdown: {
    capitalGains: number;
    dividends: number;
    foreignTaxCredit: number;
    iisDeduction: number;
  };
}

import { create } from 'zustand';
import {
  TaxableIncome,
  TaxReport,
  TaxInput,
  TaxLossHarvestingReport,
  DividendTaxInfo,
  DividendTaxSummary,
  IISAccount,
  TaxRecommendation,
  TaxReportData,
  RussianTaxCalculation,
} from '@/types/tax';

interface TaxState {
  // Tax data (legacy)
  taxableIncomes: TaxableIncome[];
  selectedYear: number;
  isLoading: boolean;
  error: string | null;

  // Loss harvesting (Phase 5.2)
  lossHarvestingReport: TaxLossHarvestingReport | null;
  isLoadingLossHarvesting: boolean;

  // Dividend taxes
  dividends: DividendTaxInfo[];
  dividendSummaries: Record<number, DividendTaxSummary>; // year -> summary
  isLoadingDividends: boolean;

  // IIS accounts
  iisAccounts: IISAccount[];
  selectedIISAccount: IISAccount | null;
  isLoadingIIS: boolean;

  // Tax reporting
  taxReports: Record<number, TaxReportData>; // year -> report
  currentYearCalculation: RussianTaxCalculation | null;
  isLoadingTaxReport: boolean;

  // Legacy Actions
  addTaxableIncome: (income: TaxableIncome) => void;
  removeTaxableIncome: (id: string) => void;
  setSelectedYear: (year: number) => void;
  loadTaxData: (year: number) => Promise<void>;
  generateReport: (year: number) => TaxReport;
  exportReport: (report: TaxReport, format: 'csv' | 'pdf') => void;
  clearError: () => void;

  // Phase 5.2 Actions - Loss Harvesting
  loadLossHarvestingReport: (accountId: string) => Promise<void>;
  clearLossHarvestingReport: () => void;

  // Phase 5.2 Actions - Dividends
  loadDividends: (accountId: string, year?: number) => Promise<void>;
  loadDividendSummary: (accountId: string, year: number) => Promise<void>;

  // Phase 5.2 Actions - IIS
  loadIISAccounts: () => Promise<void>;
  selectIISAccount: (accountId: string) => void;
  updateIISContribution: (accountId: string, year: number, amount: number) => Promise<void>;

  // Phase 5.2 Actions - Tax Reporting
  generateTaxReportData: (accountId: string, year: number) => Promise<void>;
  loadCurrentYearCalculation: (accountId: string) => Promise<void>;
  exportTaxReportData: (year: number, format: '3ndfl' | 'pdf' | 'excel') => Promise<void>;
}

export const useTaxStore = create<TaxState>((set, get) => ({
  // Legacy state
  taxableIncomes: [],
  selectedYear: new Date().getFullYear(),
  isLoading: false,
  error: null,

  // Phase 5.2 state
  lossHarvestingReport: null,
  isLoadingLossHarvesting: false,
  dividends: [],
  dividendSummaries: {},
  isLoadingDividends: false,
  iisAccounts: [],
  selectedIISAccount: null,
  isLoadingIIS: false,
  taxReports: {},
  currentYearCalculation: null,
  isLoadingTaxReport: false,

  addTaxableIncome: (income) => {
    set((state) => ({
      taxableIncomes: [...state.taxableIncomes, income],
    }));
  },

  removeTaxableIncome: (id) => {
    set((state) => ({
      taxableIncomes: state.taxableIncomes.filter((i) => i.id !== id),
    }));
  },

  setSelectedYear: (year) => {
    set({ selectedYear: year });
    get().loadTaxData(year);
  },

  loadTaxData: async (year) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Load from API or local storage
      // For now, using mock data
      const mockIncomes: TaxableIncome[] = [];
      set({ taxableIncomes: mockIncomes, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Ошибка загрузки данных',
        isLoading: false,
      });
    }
  },

  generateReport: (year) => {
    const incomes = get().taxableIncomes.filter((i) => i.year === year);

    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    const totalTax = incomes.reduce((sum, i) => sum + i.taxAmount, 0);

    const incomeByType: Record<string, number> = {};
    const taxByType: Record<string, number> = {};

    incomes.forEach((income) => {
      incomeByType[income.type] = (incomeByType[income.type] || 0) + income.amount;
      taxByType[income.type] = (taxByType[income.type] || 0) + income.taxAmount;
    });

    return {
      year,
      totalIncome,
      totalTax,
      incomeByType,
      taxByType,
      transactions: incomes,
      generatedAt: new Date(),
    };
  },

  exportReport: (report, format) => {
    if (format === 'csv') {
      exportToCSV(report);
    } else if (format === 'pdf') {
      // PDF export would require a library like jsPDF
      console.log('PDF export not implemented yet');
      alert('PDF экспорт будет доступен в следующей версии');
    }
  },

  clearError: () => set({ error: null }),

  // ============================================
  // Phase 5.2 Actions - Loss Harvesting
  // ============================================

  loadLossHarvestingReport: async (accountId: string) => {
    set({ isLoadingLossHarvesting: true });

    try {
      const response = await fetch(`/api/tax/harvesting?accountId=${accountId}`);

      if (!response.ok) {
        throw new Error('Failed to load loss harvesting report');
      }

      const report: TaxLossHarvestingReport = await response.json();

      set({ lossHarvestingReport: report });
    } catch (error) {
      console.error('Error loading loss harvesting report:', error);
      set({ lossHarvestingReport: null });
    } finally {
      set({ isLoadingLossHarvesting: false });
    }
  },

  clearLossHarvestingReport: () => {
    set({ lossHarvestingReport: null });
  },

  // ============================================
  // Phase 5.2 Actions - Dividends
  // ============================================

  loadDividends: async (accountId: string, year?: number) => {
    set({ isLoadingDividends: true });

    try {
      const params = new URLSearchParams({ accountId });
      if (year) params.append('year', year.toString());

      const response = await fetch(`/api/tax/dividends?${params}`);

      if (!response.ok) {
        throw new Error('Failed to load dividends');
      }

      const dividends: DividendTaxInfo[] = await response.json();

      set({ dividends });
    } catch (error) {
      console.error('Error loading dividends:', error);
      set({ dividends: [] });
    } finally {
      set({ isLoadingDividends: false });
    }
  },

  loadDividendSummary: async (accountId: string, year: number) => {
    set({ isLoadingDividends: true });

    try {
      const response = await fetch(
        `/api/tax/dividends/summary?accountId=${accountId}&year=${year}`
      );

      if (!response.ok) {
        throw new Error('Failed to load dividend summary');
      }

      const summary: DividendTaxSummary = await response.json();

      set((state) => ({
        dividendSummaries: {
          ...state.dividendSummaries,
          [year]: summary,
        },
      }));
    } catch (error) {
      console.error('Error loading dividend summary:', error);
    } finally {
      set({ isLoadingDividends: false });
    }
  },

  // ============================================
  // Phase 5.2 Actions - IIS
  // ============================================

  loadIISAccounts: async () => {
    set({ isLoadingIIS: true });

    try {
      const response = await fetch('/api/tax/iis');

      if (!response.ok) {
        throw new Error('Failed to load IIS accounts');
      }

      const accounts: IISAccount[] = await response.json();

      set({
        iisAccounts: accounts,
        selectedIISAccount: accounts.length > 0 ? accounts[0] : null,
      });
    } catch (error) {
      console.error('Error loading IIS accounts:', error);
      set({ iisAccounts: [], selectedIISAccount: null });
    } finally {
      set({ isLoadingIIS: false });
    }
  },

  selectIISAccount: (accountId: string) => {
    const account = get().iisAccounts.find((acc) => acc.id === accountId);
    if (account) {
      set({ selectedIISAccount: account });
    }
  },

  updateIISContribution: async (accountId: string, year: number, amount: number) => {
    try {
      const response = await fetch('/api/tax/iis/contribution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, year, amount }),
      });

      if (!response.ok) {
        throw new Error('Failed to update IIS contribution');
      }

      // Reload IIS accounts to get updated data
      await get().loadIISAccounts();
    } catch (error) {
      console.error('Error updating IIS contribution:', error);
      throw error;
    }
  },

  // ============================================
  // Phase 5.2 Actions - Tax Reporting
  // ============================================

  generateTaxReportData: async (accountId: string, year: number) => {
    set({ isLoadingTaxReport: true });

    try {
      const response = await fetch(
        `/api/tax/report?accountId=${accountId}&year=${year}`
      );

      if (!response.ok) {
        throw new Error('Failed to generate tax report');
      }

      const report: TaxReportData = await response.json();

      set((state) => ({
        taxReports: {
          ...state.taxReports,
          [year]: report,
        },
      }));
    } catch (error) {
      console.error('Error generating tax report:', error);
    } finally {
      set({ isLoadingTaxReport: false });
    }
  },

  loadCurrentYearCalculation: async (accountId: string) => {
    set({ isLoadingTaxReport: true });

    try {
      const response = await fetch(
        `/api/tax/calculation?accountId=${accountId}`
      );

      if (!response.ok) {
        throw new Error('Failed to load tax calculation');
      }

      const calculation: RussianTaxCalculation = await response.json();

      set({ currentYearCalculation: calculation });
    } catch (error) {
      console.error('Error loading tax calculation:', error);
      set({ currentYearCalculation: null });
    } finally {
      set({ isLoadingTaxReport: false });
    }
  },

  exportTaxReportData: async (year: number, format: '3ndfl' | 'pdf' | 'excel') => {
    try {
      const report = get().taxReports[year];

      if (!report) {
        throw new Error('Tax report not found for year ' + year);
      }

      const response = await fetch('/api/tax/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, format, report }),
      });

      if (!response.ok) {
        throw new Error('Failed to export tax report');
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tax-report-${year}.${format === '3ndfl' ? 'xml' : format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting tax report:', error);
      throw error;
    }
  },
}));

/**
 * Export report to CSV
 */
function exportToCSV(report: TaxReport) {
  const rows = [
    ['Налоговый отчет за', report.year],
    ['Дата создания', report.generatedAt.toLocaleDateString('ru-RU')],
    [],
    ['Итого доход', report.totalIncome.toFixed(2)],
    ['Итого налог', report.totalTax.toFixed(2)],
    [],
    ['Тип', 'Доход', 'Налог'],
  ];

  Object.keys(report.incomeByType).forEach((type) => {
    rows.push([
      translateIncomeType(type),
      report.incomeByType[type].toFixed(2),
      report.taxByType[type].toFixed(2),
    ]);
  });

  rows.push([]);
  rows.push(['Транзакции']);
  rows.push(['Дата', 'Тип', 'Инструмент', 'Сумма', 'Ставка налога', 'Налог']);

  report.transactions.forEach((transaction) => {
    rows.push([
      transaction.date.toLocaleDateString('ru-RU'),
      translateIncomeType(transaction.type),
      transaction.instrumentName,
      transaction.amount.toFixed(2),
      `${(transaction.taxRate * 100).toFixed(0)}%`,
      transaction.taxAmount.toFixed(2),
    ]);
  });

  const csvContent = rows.map((row) => row.join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `tax_report_${report.year}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Translate income type to Russian
 */
function translateIncomeType(type: string): string {
  const translations: Record<string, string> = {
    'short-term-gain': 'Краткосрочная прибыль',
    'long-term-gain': 'Долгосрочная прибыль',
    'dividend': 'Дивиденды',
    'coupon': 'Купоны',
  };
  return translations[type] || type;
}

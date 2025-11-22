import { create } from 'zustand';
import { TaxableIncome, TaxReport, TaxInput } from '@/types/tax';

interface TaxState {
  // Tax data
  taxableIncomes: TaxableIncome[];
  selectedYear: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  addTaxableIncome: (income: TaxableIncome) => void;
  removeTaxableIncome: (id: string) => void;
  setSelectedYear: (year: number) => void;
  loadTaxData: (year: number) => Promise<void>;
  generateReport: (year: number) => TaxReport;
  exportReport: (report: TaxReport, format: 'csv' | 'pdf') => void;
  clearError: () => void;
}

export const useTaxStore = create<TaxState>((set, get) => ({
  taxableIncomes: [],
  selectedYear: new Date().getFullYear(),
  isLoading: false,
  error: null,

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

'use client';

/**
 * Tax Reporting Component (Phase 5.2)
 * Generates 3-НДФЛ declaration data and exports to various formats
 */

import { useEffect, useState } from 'react';
import { useTaxStore } from '@/stores/taxStore';
import { usePortfolioStore } from '@/stores/portfolioStore';

export function TaxReporting() {
  const { selectedAccount } = usePortfolioStore();
  const {
    taxReports,
    currentYearCalculation,
    isLoadingTaxReport,
    generateTaxReportData,
    loadCurrentYearCalculation,
    exportTaxReportData,
  } = useTaxStore();

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear() - 1);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (selectedAccount) {
      loadCurrentYearCalculation(selectedAccount.id);
    }
  }, [selectedAccount, loadCurrentYearCalculation]);

  const handleGenerateReport = async () => {
    if (selectedAccount) {
      await generateTaxReportData(selectedAccount.id, selectedYear);
    }
  };

  const handleExport = async (format: '3ndfl' | 'pdf' | 'excel') => {
    setIsExporting(true);
    try {
      await exportTaxReportData(selectedYear, format);
    } catch (error) {
      alert('Ошибка экспорта: ' + (error as Error).message);
    } finally {
      setIsExporting(false);
    }
  };

  if (!selectedAccount) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-gray-500">Выберите счет</p>
      </div>
    );
  }

  const report = taxReports[selectedYear];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Налоговая отчётность
        </h2>
        <p className="text-gray-600">
          Генерация декларации 3-НДФЛ и расчёт налога к уплате
        </p>
      </div>

      {/* Year Selector */}
      <div className="flex gap-2 items-center">
        <label className="text-sm font-medium text-gray-700">Отчётный год:</label>
        {[2024, 2023, 2022, 2021].map((year) => (
          <button
            key={year}
            onClick={() => setSelectedYear(year)}
            className={`px-4 py-2 rounded-lg border ${
              selectedYear === year
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {year}
          </button>
        ))}
      </div>

      {/* Current Year Preview */}
      {currentYearCalculation && selectedYear === new Date().getFullYear() && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            Текущий год (предварительный расчёт)
          </h3>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-blue-700">Доход</p>
              <p className="text-xl font-bold text-blue-900">
                {Math.round(currentYearCalculation.income).toLocaleString('ru-RU')}₽
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-700">Вычеты</p>
              <p className="text-xl font-bold text-blue-900">
                {Math.round(currentYearCalculation.deductions).toLocaleString('ru-RU')}₽
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-700">Налоговая база</p>
              <p className="text-xl font-bold text-blue-900">
                {Math.round(currentYearCalculation.taxBase).toLocaleString('ru-RU')}₽
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-700">Налог (13%)</p>
              <p className="text-xl font-bold text-red-600">
                {Math.round(currentYearCalculation.taxAmount).toLocaleString('ru-RU')}₽
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Generate Report */}
      {!report && (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-600 mb-4">
            Отчёт за {selectedYear} год не сгенерирован
          </p>
          <button
            onClick={handleGenerateReport}
            disabled={isLoadingTaxReport}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
          >
            {isLoadingTaxReport ? 'Генерация...' : 'Сгенерировать отчёт'}
          </button>
        </div>
      )}

      {/* Report Data */}
      {report && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-sm font-medium text-gray-600">Всего доход</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {Math.round(report.income.totalIncome).toLocaleString('ru-RU')}₽
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-sm font-medium text-gray-600">Вычеты</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {Math.round(report.deductions.totalDeductions).toLocaleString('ru-RU')}₽
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-sm font-medium text-gray-600">Налоговая база</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {Math.round(report.taxBase).toLocaleString('ru-RU')}₽
              </p>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-gray-600">К уплате</p>
              <p className="mt-2 text-2xl font-bold text-red-600">
                {Math.round(report.taxOwed).toLocaleString('ru-RU')}₽
              </p>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Экспорт отчёта
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => handleExport('3ndfl')}
                disabled={isExporting}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
              >
                3-НДФЛ (XML)
              </button>
              <button
                onClick={() => handleExport('pdf')}
                disabled={isExporting}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
              >
                PDF
              </button>
              <button
                onClick={() => handleExport('excel')}
                disabled={isExporting}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300"
              >
                Excel
              </button>
            </div>
          </div>

          {/* Report Details */}
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Детализация отчёта
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {/* Securities Income */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Доход от ценных бумаг ({report.income.securities.length})
                </h4>
                <p className="text-sm text-gray-600">
                  Прибыль от продажи акций и других инструментов
                </p>
              </div>

              {/* Dividends */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Дивиденды ({report.income.dividends.length})
                </h4>
                <p className="text-sm text-gray-600">
                  Выплаты от российских и иностранных компаний
                </p>
              </div>

              {/* Deductions */}
              {report.deductions.iis && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Вычет ИИС (Тип {report.deductions.iis.type})
                  </h4>
                  <p className="text-sm text-gray-600">
                    {report.deductions.iis.type === 'A'
                      ? `На взносы: ${Math.round(report.deductions.iis.deduction || 0).toLocaleString('ru-RU')}₽`
                      : `Освобождение от налога на прибыль: ${Math.round(report.deductions.iis.profitExemption || 0).toLocaleString('ru-RU')}₽`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Info Box */}
      <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-amber-800">
              <strong>Внимание:</strong> Сгенерированный отчёт является справочным.
              Перед подачей декларации обязательно проверьте все данные и
              проконсультируйтесь с налоговым консультантом.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaxReporting;

'use client';

import { useState } from 'react';
import { useTaxStore } from '@/stores/taxStore';
import { TaxReport as TaxReportType } from '@/types/tax';

export default function TaxReport() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const { generateReport, exportReport } = useTaxStore();

  const report = generateReport(selectedYear);

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const handleExport = (format: 'csv' | 'pdf') => {
    exportReport(report, format);
  };

  const incomeTypeLabels: Record<string, string> = {
    'short-term-gain': 'Краткосрочная прибыль',
    'long-term-gain': 'Долгосрочная прибыль',
    'dividend': 'Дивиденды',
    'coupon': 'Купоны',
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Налоговый отчет</h2>
          <p className="text-gray-600">Годовая сводка доходов и уплаченных налогов</p>
        </div>

        <div className="flex gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
          <div className="text-blue-100 text-sm mb-1">Общий доход</div>
          <div className="text-3xl font-bold">
            {report.totalIncome.toLocaleString('ru-RU')} ₽
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-lg p-6 text-white">
          <div className="text-red-100 text-sm mb-1">Всего налогов</div>
          <div className="text-3xl font-bold">
            {report.totalTax.toLocaleString('ru-RU')} ₽
          </div>
        </div>
      </div>

      {/* Income breakdown */}
      {Object.keys(report.incomeByType).length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 text-lg mb-4">Разбивка по типам дохода</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(report.incomeByType).map(([type, amount]) => (
              <div key={type} className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">{incomeTypeLabels[type] || type}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">
                      {amount.toLocaleString('ru-RU')} ₽
                    </div>
                    <div className="text-xs text-gray-500">Доход</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-red-600">
                      {(report.taxByType[type] || 0).toLocaleString('ru-RU')} ₽
                    </div>
                    <div className="text-xs text-gray-500">Налог</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions table */}
      {report.transactions.length > 0 ? (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 text-lg mb-4">
            История транзакций ({report.transactions.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дата
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Инструмент
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Тип
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Сумма
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ставка
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Налог
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {report.transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {transaction.date.toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div>{transaction.ticker || '-'}</div>
                      <div className="text-xs text-gray-500">{transaction.instrumentName}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {incomeTypeLabels[transaction.type] || transaction.type}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      {transaction.amount.toLocaleString('ru-RU')} ₽
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                      {(transaction.taxRate * 100).toFixed(0)}%
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-red-600">
                      {transaction.taxAmount.toLocaleString('ru-RU')} ₽
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 mb-6">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="mt-4 text-gray-600">Нет транзакций за {selectedYear} год</p>
        </div>
      )}

      {/* Export buttons */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="font-semibold text-gray-900 text-lg mb-4">Экспорт отчета</h3>
        <div className="flex gap-3">
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Экспорт в CSV
          </button>

          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            Экспорт в PDF
          </button>
        </div>

        <div className="mt-4 bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800">
                Используйте экспортированные отчеты для подачи налоговой декларации (3-НДФЛ) или
                передачи данных вашему налоговому консультанту.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Generated timestamp */}
      <div className="mt-6 text-center text-sm text-gray-500">
        Отчет сформирован: {report.generatedAt.toLocaleString('ru-RU')}
      </div>
    </div>
  );
}

'use client';

/**
 * Dividend Tax Tracker Component (Phase 5.2)
 * Tracks dividend taxation with DTAA (Double Tax Avoidance Agreement)
 * Shows withholding taxes from US/foreign dividends and Russian 13% НДФЛ
 */

import { useEffect, useState } from 'react';
import { useTaxStore } from '@/stores/taxStore';
import { usePortfolioStore } from '@/stores/portfolioStore';

export function DividendTaxTracker() {
  const { selectedAccount } = usePortfolioStore();
  const {
    dividends,
    dividendSummaries,
    isLoadingDividends,
    loadDividends,
    loadDividendSummary,
  } = useTaxStore();

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (selectedAccount) {
      loadDividends(selectedAccount.id, selectedYear);
      loadDividendSummary(selectedAccount.id, selectedYear);
    }
  }, [selectedAccount, selectedYear, loadDividends, loadDividendSummary]);

  const summary = dividendSummaries[selectedYear];

  if (!selectedAccount) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-gray-500">Выберите счет</p>
      </div>
    );
  }

  if (isLoadingDividends) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-gray-200" />
          <div className="h-4 w-full rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Налогообложение дивидендов
        </h2>
        <p className="text-gray-600">
          Учёт иностранных налогов (withholding) и СОИДН для расчёта 13% НДФЛ
        </p>
      </div>

      {/* Year Selector */}
      <div className="flex gap-2">
        {[2024, 2023, 2022].map((year) => (
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

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm font-medium text-gray-600">Всего дивидендов</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {Math.round(summary.totalDividends).toLocaleString('ru-RU')}₽
            </p>
          </div>
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
            <p className="text-sm font-medium text-gray-600">Удержано за рубежом</p>
            <p className="mt-2 text-2xl font-bold text-orange-600">
              {Math.round(summary.totalWithheld).toLocaleString('ru-RU')}₽
            </p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-medium text-gray-600">Зачёт по СОИДН</p>
            <p className="mt-2 text-2xl font-bold text-blue-600">
              -{Math.round(summary.totalDTAACredit).toLocaleString('ru-RU')}₽
            </p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-gray-600">К уплате в РФ</p>
            <p className="mt-2 text-2xl font-bold text-red-600">
              {Math.round(summary.netTaxOwed).toLocaleString('ru-RU')}₽
            </p>
          </div>
        </div>
      )}

      {/* By Country Breakdown */}
      {summary && Object.keys(summary.byCountry).length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">
              По странам
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {Object.entries(summary.byCountry).map(([country, data]) => (
              <div key={country} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900">
                    {country === 'US' ? 'США' : country === 'RU' ? 'Россия' : country}
                  </h4>
                  <div className="text-right space-y-1">
                    <div className="text-sm text-gray-600">
                      Дивиденды: {Math.round(data.dividends).toLocaleString('ru-RU')}₽
                    </div>
                    <div className="text-sm text-orange-600">
                      Удержано: {Math.round(data.withheld).toLocaleString('ru-RU')}₽
                    </div>
                    <div className="text-sm text-blue-600">
                      Зачёт: {Math.round(data.credit).toLocaleString('ru-RU')}₽
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
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
              <strong>СОИДН:</strong> По соглашению об избежании двойного налогообложения с США
              (и другими странами) удержанный налог зачитывается при расчёте российского НДФЛ 13%.
              Фактически вы платите max(13%, иностранная ставка).
            </p>
          </div>
        </div>
      </div>

      {/* No dividends */}
      {dividends.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">
            Нет дивидендов за {selectedYear} год
          </p>
        </div>
      )}
    </div>
  );
}

export default DividendTaxTracker;

'use client';

import { useState } from 'react';
import { calculateTax, TAX_RATES, calculateEffectiveTaxRate } from '@/lib/tax-utils';
import { TaxInput } from '@/types/tax';

export default function TaxCalculator() {
  const [input, setInput] = useState<TaxInput>({
    shortTermGains: 0,
    longTermGains: 0,
    dividends: 0,
    coupons: 0,
    deductions: 0,
  });

  const calculation = calculateTax(input);
  const effectiveRate = calculateEffectiveTaxRate(calculation.totalIncome, calculation.totalTax);

  const handleInputChange = (field: keyof TaxInput, value: string) => {
    const numValue = parseFloat(value) || 0;
    setInput((prev) => ({ ...prev, [field]: numValue }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Калькулятор налогов</h2>

      <div className="space-y-4 mb-6">
        {/* Short-term gains */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Краткосрочная прибыль (&lt; 3 лет)
            <span className="text-gray-500 ml-2">13%</span>
          </label>
          <input
            type="number"
            value={input.shortTermGains || ''}
            onChange={(e) => handleInputChange('shortTermGains', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
          />
        </div>

        {/* Long-term gains */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Долгосрочная прибыль (≥ 3 лет)
            <span className="text-green-600 ml-2">0%</span>
          </label>
          <input
            type="number"
            value={input.longTermGains || ''}
            onChange={(e) => handleInputChange('longTermGains', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
          />
        </div>

        {/* Dividends */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Дивиденды
            <span className="text-gray-500 ml-2">13%</span>
          </label>
          <input
            type="number"
            value={input.dividends || ''}
            onChange={(e) => handleInputChange('dividends', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
          />
        </div>

        {/* Coupons */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Купоны облигаций
            <span className="text-gray-500 ml-2">13%</span>
          </label>
          <input
            type="number"
            value={input.coupons || ''}
            onChange={(e) => handleInputChange('coupons', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
          />
        </div>

        {/* Deductions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Вычеты и убытки
          </label>
          <input
            type="number"
            value={input.deductions || ''}
            onChange={(e) => handleInputChange('deductions', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
          />
        </div>
      </div>

      {/* Results */}
      <div className="border-t border-gray-200 pt-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Расчет налогов</h3>

        {/* Income breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Краткосрочная прибыль</div>
            <div className="text-lg font-semibold text-gray-900">
              {calculation.shortTermGains.toLocaleString('ru-RU')} ₽
            </div>
            <div className="text-sm text-red-600">
              Налог: {calculation.shortTermTax.toLocaleString('ru-RU')} ₽
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Долгосрочная прибыль</div>
            <div className="text-lg font-semibold text-gray-900">
              {calculation.longTermGains.toLocaleString('ru-RU')} ₽
            </div>
            <div className="text-sm text-green-600">
              Налог: {calculation.longTermTax.toLocaleString('ru-RU')} ₽
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Дивиденды</div>
            <div className="text-lg font-semibold text-gray-900">
              {calculation.dividends.toLocaleString('ru-RU')} ₽
            </div>
            <div className="text-sm text-red-600">
              Налог: {calculation.dividendTax.toLocaleString('ru-RU')} ₽
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Купоны</div>
            <div className="text-lg font-semibold text-gray-900">
              {calculation.coupons.toLocaleString('ru-RU')} ₽
            </div>
            <div className="text-sm text-red-600">
              Налог: {calculation.couponTax.toLocaleString('ru-RU')} ₽
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
          <div className="flex justify-between items-center mb-2">
            <span className="text-blue-100">Общий доход</span>
            <span className="text-2xl font-bold">
              {calculation.totalIncome.toLocaleString('ru-RU')} ₽
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-blue-100">Итого налог</span>
            <span className="text-3xl font-bold">
              {calculation.totalTax.toLocaleString('ru-RU')} ₽
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-blue-100">Эффективная ставка</span>
            <span className="font-semibold">{effectiveRate.toFixed(2)}%</span>
          </div>
        </div>

        {/* Tax tips */}
        {calculation.shortTermGains > 0 && (
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
                  <strong>Совет:</strong> Удерживая активы более 3 лет, вы можете снизить налог до 0% и
                  сэкономить {(calculation.shortTermGains * TAX_RATES.SHORT_TERM).toLocaleString('ru-RU')} ₽
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import TaxCalculator from '@/components/features/Tax/TaxCalculator';
import TaxLossHarvesting from '@/components/features/Tax/TaxLossHarvesting';
import HoldingPeriodTracker from '@/components/features/Tax/HoldingPeriodTracker';
import TaxReport from '@/components/features/Tax/TaxReport';
import { PositionTaxInfo } from '@/types/tax';
import { calculateHoldingDays, isLongTermHolding, daysUntilLongTerm, calculateTaxSavings } from '@/lib/tax-utils';

type TabType = 'calculator' | 'harvesting' | 'holding' | 'report';

export default function TaxPage() {
  const [activeTab, setActiveTab] = useState<TabType>('calculator');
  const [positions, setPositions] = useState<PositionTaxInfo[]>([]);

  // Load mock positions for demo
  useEffect(() => {
    // TODO: Replace with actual portfolio data from portfolioStore
    const mockPositions: PositionTaxInfo[] = [
      {
        positionId: '1',
        ticker: 'SBER',
        instrumentName: 'Сбербанк',
        quantity: 100,
        purchaseDate: new Date('2022-01-15'),
        purchasePrice: 250,
        currentPrice: 280,
        unrealizedGain: 3000,
        unrealizedLoss: 0,
        holdingDays: calculateHoldingDays(new Date('2022-01-15')),
        daysUntilLongTerm: daysUntilLongTerm(new Date('2022-01-15')),
        isLongTerm: isLongTermHolding(new Date('2022-01-15')),
        potentialTaxSavings: calculateTaxSavings(3000),
      },
      {
        positionId: '2',
        ticker: 'GAZP',
        instrumentName: 'Газпром',
        quantity: 50,
        purchaseDate: new Date('2023-06-01'),
        purchasePrice: 180,
        currentPrice: 160,
        unrealizedGain: -1000,
        unrealizedLoss: 1000,
        holdingDays: calculateHoldingDays(new Date('2023-06-01')),
        daysUntilLongTerm: daysUntilLongTerm(new Date('2023-06-01')),
        isLongTerm: isLongTermHolding(new Date('2023-06-01')),
        potentialTaxSavings: 0,
      },
      {
        positionId: '3',
        ticker: 'YNDX',
        instrumentName: 'Яндекс',
        quantity: 20,
        purchaseDate: new Date('2024-09-01'),
        purchasePrice: 3000,
        currentPrice: 3200,
        unrealizedGain: 4000,
        unrealizedLoss: 0,
        holdingDays: calculateHoldingDays(new Date('2024-09-01')),
        daysUntilLongTerm: daysUntilLongTerm(new Date('2024-09-01')),
        isLongTerm: isLongTermHolding(new Date('2024-09-01')),
        potentialTaxSavings: calculateTaxSavings(4000),
      },
    ];

    setPositions(mockPositions);
  }, []);

  const tabs = [
    { id: 'calculator' as TabType, label: 'Калькулятор', icon: '🧮' },
    { id: 'harvesting' as TabType, label: 'Оптимизация убытков', icon: '📉' },
    { id: 'holding' as TabType, label: 'Период владения', icon: '⏱️' },
    { id: 'report' as TabType, label: 'Отчеты', icon: '📊' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Налоговый помощник
          </h1>
          <p className="text-gray-600">
            Рассчитывайте налоги, оптимизируйте убытки и отслеживайте льготы
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab content */}
        <div className="space-y-6">
          {activeTab === 'calculator' && <TaxCalculator />}
          {activeTab === 'harvesting' && <TaxLossHarvesting positions={positions} />}
          {activeTab === 'holding' && <HoldingPeriodTracker positions={positions} />}
          {activeTab === 'report' && <TaxReport />}
        </div>

        {/* Footer info */}
        <div className="mt-8 bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
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
                <strong>Важно:</strong> Этот инструмент предоставляет справочную информацию и не заменяет
                профессиональную налоговую консультацию. Для точного расчета налогов обратитесь к
                налоговому консультанту или используйте официальные данные брокера.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

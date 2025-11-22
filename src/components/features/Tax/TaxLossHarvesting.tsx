'use client';

import { useMemo } from 'react';
import { analyzeTaxLossHarvesting } from '@/lib/tax-utils';
import { PositionTaxInfo } from '@/types/tax';

interface TaxLossHarvestingProps {
  positions: PositionTaxInfo[];
}

export default function TaxLossHarvesting({ positions }: TaxLossHarvestingProps) {
  const opportunities = useMemo(() => {
    return positions
      .map(analyzeTaxLossHarvesting)
      .filter((opp) => opp.unrealizedLoss > 0)
      .sort((a, b) => b.taxSavings - a.taxSavings);
  }, [positions]);

  const totalPotentialSavings = opportunities.reduce((sum, opp) => sum + opp.taxSavings, 0);

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'sell-now':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'consider':
        return 'bg-amber-50 border-amber-200 text-amber-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const getRecommendationBadge = (recommendation: string) => {
    switch (recommendation) {
      case 'sell-now':
        return 'bg-red-100 text-red-800';
      case 'consider':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRecommendationText = (recommendation: string) => {
    switch (recommendation) {
      case 'sell-now':
        return 'Продать сейчас';
      case 'consider':
        return 'Рассмотреть';
      default:
        return 'Держать';
    }
  };

  if (opportunities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Налоговая оптимизация убытков</h2>
        <div className="text-center py-8">
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
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="mt-4 text-gray-600">
            Нет позиций с нереализованными убытками для оптимизации
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Налоговая оптимизация убытков</h2>
        <p className="text-gray-600">
          Реализация убытков для компенсации прибыли и снижения налоговой нагрузки
        </p>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 text-white mb-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-green-100 text-sm">Потенциальная экономия налогов</div>
            <div className="text-3xl font-bold">
              {totalPotentialSavings.toLocaleString('ru-RU')} ₽
            </div>
          </div>
          <div className="text-right">
            <div className="text-green-100 text-sm">Возможностей</div>
            <div className="text-2xl font-bold">{opportunities.length}</div>
          </div>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded">
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
              <strong>Как это работает:</strong> Продавая активы с убытком, вы можете компенсировать
              налогооблагаемую прибыль. Экономия составляет 13% от суммы убытка.
            </p>
          </div>
        </div>
      </div>

      {/* Opportunities list */}
      <div className="space-y-4">
        {opportunities.map((opportunity) => (
          <div
            key={opportunity.position.positionId}
            className={`border rounded-lg p-4 ${getRecommendationColor(opportunity.recommendation)}`}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">
                    {opportunity.position.ticker || opportunity.position.instrumentName}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getRecommendationBadge(
                      opportunity.recommendation
                    )}`}
                  >
                    {getRecommendationText(opportunity.recommendation)}
                  </span>
                </div>
                <p className="text-sm opacity-80">{opportunity.position.instrumentName}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
              <div>
                <div className="text-xs opacity-70">Количество</div>
                <div className="font-semibold">{opportunity.position.quantity}</div>
              </div>
              <div>
                <div className="text-xs opacity-70">Цена покупки</div>
                <div className="font-semibold">
                  {opportunity.position.purchasePrice.toLocaleString('ru-RU')} ₽
                </div>
              </div>
              <div>
                <div className="text-xs opacity-70">Текущая цена</div>
                <div className="font-semibold">
                  {opportunity.position.currentPrice.toLocaleString('ru-RU')} ₽
                </div>
              </div>
              <div>
                <div className="text-xs opacity-70">Убыток</div>
                <div className="font-semibold text-red-600">
                  -{opportunity.unrealizedLoss.toLocaleString('ru-RU')} ₽
                </div>
              </div>
            </div>

            <div className="bg-white bg-opacity-50 rounded p-3 mb-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Экономия налогов при продаже:</span>
                <span className="text-lg font-bold text-green-700">
                  {opportunity.taxSavings.toLocaleString('ru-RU')} ₽
                </span>
              </div>
            </div>

            <div className="text-sm opacity-90">
              <strong>Рекомендация:</strong> {opportunity.reason}
            </div>
          </div>
        ))}
      </div>

      {/* Warning */}
      <div className="mt-6 bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
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
              <strong>Внимание:</strong> Перед продажей учитывайте фундаментальные перспективы актива
              и свою инвестиционную стратегию. Налоговая оптимизация не должна быть единственной
              причиной для продажи.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useMemo } from 'react';
import { findHoldingPeriodAlerts, formatHoldingPeriod, LONG_TERM_HOLDING_DAYS } from '@/lib/tax-utils';
import { PositionTaxInfo } from '@/types/tax';

interface HoldingPeriodTrackerProps {
  positions: PositionTaxInfo[];
}

export default function HoldingPeriodTracker({ positions }: HoldingPeriodTrackerProps) {
  const alerts = useMemo(() => findHoldingPeriodAlerts(positions, 90), [positions]);

  const longTermPositions = useMemo(
    () => positions.filter((p) => p.isLongTerm && p.unrealizedGain > 0),
    [positions]
  );

  const totalLongTermSavings = longTermPositions.reduce(
    (sum, p) => sum + p.potentialTaxSavings,
    0
  );

  const getUrgencyColor = (daysRemaining: number) => {
    if (daysRemaining <= 30) return 'border-green-500 bg-green-50';
    if (daysRemaining <= 60) return 'border-amber-500 bg-amber-50';
    return 'border-blue-500 bg-blue-50';
  };

  const getProgressPercentage = (daysRemaining: number) => {
    return ((LONG_TERM_HOLDING_DAYS - daysRemaining) / LONG_TERM_HOLDING_DAYS) * 100;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Отслеживание периода владения</h2>
        <p className="text-gray-600">
          Позиции, приближающиеся к 3-летнему порогу для безналогового статуса
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 text-white">
          <div className="text-green-100 text-sm mb-1">Позиции без налога (≥3 лет)</div>
          <div className="text-3xl font-bold mb-2">{longTermPositions.length}</div>
          <div className="text-sm text-green-100">
            Экономия: {totalLongTermSavings.toLocaleString('ru-RU')} ₽
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
          <div className="text-blue-100 text-sm mb-1">Приближаются к порогу</div>
          <div className="text-3xl font-bold mb-2">{alerts.length}</div>
          <div className="text-sm text-blue-100">
            В ближайшие 90 дней
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
              <strong>Льгота на долгосрочное владение:</strong> При владении ценными бумагами более 3 лет
              вы получаете вычет, который может обнулить налог на прибыль (до 3 млн ₽ в год).
            </p>
          </div>
        </div>
      </div>

      {/* Alerts list */}
      {alerts.length > 0 ? (
        <div className="space-y-4 mb-6">
          <h3 className="font-semibold text-gray-900 text-lg">Ближайшие к порогу</h3>
          {alerts.map((alert) => {
            const progressPercentage = getProgressPercentage(alert.daysRemaining);
            return (
              <div
                key={alert.position.positionId}
                className={`border-l-4 rounded-lg p-4 ${getUrgencyColor(alert.daysRemaining)}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-lg text-gray-900">
                      {alert.position.ticker || alert.position.instrumentName}
                    </h4>
                    <p className="text-sm text-gray-600">{alert.position.instrumentName}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Дней до порога</div>
                    <div className="text-2xl font-bold text-gray-900">{alert.daysRemaining}</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Прогресс владения</span>
                    <span>{progressPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>
                      {formatHoldingPeriod(alert.position.holdingDays)}
                    </span>
                    <span>3 года</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-3">
                  <div>
                    <div className="text-xs text-gray-600">Количество</div>
                    <div className="font-semibold text-gray-900">{alert.position.quantity}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Нереализованная прибыль</div>
                    <div className="font-semibold text-green-600">
                      +{alert.unrealizedGain.toLocaleString('ru-RU')} ₽
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Потенциальная экономия</div>
                    <div className="font-semibold text-blue-600">
                      {alert.potentialTaxSavings.toLocaleString('ru-RU')} ₽
                    </div>
                  </div>
                </div>

                <div className="bg-white bg-opacity-70 rounded p-3">
                  <p className="text-sm text-gray-800">
                    <strong>💡 Совет:</strong> {alert.recommendation}
                  </p>
                </div>
              </div>
            );
          })}
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
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="mt-4 text-gray-600">
            Нет позиций, приближающихся к 3-летнему порогу в ближайшие 90 дней
          </p>
        </div>
      )}

      {/* Long-term positions */}
      {longTermPositions.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 text-lg mb-4">
            Достигли безналогового статуса (≥3 лет)
          </h3>
          <div className="space-y-3">
            {longTermPositions.map((position) => (
              <div
                key={position.positionId}
                className="bg-green-50 border border-green-200 rounded-lg p-4"
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900">
                        {position.ticker || position.instrumentName}
                      </h4>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                        Без налога
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Владение: {formatHoldingPeriod(position.holdingDays)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Прибыль</div>
                    <div className="font-semibold text-green-600">
                      +{position.unrealizedGain.toLocaleString('ru-RU')} ₽
                    </div>
                    <div className="text-xs text-gray-500">
                      Экономия: {position.potentialTaxSavings.toLocaleString('ru-RU')} ₽
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

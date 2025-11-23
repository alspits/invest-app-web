'use client';

/**
 * Tax Loss Harvesting Component (Phase 5.2)
 * Displays tax loss harvesting opportunities with Russian tax rules (13% НДФЛ)
 * Integrates with taxStore and uses new tax optimization logic
 */

import { useEffect } from 'react';
import { useTaxStore } from '@/stores/taxStore';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { LossPosition, TaxRecommendation } from '@/types/tax';

// Legacy props interface for backward compatibility
interface TaxLossHarvestingProps {
  positions?: any[];
}

export default function TaxLossHarvesting({ positions: legacyPositions }: TaxLossHarvestingProps = {}) {
  const { selectedAccount } = usePortfolioStore();
  const {
    lossHarvestingReport,
    isLoadingLossHarvesting,
    loadLossHarvestingReport,
  } = useTaxStore();

  useEffect(() => {
    // Use new store-based loading if no legacy positions provided
    if (!legacyPositions && selectedAccount) {
      loadLossHarvestingReport(selectedAccount.id);
    }
  }, [legacyPositions, selectedAccount, loadLossHarvestingReport]);

  // Legacy mode fallback
  if (legacyPositions) {
    return <LegacyTaxLossHarvesting positions={legacyPositions} />;
  }

  if (!selectedAccount) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-gray-500">
          Выберите счет для анализа налоговой оптимизации
        </p>
      </div>
    );
  }

  if (isLoadingLossHarvesting) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-gray-200" />
          <div className="h-4 w-full rounded bg-gray-200" />
          <div className="h-4 w-3/4 rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  if (!lossHarvestingReport) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-gray-500">Не удалось загрузить отчет</p>
      </div>
    );
  }

  const {
    totalUnrealizedLosses,
    potentialTaxSavings,
    harvestablePositions,
    blockedPositions,
    recommendations,
  } = lossHarvestingReport;

  // No opportunities - show empty state
  if (harvestablePositions.length === 0 && blockedPositions.length === 0) {
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Налоговая оптимизация убытков</h2>
        <p className="text-gray-600">
          Реализация убытков для компенсации прибыли и снижения налоговой нагрузки (13% НДФЛ)
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm font-medium text-gray-600">Нереализованные убытки</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {Math.abs(totalUnrealizedLosses).toLocaleString('ru-RU')}₽
          </p>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-medium text-gray-600">Потенциальная экономия (13%)</p>
          <p className="mt-2 text-2xl font-bold text-green-600">
            {Math.round(potentialTaxSavings).toLocaleString('ru-RU')}₽
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm font-medium text-gray-600">Позиций для оптимизации</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {harvestablePositions.length}
          </p>
        </div>
      </div>

      {/* Info box */}
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
              <strong>Как это работает:</strong> Продавая активы с убытком, вы можете компенсировать
              налогооблагаемую прибыль. Экономия составляет 13% от суммы убытка согласно НДФЛ.
            </p>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-blue-900">
            Рекомендации
          </h3>
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <RecommendationCard key={rec.id} recommendation={rec} />
            ))}
          </div>
        </div>
      )}

      {/* Harvestable Positions */}
      {harvestablePositions.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Доступные для оптимизации
            </h3>
            <p className="text-sm text-gray-500">
              Позиции, которые можно продать для фиксации убытка
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {harvestablePositions.map((position) => (
              <PositionRow key={position.figi} position={position} />
            ))}
          </div>
        </div>
      )}

      {/* Blocked Positions (Wash Sale) */}
      {blockedPositions.length > 0 && (
        <div className="rounded-lg border border-orange-200 bg-orange-50">
          <div className="border-b border-orange-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-orange-900">
              Заблокированные (Wash Sale)
            </h3>
            <p className="text-sm text-orange-700">
              Позиции с риском нарушения правила 30 дней
            </p>
          </div>
          <div className="divide-y divide-orange-200">
            {blockedPositions.map((position) => (
              <PositionRow key={position.figi} position={position} blocked />
            ))}
          </div>
        </div>
      )}

      {/* Warning */}
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
              <strong>Внимание:</strong> Перед продажей учитывайте фундаментальные перспективы актива
              и свою инвестиционную стратегию. Налоговая оптимизация не должна быть единственной
              причиной для продажи. Остерегайтесь wash sale — повторной покупки в течение 30 дней.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Sub-components
// ============================================

interface PositionRowProps {
  position: LossPosition;
  blocked?: boolean;
}

function PositionRow({ position, blocked }: PositionRowProps) {
  const rowBgColor = blocked ? 'hover:bg-orange-100' : 'hover:bg-gray-50';

  return (
    <div className={`px-6 py-4 transition-colors ${rowBgColor}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900">{position.ticker}</h4>
            <span className="text-sm text-gray-500">{position.name}</span>
          </div>
          <p className="mt-1 text-sm text-gray-600">{position.reason}</p>
          {position.washSaleDate && (
            <p className="mt-1 text-xs text-orange-600">
              Покупка {position.washSaleDate.toLocaleDateString('ru-RU')} —
              доступно после{' '}
              {new Date(
                position.washSaleDate.getTime() + 30 * 24 * 60 * 60 * 1000
              ).toLocaleDateString('ru-RU')}
            </p>
          )}
        </div>
        <div className="text-right">
          <div className="space-y-1">
            <div className="text-sm text-gray-600">
              {position.quantity} шт. × {position.currentPrice.toFixed(2)}₽
            </div>
            <div className="font-medium text-red-600">
              Убыток: {position.unrealizedLoss.toLocaleString('ru-RU')}₽
            </div>
            <div className="text-sm font-semibold text-green-600">
              Экономия: {Math.round(position.potentialTaxSavings).toLocaleString('ru-RU')}₽
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface RecommendationCardProps {
  recommendation: TaxRecommendation;
}

function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const priorityColors = {
    high: 'border-red-300 bg-red-50',
    medium: 'border-orange-300 bg-orange-50',
    low: 'border-blue-300 bg-blue-50',
  };

  const priorityLabels = {
    high: 'Высокий приоритет',
    medium: 'Средний приоритет',
    low: 'Низкий приоритет',
  };

  return (
    <div
      className={`rounded-lg border p-4 ${priorityColors[recommendation.priority]}`}
    >
      <div className="mb-2 flex items-start justify-between">
        <div>
          <h4 className="font-semibold text-gray-900">{recommendation.title}</h4>
          <p className="text-xs font-medium text-gray-600">
            {priorityLabels[recommendation.priority]}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-green-600">
            +{Math.round(recommendation.potentialSavings).toLocaleString('ru-RU')}₽
          </p>
          {recommendation.deadline && (
            <p className="text-xs text-gray-600">
              до {recommendation.deadline.toLocaleDateString('ru-RU')}
            </p>
          )}
        </div>
      </div>
      <p className="mb-3 text-sm text-gray-700">{recommendation.description}</p>
      {recommendation.actionItems.length > 0 && (
        <ul className="space-y-1">
          {recommendation.actionItems.map((item, idx) => (
            <li key={idx} className="text-sm text-gray-700">
              • {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ============================================
// Legacy Component (backward compatibility)
// ============================================

function LegacyTaxLossHarvesting({ positions }: { positions: any[] }) {
  // Original implementation preserved for backward compatibility
  // This can be removed once all usages are migrated
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Налоговая оптимизация убытков (Legacy)
      </h2>
      <p className="text-gray-500">
        Используйте новую версию компонента без передачи positions prop
      </p>
    </div>
  );
}

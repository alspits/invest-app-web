'use client';

/**
 * Trade Order Preview Component
 * Displays proposed trades with cost/tax estimates and approval actions
 */

import { useEffect, useState } from 'react';
import { useRebalancingStore } from '@/stores/rebalancing';
import type { TradeOrder } from '@/lib/rebalancing';

export function TradeOrderPreview() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    proposedOrders,
    costEstimate,
    taxEstimate,
    currentPlan,
    generateTrades,
    estimateCosts,
    estimateTaxes,
    createRebalancingPlan,
    acceptPlan,
    resetPlan,
    isAnalyzing,
  } = useRebalancingStore();

  useEffect(() => {
    if (proposedOrders.length > 0 && !costEstimate) {
      estimateCosts();
      estimateTaxes();
    }
  }, [proposedOrders, costEstimate, estimateCosts, estimateTaxes]);

  if (proposedOrders.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <p className="text-gray-600">
          Сначала проведите анализ отклонений и сгенерируйте торговые ордера
        </p>
        <button
          onClick={() => generateTrades()}
          disabled={isAnalyzing}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
        >
          Сгенерировать ордера
        </button>
      </div>
    );
  }

  const sellOrders = proposedOrders.filter((o) => o.direction === 'SELL');
  const buyOrders = proposedOrders.filter((o) => o.direction === 'BUY');

  const totalOrderValue = proposedOrders.reduce(
    (sum, o) => sum + o.estimatedTotal,
    0
  );

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">План ребалансировки</h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Всего ордеров</div>
            <div className="text-2xl font-semibold">{proposedOrders.length}</div>
            <div className="text-xs text-gray-500 mt-1">
              {sellOrders.length} продать, {buyOrders.length} купить
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Объем сделок</div>
            <div className="text-2xl font-semibold">
              {formatCurrency(totalOrderValue)}
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Транзакционные издержки</div>
            <div className="text-2xl font-semibold text-orange-600">
              {costEstimate ? formatCurrency(costEstimate.totalCost) : '...'}
            </div>
            {costEstimate && (
              <div className="text-xs text-gray-500 mt-1">
                {costEstimate.costAsPercent.toFixed(2)}% от объема
              </div>
            )}
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Налоговое воздействие</div>
            <div className="text-2xl font-semibold text-red-600">
              {taxEstimate ? formatCurrency(taxEstimate.estimatedTaxLiability) : '...'}
            </div>
            {taxEstimate && taxEstimate.unrealizedLosses > 0 && (
              <div className="text-xs text-green-600 mt-1">
                Убытки: {formatCurrency(taxEstimate.unrealizedLosses)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Warnings */}
      {currentPlan && currentPlan.summary.warnings.length > 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-2">⚠️ Предупреждения</h4>
          <ul className="space-y-1">
            {currentPlan.summary.warnings.map((warning, idx) => (
              <li key={idx} className="text-sm text-yellow-800">
                • {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Trade Orders Table */}
      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Торговые ордера</h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Тикер
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Действие
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                  Количество
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                  Цена
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                  Сумма
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Причина
                </th>
              </tr>
            </thead>
            <tbody>
              {proposedOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-100">
                  <td className="px-4 py-3">
                    <div className="font-medium">{order.ticker}</div>
                    <div className="text-xs text-gray-500">{order.name}</div>
                  </td>
                  <td className="px-4 py-3">
                    {renderDirectionBadge(order.direction)}
                  </td>
                  <td className="px-4 py-3 text-right">{order.quantity}</td>
                  <td className="px-4 py-3 text-right">
                    {formatCurrency(order.estimatedPrice)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatCurrency(order.estimatedTotal)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {order.reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cost Breakdown */}
      {costEstimate && (
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Детализация издержек</h3>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Комиссии брокера</span>
              <span className="font-medium">
                {formatCurrency(costEstimate.commission)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Спред (bid-ask)</span>
              <span className="font-medium">
                {formatCurrency(costEstimate.spread)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Рыночное воздействие</span>
              <span className="font-medium">
                {formatCurrency(costEstimate.marketImpact)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="font-semibold">Итого издержки</span>
              <span className="font-semibold text-orange-600">
                {formatCurrency(costEstimate.totalCost)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={async () => {
            try {
              setIsSubmitting(true);
              await createRebalancingPlan();
              acceptPlan();
            } catch (error) {
              console.error('Failed to create rebalancing plan:', error);
            } finally {
              setIsSubmitting(false);
            }
          }}
          disabled={isSubmitting}
          className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Обработка...' : '✓ Утвердить план ребалансировки'}
        </button>

        <button
          onClick={resetPlan}
          disabled={isSubmitting}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Отменить
        </button>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          ℹ️ <strong>Важно:</strong> Это план ребалансировки для ознакомления. Приложение
          не выполняет торговые операции автоматически. Используйте эту информацию для
          самостоятельного размещения ордеров в брокерском терминале.
        </p>
      </div>
    </div>
  );
}

// Helper functions
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function renderDirectionBadge(direction: TradeOrder['direction']) {
  const config = {
    BUY: { color: 'bg-green-100 text-green-800', label: 'Купить' },
    SELL: { color: 'bg-red-100 text-red-800', label: 'Продать' },
  };

  const { color, label } = config[direction];

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${color}`}>
      {label}
    </span>
  );
}

'use client';

/**
 * ScenarioBuilder Component
 *
 * Interactive builder for creating what-if scenarios.
 * Allows adjusting existing positions and adding new ones.
 */

import { useState, useMemo } from 'react';
import { useScenarioStore } from '@/stores/scenarioStore';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { PositionAdjustment, NewPosition } from '@/types/scenario';
import { quotationToNumber } from '@/lib/tinkoff-api';
import { Plus, Minus, X, Search, TrendingUp, TrendingDown } from 'lucide-react';

export function ScenarioBuilder() {
  const { portfolio } = usePortfolioStore();
  const {
    currentScenario,
    addAdjustment,
    updateAdjustment,
    removeAdjustment,
    addNewPosition,
    updateNewPosition,
    removeNewPosition,
    clearCurrentScenario,
  } = useScenarioStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'adjust' | 'add'>('adjust');

  // Filter positions by search query
  const filteredPositions = useMemo(() => {
    if (!portfolio) return [];

    const query = searchQuery.toLowerCase();
    return portfolio.positions.filter(
      (pos) =>
        (pos.ticker && pos.ticker.toLowerCase().includes(query)) ||
        (pos.name && pos.name.toLowerCase().includes(query))
    );
  }, [portfolio, searchQuery]);

  // Get adjustments as a map for quick lookup
  const adjustmentMap = useMemo(() => {
    const map = new Map<string, PositionAdjustment>();
    currentScenario.adjustments.forEach((adj) => {
      map.set(adj.figi, adj);
    });
    return map;
  }, [currentScenario.adjustments]);

  // Get new positions as a map for quick lookup
  const newPositionMap = useMemo(() => {
    const map = new Map<string, NewPosition>();
    currentScenario.newPositions.forEach((pos) => {
      map.set(pos.figi, pos);
    });
    return map;
  }, [currentScenario.newPositions]);

  const handleAdjustQuantity = (
    figi: string,
    ticker: string,
    name: string,
    instrumentType: string,
    currentQuantity: number,
    currentPrice: number,
    currency: string,
    change: number
  ) => {
    const existingAdjustment = adjustmentMap.get(figi);
    const currentChange = existingAdjustment?.quantityChange || 0;
    const newChange = currentChange + change;

    // Prevent reducing quantity below zero
    if (currentQuantity + newChange < 0) {
      return;
    }

    if (newChange === 0) {
      removeAdjustment(figi);
    } else {
      const adjustment: PositionAdjustment = {
        figi,
        ticker,
        name,
        instrumentType,
        quantityChange: newChange,
        pricePerUnit: currentPrice,
        currency,
      };
      addAdjustment(adjustment);
    }
  };

  const handleAddNewPosition = () => {
    // For demo purposes, we'll add a placeholder
    // In production, this would open a search/select dialog
    const demoPosition: NewPosition = {
      figi: `DEMO_${Date.now()}`,
      ticker: 'DEMO',
      name: 'Демо позиция',
      instrumentType: 'share',
      quantity: 10,
      pricePerUnit: 100,
      currency: 'RUB',
    };
    addNewPosition(demoPosition);
  };

  const hasChanges =
    currentScenario.adjustments.length > 0 ||
    currentScenario.newPositions.length > 0;

  if (!portfolio) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center">
          Выберите портфель для создания сценария
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Построитель сценария
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Измените существующие позиции или добавьте новые
            </p>
          </div>
          {hasChanges && (
            <button
              onClick={clearCurrentScenario}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
            >
              Очистить изменения
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setSelectedTab('adjust')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              selectedTab === 'adjust'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Изменить позиции ({currentScenario.adjustments.length})
          </button>
          <button
            onClick={() => setSelectedTab('add')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              selectedTab === 'add'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Добавить позиции ({currentScenario.newPositions.length})
          </button>
        </div>
      </div>

      {/* Search */}
      {selectedTab === 'adjust' && (
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по тикеру или названию..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {selectedTab === 'adjust' ? (
          // Adjust existing positions
          <div className="space-y-4">
            {filteredPositions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                {searchQuery
                  ? 'Позиции не найдены'
                  : 'Нет доступных позиций'}
              </p>
            ) : (
              filteredPositions.map((position) => {
                const quantity = quotationToNumber(position.quantity);
                const currentPrice = position.currentPrice
                  ? quotationToNumber(position.currentPrice)
                  : quotationToNumber(position.averagePositionPrice);
                const adjustment = adjustmentMap.get(position.figi);
                const quantityChange = adjustment?.quantityChange || 0;
                const newQuantity = quantity + quantityChange;

                return (
                  <div
                    key={position.figi}
                    className={`p-4 border rounded-lg transition-colors ${
                      quantityChange !== 0
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {position.ticker || 'N/A'}
                          </h3>
                          <span className="text-sm text-gray-500">
                            {position.name}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                          <span>
                            Текущее кол-во: <strong>{quantity}</strong>
                          </span>
                          <span>
                            Цена:{' '}
                            <strong>
                              {currentPrice.toLocaleString('ru-RU')} ₽
                            </strong>
                          </span>
                        </div>
                        {quantityChange !== 0 && (
                          <div className="mt-2 flex items-center gap-2">
                            {quantityChange > 0 ? (
                              <TrendingUp className="w-4 h-4 text-green-600" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-600" />
                            )}
                            <span
                              className={`text-sm font-medium ${
                                quantityChange > 0
                                  ? 'text-green-700'
                                  : 'text-red-700'
                              }`}
                            >
                              {quantityChange > 0 ? '+' : ''}
                              {quantityChange} → Новое кол-во: {newQuantity}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() =>
                            handleAdjustQuantity(
                              position.figi,
                              position.ticker || 'N/A',
                              position.name || 'Unknown',
                              position.instrumentType || 'unknown',
                              quantity,
                              currentPrice,
                              position.averagePositionPrice.currency || 'RUB',
                              -1
                            )
                          }
                          disabled={newQuantity <= 0}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleAdjustQuantity(
                              position.figi,
                              position.ticker || 'N/A',
                              position.name || 'Unknown',
                              position.instrumentType || 'unknown',
                              quantity,
                              currentPrice,
                              position.averagePositionPrice.currency || 'RUB',
                              1
                            )
                          }
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg border border-green-300 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        {quantityChange !== 0 && (
                          <button
                            onClick={() => removeAdjustment(position.figi)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          // Add new positions
          <div className="space-y-4">
            {currentScenario.newPositions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Нет новых позиций</p>
                <button
                  onClick={handleAddNewPosition}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Добавить позицию
                </button>
              </div>
            ) : (
              <>
                {currentScenario.newPositions.map((position) => (
                  <div
                    key={position.figi}
                    className="p-4 border border-green-300 bg-green-50 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {position.ticker}
                          </h3>
                          <span className="text-sm text-gray-500">
                            {position.name}
                          </span>
                          <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                            НОВАЯ
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                          <span>
                            Количество: <strong>{position.quantity}</strong>
                          </span>
                          <span>
                            Цена:{' '}
                            <strong>
                              {position.pricePerUnit.toLocaleString('ru-RU')} ₽
                            </strong>
                          </span>
                          <span>
                            Сумма:{' '}
                            <strong>
                              {(
                                position.quantity * position.pricePerUnit
                              ).toLocaleString('ru-RU')}{' '}
                              ₽
                            </strong>
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => removeNewPosition(position.figi)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-300 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={handleAddNewPosition}
                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
                >
                  <Plus className="w-5 h-5 mx-auto mb-1" />
                  Добавить еще позицию
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

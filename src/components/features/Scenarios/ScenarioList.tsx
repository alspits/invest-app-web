'use client';

/**
 * ScenarioList Component
 *
 * Displays saved scenarios as cards with actions.
 * Allows loading, deleting, and duplicating scenarios.
 */

import { useState } from 'react';
import { useScenarioStore } from '@/stores/scenarioStore';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { formatCurrency } from '@/lib/scenario-calculations';
import {
  Save,
  Upload,
  Trash2,
  Copy,
  Calendar,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
} from 'lucide-react';

export function ScenarioList() {
  const { selectedAccountId } = usePortfolioStore();
  const {
    scenarios,
    currentScenario,
    loadScenario,
    deleteScenario,
    createScenario,
  } = useScenarioStore();

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioDescription, setScenarioDescription] = useState('');

  const hasChanges =
    currentScenario.adjustments.length > 0 ||
    currentScenario.newPositions.length > 0;

  const handleSave = () => {
    if (!selectedAccountId || !scenarioName.trim()) return;

    createScenario(selectedAccountId, scenarioName.trim(), scenarioDescription.trim() || undefined);
    setScenarioName('');
    setScenarioDescription('');
    setShowSaveModal(false);
  };

  const handleLoad = (id: string) => {
    loadScenario(id);
  };

  const handleDelete = (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этот сценарий?')) {
      deleteScenario(id);
    }
  };

  const handleDuplicate = (scenario: typeof scenarios[0]) => {
    if (!selectedAccountId) return;

    const newName = `${scenario.name} (копия)`;
    createScenario(selectedAccountId, newName, scenario.description);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Сохраненные сценарии
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Загрузите, удалите или дублируйте сценарии
            </p>
          </div>
          {hasChanges && (
            <button
              onClick={() => setShowSaveModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Сохранить сценарий
            </button>
          )}
        </div>
      </div>

      {/* Scenarios List */}
      <div className="p-6">
        {scenarios.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Save className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Нет сохраненных сценариев
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Создайте изменения в портфеле и сохраните их как сценарий
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scenarios.map((scenario) => {
              const totalAdjustments = scenario.adjustments.length;
              const totalNewPositions = scenario.newPositions.length;
              const positiveAdjustments = scenario.adjustments.filter(
                (adj) => adj.quantityChange > 0
              ).length;
              const negativeAdjustments = scenario.adjustments.filter(
                (adj) => adj.quantityChange < 0
              ).length;

              const createdDate = new Date(scenario.createdAt);
              const updatedDate = new Date(scenario.updatedAt);

              return (
                <div
                  key={scenario.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
                >
                  {/* Scenario Info */}
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {scenario.name}
                    </h3>
                    {scenario.description && (
                      <p className="text-sm text-gray-600 mb-2">
                        {scenario.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>
                        Создан:{' '}
                        {createdDate.toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="mb-4 space-y-2">
                    {/* Adjustments */}
                    {totalAdjustments > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <TrendingUp className="w-4 h-4" />
                          <span>{totalAdjustments} изменений</span>
                        </div>
                        {positiveAdjustments > 0 && (
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                            +{positiveAdjustments}
                          </span>
                        )}
                        {negativeAdjustments > 0 && (
                          <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                            -{negativeAdjustments}
                          </span>
                        )}
                      </div>
                    )}

                    {/* New Positions */}
                    {totalNewPositions > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Plus className="w-4 h-4" />
                        <span>{totalNewPositions} новых позиций</span>
                      </div>
                    )}

                    {/* Empty state */}
                    {totalAdjustments === 0 && totalNewPositions === 0 && (
                      <p className="text-sm text-gray-500">Нет изменений</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleLoad(scenario.id)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      Загрузить
                    </button>
                    <button
                      onClick={() => handleDuplicate(scenario)}
                      className="p-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      title="Дублировать"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(scenario.id)}
                      className="p-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Сохранить сценарий
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название сценария
                </label>
                <input
                  type="text"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  placeholder="Например: Увеличение доли акций"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание (необязательно)
                </label>
                <textarea
                  value={scenarioDescription}
                  onChange={(e) => setScenarioDescription(e.target.value)}
                  placeholder="Краткое описание сценария..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Изменения:</strong> {currentScenario.adjustments.length}{' '}
                  корректировок, {currentScenario.newPositions.length} новых позиций
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setScenarioName('');
                  setScenarioDescription('');
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={!scenarioName.trim()}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

/**
 * Scenarios Page
 *
 * What-If Scenario Tool for portfolio planning.
 * Allows users to simulate changes and compare outcomes.
 */

import { useEffect } from 'react';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { useScenarioStore } from '@/stores/scenarioStore';
import { ScenarioBuilder } from '@/components/features/Scenarios/ScenarioBuilder';
import { ScenarioComparison } from '@/components/features/Scenarios/ScenarioComparison';
import { ScenarioList } from '@/components/features/Scenarios/ScenarioList';
import { AllocationPieChart } from '@/components/features/Scenarios/AllocationPieChart';
import { ValueComparisonBarChart } from '@/components/features/Scenarios/ValueComparisonBarChart';
import { Calculator, AlertCircle, RefreshCw } from 'lucide-react';

export default function ScenariosPage() {
  const {
    accounts,
    selectedAccountId,
    portfolio,
    isLoadingPortfolio: portfolioLoading,
    portfolioError,
    loadAccounts,
    switchAccount,
  } = usePortfolioStore();

  const {
    currentScenario,
    scenarios,
    comparison,
    currentMetrics,
    scenarioMetrics,
    error: scenarioError,
    loadScenarios,
    calculateScenario,
    clearCurrentScenario,
  } = useScenarioStore();

  // Load accounts on mount
  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Load scenarios when account changes
  useEffect(() => {
    if (selectedAccountId) {
      loadScenarios(selectedAccountId);
    }
  }, [selectedAccountId, loadScenarios]);

  // Recalculate scenario when changes occur
  useEffect(() => {
    if (portfolio && portfolio.positions.length > 0) {
      calculateScenario(portfolio.positions);
    }
  }, [
    portfolio,
    currentScenario.adjustments,
    currentScenario.newPositions,
    calculateScenario,
  ]);

  const hasChanges =
    currentScenario.adjustments.length > 0 ||
    currentScenario.newPositions.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calculator className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Что-если сценарии
            </h1>
          </div>
          <p className="text-gray-600">
            Моделируйте изменения в портфеле и анализируйте влияние на метрики
          </p>
        </div>

        {/* Account Selector */}
        {accounts.length > 0 && (
          <div className="mb-6 bg-white rounded-lg shadow p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Выберите счет
            </label>
            <select
              value={selectedAccountId || ''}
              onChange={(e) => switchAccount(e.target.value)}
              className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.type})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Loading State */}
        {portfolioLoading && (
          <div className="bg-white rounded-lg shadow p-12">
            <div className="flex flex-col items-center justify-center">
              <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-600">Загрузка портфеля...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {(portfolioError || scenarioError) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-900">Ошибка</h3>
                <p className="text-sm text-red-700 mt-1">
                  {portfolioError || scenarioError}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!portfolioLoading && portfolio && (
          <div className="space-y-6">
            {/* Builder and Comparison Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Scenario Builder */}
              <ScenarioBuilder />

              {/* Scenario Comparison */}
              <ScenarioComparison />
            </div>

            {/* Interactive Charts - Only show when scenario is active */}
            {hasChanges && comparison && currentMetrics && scenarioMetrics && (
              <div className="space-y-6">
                {/* Value Comparison Bar Chart */}
                <ValueComparisonBarChart
                  currentMetrics={currentMetrics}
                  scenarioMetrics={scenarioMetrics}
                />

                {/* Allocation Pie Chart */}
                <AllocationPieChart
                  currentMetrics={currentMetrics}
                  scenarioMetrics={scenarioMetrics}
                />
              </div>
            )}

            {/* Saved Scenarios */}
            <ScenarioList />

            {/* Help Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-3">
                Как пользоваться
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="font-bold mt-0.5">1.</span>
                  <span>
                    <strong>Измените позиции:</strong> используйте кнопки + и - для
                    корректировки количества существующих активов
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold mt-0.5">2.</span>
                  <span>
                    <strong>Добавьте новые позиции:</strong> переключитесь на вкладку
                    "Добавить позиции" для симуляции покупки новых активов
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold mt-0.5">3.</span>
                  <span>
                    <strong>Анализируйте результаты:</strong> сравнение метрик
                    обновляется автоматически при каждом изменении
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold mt-0.5">4.</span>
                  <span>
                    <strong>Сохраните сценарий:</strong> нажмите "Сохранить сценарий"
                    чтобы вернуться к нему позже
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold mt-0.5">5.</span>
                  <span>
                    <strong>Загрузите сохраненный:</strong> выберите сценарий из списка
                    сохраненных для повторного использования
                  </span>
                </li>
              </ul>
            </div>

            {/* Metrics Explanation */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-3">
                Объяснение метрик
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    Индекс диверсификации
                  </h4>
                  <p>
                    Показатель от 0% до 100%, где 100% - максимально
                    диверсифицированный портфель. Выше - лучше.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    Индекс концентрации (HHI)
                  </h4>
                  <p>
                    Herfindahl-Hirschman Index. Значение от 0 до 10000. Чем ниже,
                    тем более диверсифицирован портфель.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    Влияние на денежные средства
                  </h4>
                  <p>
                    Сумма, которую нужно инвестировать (+) или которая
                    высвободится (-) при реализации сценария.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    Распределение по секторам
                  </h4>
                  <p>
                    Процентное распределение портфеля по типам инструментов
                    (акции, облигации, ETF и т.д.).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!portfolioLoading && !portfolio && !portfolioError && (
          <div className="bg-white rounded-lg shadow p-12">
            <div className="text-center">
              <Calculator className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Портфель не загружен
              </h3>
              <p className="text-gray-600">
                Выберите счет для начала работы со сценариями
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

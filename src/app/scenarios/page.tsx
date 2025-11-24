'use client';

import { useEffect } from 'react';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { useScenarioStore } from '@/stores/scenarioStore';
import { ScenarioDesigner } from '@/components/features/ScenarioAnalysis';
import { WhatIfImpactPanel } from '@/components/features/ScenarioAnalysis';
import { Calculator, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

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
    error: scenarioError,
    loadScenarios,
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

  const hasActiveScenario =
    currentScenario != null &&
    (currentScenario.adjustments?.length > 0 ||
      currentScenario.newPositions?.length > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Link
              href="/portfolio"
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
              title="Вернуться к портфелю"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calculator className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Что-если анализ
              </h1>
              <p className="text-gray-600 mt-1">
                Моделируйте изменения в портфеле и анализируйте влияние на метрики
              </p>
            </div>
          </div>

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/portfolio" className="hover:text-gray-900 transition-colors">
              Портфель
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Сценарии</span>
          </nav>
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
            {/* Two-column layout for designer and impact */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Scenario Designer */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Создать сценарий
                </h2>
                <ScenarioDesigner />
              </section>

              {/* Right Column - Impact Analysis */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Анализ влияния
                </h2>
                {hasActiveScenario ? (
                  <WhatIfImpactPanel />
                ) : (
                  <div className="bg-white rounded-lg shadow p-8 text-center">
                    <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      Создайте или выберите сценарий для анализа влияния
                    </p>
                  </div>
                )}
              </section>
            </div>

            {/* Saved Scenarios */}
            {scenarios.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Сохраненные сценарии
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {scenarios.map((scenario) => (
                    <div
                      key={scenario.id}
                      className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
                    >
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {scenario.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {scenario.description}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            /* TODO: Load scenario */
                          }}
                          className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Загрузить
                        </button>
                        <button
                          onClick={() => {
                            /* TODO: Delete scenario */
                          }}
                          className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Help Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-3">
                Как пользоваться
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="font-bold mt-0.5">1.</span>
                  <span>
                    <strong>Создайте сценарий:</strong> используйте конструктор
                    сценариев для моделирования изменений в портфеле
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold mt-0.5">2.</span>
                  <span>
                    <strong>Анализируйте влияние:</strong> панель справа
                    автоматически покажет, как изменения повлияют на портфель
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold mt-0.5">3.</span>
                  <span>
                    <strong>Сохраните результаты:</strong> сохраните сценарии
                    для дальнейшего сравнения и анализа
                  </span>
                </li>
              </ul>
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

'use client';

import { useEffect } from 'react';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { useRebalancingStore } from '@/stores/rebalancing';
import { TargetAllocationSelector } from '@/components/features/Rebalancing';
import { DeviationAnalyzer } from '@/components/features/Rebalancing';
import { TradeOrderPreview } from '@/components/features/Rebalancing';
import { ArrowLeft, Loader2, Scale } from 'lucide-react';
import Link from 'next/link';

export default function RebalancingPage() {
  const { selectedAccountId, loadAccounts, isLoadingPortfolio } = usePortfolioStore();
  const { targetAllocation, proposedOrders } = useRebalancingStore();

  // Load accounts on mount
  useEffect(() => {
    if (!selectedAccountId) {
      loadAccounts();
    }
  }, [selectedAccountId, loadAccounts]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Link
              href="/portfolio"
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
              title="Вернуться к портфелю"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Scale className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Ребалансировка портфеля
              </h1>
              <p className="text-gray-600 mt-1">
                Приведите портфель к целевому распределению активов
              </p>
            </div>
          </div>

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/portfolio" className="hover:text-gray-900 transition-colors">
              Портфель
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Ребалансировка</span>
          </nav>
        </div>

        {/* Loading State */}
        {isLoadingPortfolio && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Loader2 className="w-12 h-12 text-purple-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Загрузка портфеля...
            </h3>
            <p className="text-gray-600">Подготавливаем данные для анализа</p>
          </div>
        )}

        {/* Main Content */}
        {!isLoadingPortfolio && (
          <div className="space-y-6">
            {/* Step 1: Target Allocation */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-8 h-8 bg-purple-600 text-white rounded-full font-bold text-sm">
                  1
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Установите целевое распределение
                </h2>
              </div>
              <TargetAllocationSelector />
            </section>

            {/* Step 2: Deviation Analysis */}
            {targetAllocation && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-purple-600 text-white rounded-full font-bold text-sm">
                    2
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Проанализируйте отклонения
                  </h2>
                </div>
                <DeviationAnalyzer />
              </section>
            )}

            {/* Step 3: Trade Orders */}
            {proposedOrders.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-purple-600 text-white rounded-full font-bold text-sm">
                    3
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Просмотрите торговые ордера
                  </h2>
                </div>
                <TradeOrderPreview />
              </section>
            )}

            {/* Help Section */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h3 className="font-semibold text-purple-900 mb-3">
                Как пользоваться
              </h3>
              <ul className="space-y-2 text-sm text-purple-800">
                <li className="flex items-start gap-2">
                  <span className="font-bold mt-0.5">1.</span>
                  <span>
                    <strong>Выберите стратегию:</strong> используйте готовые
                    пресеты или создайте собственное целевое распределение
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold mt-0.5">2.</span>
                  <span>
                    <strong>Проверьте отклонения:</strong> анализируйте текущие
                    отклонения от целевого распределения
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold mt-0.5">3.</span>
                  <span>
                    <strong>Изучите рекомендации:</strong> просмотрите
                    предлагаемые торговые ордера для выравнивания портфеля
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold mt-0.5">4.</span>
                  <span>
                    <strong>Оцените затраты:</strong> учитывайте комиссии и
                    налоги при принятии решения о ребалансировке
                  </span>
                </li>
              </ul>
            </div>

            {/* Info Section */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-3">
                Преимущества ребалансировки
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    Контроль рисков
                  </h4>
                  <p>
                    Ребалансировка помогает поддерживать желаемый уровень риска
                    и не допускать чрезмерной концентрации в отдельных активах.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    Дисциплина инвестирования
                  </h4>
                  <p>
                    Систематическая ребалансировка помогает избежать
                    эмоциональных решений и следовать долгосрочной стратегии.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    Фиксация прибыли
                  </h4>
                  <p>
                    Продажа переоценённых активов позволяет зафиксировать
                    прибыль и реинвестировать в недооценённые позиции.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    Оптимизация доходности
                  </h4>
                  <p>
                    Поддержание целевого распределения может улучшить
                    долгосрочную доходность с поправкой на риск.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

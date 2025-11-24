'use client';

import { useEffect } from 'react';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { useGoalStore } from '@/stores/goalStore';
import { DiversificationCard } from '@/components/features/Recommendations';
import { RiskProfileSelector } from '@/components/features/Recommendations';
import { TickerRecommendationCard } from '@/components/features/Recommendations';
import { GoalRecommendationCard } from '@/components/features/Recommendations';
import { ArrowLeft, Loader2, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function RecommendationsPage() {
  const { selectedAccountId, loadAccounts, isLoadingPortfolio, portfolio } = usePortfolioStore();
  const { goals, isLoadingGoals, loadGoals } = useGoalStore();

  // Load accounts on mount
  useEffect(() => {
    if (!selectedAccountId) {
      loadAccounts();
    }
  }, [selectedAccountId, loadAccounts]);

  // Load goals when account is selected
  useEffect(() => {
    if (selectedAccountId && !isLoadingGoals) {
      loadGoals(selectedAccountId);
    }
    // isLoadingGoals removed from deps to prevent re-fetch on loading state change
  }, [selectedAccountId, loadGoals]);

  // Check if portfolio has sufficient data
  const hasPortfolioData = portfolio && portfolio.positions && portfolio.positions.length > 0;

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
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Инвестиционные рекомендации
              </h1>
              <p className="text-gray-600 mt-1">
                Персонализированные советы для улучшения вашего портфеля
              </p>
            </div>
          </div>

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/portfolio" className="hover:text-gray-900 transition-colors">
              Портфель
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Рекомендации</span>
          </nav>
        </div>

        {/* Loading State */}
        {isLoadingPortfolio && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Загрузка портфеля...
            </h3>
            <p className="text-gray-600">
              Подготавливаем данные для анализа
            </p>
          </div>
        )}

        {/* Empty State - No Portfolio Data */}
        {!isLoadingPortfolio && !hasPortfolioData && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Недостаточно данных для анализа
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Для создания рекомендаций необходимо добавить активы в ваш портфель.
              Рекомендательная система проанализирует состав портфеля и предложит
              персонализированные советы по улучшению диверсификации и достижению целей.
            </p>
            <Link
              href="/portfolio"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Вернуться к портфелю
            </Link>
          </div>
        )}

        {/* Main Content - Portfolio with Data */}
        {!isLoadingPortfolio && hasPortfolioData && (
          <div className="space-y-6">
            {/* Risk Profile Section */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Риск-профиль
              </h2>
              <RiskProfileSelector />
            </section>

            {/* Diversification Analysis */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Анализ диверсификации
              </h2>
              <DiversificationCard />
            </section>

            {/* Ticker Recommendations */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Рекомендации по инструментам
              </h2>
              <TickerRecommendationCard />
            </section>

            {/* Goal-Based Recommendations */}
            {goals?.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Рекомендации на основе целей
                </h2>
                <div className="space-y-4">
                  {goals.map((goal) => (
                    <GoalRecommendationCard key={goal.id} goalId={goal.id} />
                  ))}
                </div>
              </section>
            )}

            {/* Empty State - No Goals */}
            {(!goals || goals.length === 0) && !isLoadingGoals && (
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Рекомендации на основе целей
                </h2>
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <p className="text-gray-600 mb-4">
                    Создайте инвестиционные цели, чтобы получить персонализированные рекомендации
                  </p>
                  <Link
                    href="/goals"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Создать цель
                  </Link>
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

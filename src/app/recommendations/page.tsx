'use client';

import { useEffect, useState } from 'react';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { useAnalyticsStore } from '@/stores/analytics';
import { generateRecommendations, RecommendationReport } from '@/lib/recommendations';
import { RecommendationsList } from '@/components/features/Recommendations/RecommendationsList';
import { RefreshCw, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function RecommendationsPage() {
  const { portfolio, selectedAccountId, loadAccounts, isLoadingPortfolio: portfolioLoading } = usePortfolioStore();
  const { metrics, loading: metricsLoading } = useAnalyticsStore();
  const [report, setReport] = useState<RecommendationReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load accounts on mount
  useEffect(() => {
    if (!selectedAccountId) {
      loadAccounts();
    }
  }, [selectedAccountId, loadAccounts]);

  // Generate recommendations when data is ready
  useEffect(() => {
    if (portfolio && metrics && !portfolioLoading && !metricsLoading) {
      try {
        const newReport = generateRecommendations(portfolio, metrics);
        setReport(newReport);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Не удалось сгенерировать рекомендации'
        );
        setReport(null);
      }
    }
  }, [portfolio, metrics, portfolioLoading, metricsLoading]);

  const handleRefresh = () => {
    if (portfolio && metrics) {
      try {
        const newReport = generateRecommendations(portfolio, metrics);
        setReport(newReport);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Не удалось обновить рекомендации'
        );
      }
    }
  };

  const handleApply = (id: string) => {
    console.log('Applying recommendation:', id);
    // TODO: Implement apply logic (navigate to relevant page, show modal, etc.)
  };

  const handleDismiss = (id: string) => {
    console.log('Dismissing recommendation:', id);
    // TODO: Implement dismiss logic (store in localStorage, remove from view)
  };

  const handleLearnMore = (id: string) => {
    console.log('Learn more about recommendation:', id);
    // TODO: Implement learn more logic (show modal with details, link to help docs)
  };

  const isLoading = portfolioLoading || metricsLoading;

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
                Рекомендации по инвестициям
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
        {isLoading && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Анализ портфеля...
            </h3>
            <p className="text-gray-600">
              Загружаем данные и генерируем персонализированные рекомендации
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-white rounded-lg border-2 border-red-200 p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Ошибка при генерации рекомендаций
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Попробовать снова
            </button>
          </div>
        )}

        {/* No Data State */}
        {!portfolio && !isLoading && !error && (
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Нет данных для анализа
            </h3>
            <p className="text-gray-600 mb-4">
              Пожалуйста, загрузите портфель для получения рекомендаций
            </p>
            <Link
              href="/portfolio"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Перейти к портфелю
            </Link>
          </div>
        )}

        {/* Recommendations Report */}
        {report && !isLoading && !error && (
          <>
            {/* Refresh Button */}
            <div className="mb-6 flex justify-end">
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
              >
                <RefreshCw className="w-4 h-4" />
                Обновить рекомендации
              </button>
            </div>

            {/* Recommendations List */}
            <RecommendationsList
              report={report}
              onApply={handleApply}
              onDismiss={handleDismiss}
              onLearnMore={handleLearnMore}
            />

            {/* Generated timestamp */}
            <div className="mt-8 text-center text-sm text-gray-500">
              Рекомендации сгенерированы:{' '}
              {new Intl.DateTimeFormat('ru-RU', {
                dateStyle: 'medium',
                timeStyle: 'short',
              }).format(report.generatedAt)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

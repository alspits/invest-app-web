'use client';

/**
 * Portfolio Factors Dashboard Component
 *
 * Main dashboard for advanced portfolio factor analysis including:
 * - Sector exposure
 * - Market cap distribution
 * - Geographic allocation
 * - Currency breakdown
 * - Concentration metrics
 * - Risk indicators
 */

import { useEffect, useState } from 'react';
import { useAnalyticsStore } from '@/stores/analyticsStore';
import { usePortfolioStore } from '@/stores/portfolioStore';
import SectorExposure from './FactorAnalysis/SectorExposure';
import MarketCapExposure from './FactorAnalysis/MarketCapExposure';
import GeographyExposure from './FactorAnalysis/GeographyExposure';
import CurrencyExposure from './FactorAnalysis/CurrencyExposure';

// ============================================================================
// Types
// ============================================================================

type ViewMode = 'pie' | 'bar';
type FactorView = 'all' | 'sector' | 'marketcap' | 'geography' | 'currency';

// ============================================================================
// Helper Functions
// ============================================================================

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

// ============================================================================
// Subcomponents
// ============================================================================

const LoadingState = () => (
  <div className="flex items-center justify-center py-12">
    <div className="text-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        Загрузка факторного анализа...
      </p>
    </div>
  </div>
);

const ErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="flex items-center justify-center py-12">
    <div className="text-center max-w-md">
      <div className="text-red-500 text-5xl mb-4">⚠️</div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Ошибка загрузки
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {error}
      </p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Повторить попытку
      </button>
    </div>
  </div>
);

const EmptyState = () => (
  <div className="flex items-center justify-center py-12">
    <div className="text-center max-w-md">
      <div className="text-gray-400 text-5xl mb-4">📊</div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Нет данных для анализа
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Выберите счет с позициями для просмотра факторного анализа
      </p>
    </div>
  </div>
);

const ConcentrationMetrics = ({ data }: { data: any }) => {
  const getRiskColor = (hhi: number) => {
    if (hhi >= 0.25) return 'text-red-600 dark:text-red-400';
    if (hhi >= 0.15) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getRiskLevel = (hhi: number) => {
    if (hhi >= 0.25) return 'Высокий';
    if (hhi >= 0.15) return 'Средний';
    return 'Низкий';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Метрики концентрации
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Топ позиция</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatPercent(data.topPositionWeight)}
          </p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Топ 5 позиций</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatPercent(data.top5PositionsWeight)}
          </p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Топ 10 позиций</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatPercent(data.top10PositionsWeight)}
          </p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Индекс HHI</p>
          <p className={`text-2xl font-bold ${getRiskColor(data.herfindahlIndex)}`}>
            {data.herfindahlIndex.toFixed(3)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Риск: {getRiskLevel(data.herfindahlIndex)}
          </p>
        </div>
      </div>
    </div>
  );
};

const DiversificationScores = ({ data }: { data: any }) => {
  const getScoreColor = (score: number) => {
    if (score >= 0.7) return 'text-green-600 dark:text-green-400';
    if (score >= 0.4) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreGrade = (score: number) => {
    if (score >= 0.7) return 'Отлично';
    if (score >= 0.4) return 'Хорошо';
    return 'Требует улучшения';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Оценка диверсификации
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Общая</p>
          <p className={`text-2xl font-bold ${getScoreColor(data.overall)}`}>
            {formatPercent(data.overall * 100)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {getScoreGrade(data.overall)}
          </p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">По секторам</p>
          <p className={`text-2xl font-bold ${getScoreColor(data.bySector)}`}>
            {formatPercent(data.bySector * 100)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {getScoreGrade(data.bySector)}
          </p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">По географии</p>
          <p className={`text-2xl font-bold ${getScoreColor(data.byGeography)}`}>
            {formatPercent(data.byGeography * 100)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {getScoreGrade(data.byGeography)}
          </p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">По валютам</p>
          <p className={`text-2xl font-bold ${getScoreColor(data.byCurrency)}`}>
            {formatPercent(data.byCurrency * 100)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {getScoreGrade(data.byCurrency)}
          </p>
        </div>
      </div>
    </div>
  );
};

const RiskIndicators = ({ data }: { data: any }) => {
  const getRiskBadgeColor = (risk: 'low' | 'medium' | 'high') => {
    if (risk === 'low') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (risk === 'medium') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  };

  const getRiskText = (risk: 'low' | 'medium' | 'high') => {
    if (risk === 'low') return 'Низкий';
    if (risk === 'medium') return 'Средний';
    return 'Высокий';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Индикаторы рисков
      </h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Риск концентрации по секторам
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskBadgeColor(data.sectorConcentrationRisk)}`}>
            {getRiskText(data.sectorConcentrationRisk)}
          </span>
        </div>
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Риск концентрации по географии
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskBadgeColor(data.geographyConcentrationRisk)}`}>
            {getRiskText(data.geographyConcentrationRisk)}
          </span>
        </div>
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Риск концентрации по валютам
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskBadgeColor(data.currencyConcentrationRisk)}`}>
            {getRiskText(data.currencyConcentrationRisk)}
          </span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export default function PortfolioFactors() {
  const { selectedAccount } = usePortfolioStore();
  const { factorAnalysis, factorLoading, factorError, loadFactorAnalysis } = useAnalyticsStore();

  const [viewMode, setViewMode] = useState<ViewMode>('pie');
  const [activeView, setActiveView] = useState<FactorView>('all');

  // Load factor analysis when account changes
  useEffect(() => {
    if (selectedAccount) {
      loadFactorAnalysis(selectedAccount.id);
    }
  }, [selectedAccount, loadFactorAnalysis]);

  // Handle retry
  const handleRetry = () => {
    if (selectedAccount) {
      loadFactorAnalysis(selectedAccount.id);
    }
  };

  // Render states
  if (factorLoading) {
    return <LoadingState />;
  }

  if (factorError) {
    return <ErrorState error={factorError} onRetry={handleRetry} />;
  }

  if (!factorAnalysis) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Факторный анализ портфеля
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Детальный анализ распределения активов по различным факторам
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('pie')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'pie'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Круговая диаграмма
          </button>
          <button
            onClick={() => setViewMode('bar')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'bar'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Столбчатая диаграмма
          </button>
        </div>
      </div>

      {/* View Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'all', label: 'Все факторы', icon: '📊' },
          { id: 'sector', label: 'Секторы', icon: '🏢' },
          { id: 'marketcap', label: 'Капитализация', icon: '💼' },
          { id: 'geography', label: 'География', icon: '🌍' },
          { id: 'currency', label: 'Валюты', icon: '💱' },
        ].map((view) => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id as FactorView)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeView === view.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <span>{view.icon}</span>
            {view.label}
          </button>
        ))}
      </div>

      {/* Metrics Overview */}
      {activeView === 'all' && (
        <div className="space-y-6">
          <ConcentrationMetrics data={factorAnalysis.concentrationMetrics} />
          <DiversificationScores data={factorAnalysis.diversificationScore} />
          <RiskIndicators data={factorAnalysis.riskIndicators} />
        </div>
      )}

      {/* Factor Views */}
      <div className="space-y-6">
        {(activeView === 'all' || activeView === 'sector') && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <SectorExposure
              data={factorAnalysis.sectorExposure}
              viewMode={viewMode}
              showBenchmark={true}
            />
          </div>
        )}

        {(activeView === 'all' || activeView === 'marketcap') && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <MarketCapExposure
              data={factorAnalysis.marketCapExposure}
              viewMode={viewMode}
            />
          </div>
        )}

        {(activeView === 'all' || activeView === 'geography') && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <GeographyExposure
              data={factorAnalysis.geographyExposure}
              viewMode={viewMode}
              showBenchmark={true}
            />
          </div>
        )}

        {(activeView === 'all' || activeView === 'currency') && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <CurrencyExposure
              data={factorAnalysis.currencyExposure}
              viewMode={viewMode}
            />
          </div>
        )}
      </div>
    </div>
  );
}

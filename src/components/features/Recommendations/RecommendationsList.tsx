'use client';

import { useState, useMemo } from 'react';
import {
  RecommendationReport,
  RecommendationPriority,
  getHealthScoreInterpretation,
} from '@/lib/recommendation-service';
import { RecommendationCard } from './RecommendationCard';
import { Target, Filter, AlertTriangle, TrendingUp, Info } from 'lucide-react';

interface RecommendationsListProps {
  report: RecommendationReport;
  onApply?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onLearnMore?: (id: string) => void;
}

export function RecommendationsList({
  report,
  onApply,
  onDismiss,
  onLearnMore,
}: RecommendationsListProps) {
  const [selectedPriority, setSelectedPriority] = useState<RecommendationPriority | 'all'>('all');

  // Filter recommendations by priority
  const filteredRecommendations = useMemo(() => {
    if (selectedPriority === 'all') {
      return report.recommendations;
    }
    return report.recommendations.filter((rec) => rec.priority === selectedPriority);
  }, [report.recommendations, selectedPriority]);

  // Health score interpretation
  const healthScore = report.overallScore;
  const scoreInterpretation = getHealthScoreInterpretation(healthScore);

  // Calculate progress ring
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (healthScore / 100) * circumference;

  // Score color
  const scoreColor =
    scoreInterpretation.color === 'green'
      ? 'text-green-600'
      : scoreInterpretation.color === 'blue'
        ? 'text-blue-600'
        : scoreInterpretation.color === 'yellow'
          ? 'text-yellow-600'
          : 'text-red-600';

  const ringColor =
    scoreInterpretation.color === 'green'
      ? 'stroke-green-500'
      : scoreInterpretation.color === 'blue'
        ? 'stroke-blue-500'
        : scoreInterpretation.color === 'yellow'
          ? 'stroke-yellow-500'
          : 'stroke-red-500';

  // Priority counts
  const priorityCounts = {
    high: report.recommendations.filter((r) => r.priority === 'high').length,
    medium: report.recommendations.filter((r) => r.priority === 'medium').length,
    low: report.recommendations.filter((r) => r.priority === 'low').length,
  };

  return (
    <div className="space-y-6">
      {/* Health Score Card */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Progress Ring */}
          <div className="relative flex-shrink-0">
            <svg className="w-32 h-32 transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="64"
                cy="64"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-200"
              />
              {/* Progress circle */}
              <circle
                cx="64"
                cy="64"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className={`${ringColor} transition-all duration-1000 ease-out`}
                strokeLinecap="round"
              />
            </svg>
            {/* Score text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className={`text-3xl font-bold ${scoreColor}`}>{healthScore}</div>
                <div className="text-xs text-gray-500">из 100</div>
              </div>
            </div>
          </div>

          {/* Health Score Info */}
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Здоровье портфеля: {scoreInterpretation.label}
            </h2>
            <p className="text-gray-600 mb-4">{scoreInterpretation.description}</p>

            {/* Recommendation counts */}
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <div className="flex items-center gap-2 px-3 py-1 bg-red-50 rounded-full">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-semibold text-red-700">
                  {priorityCounts.high} высокий
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-yellow-50 rounded-full">
                <TrendingUp className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-semibold text-yellow-700">
                  {priorityCounts.medium} средний
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full">
                <Info className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-700">
                  {priorityCounts.low} низкий
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Priority Filter Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900">Фильтр по приоритету</h3>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedPriority('all')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              selectedPriority === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Все ({report.recommendations.length})
          </button>
          <button
            onClick={() => setSelectedPriority('high')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              selectedPriority === 'high'
                ? 'bg-red-600 text-white'
                : 'bg-red-50 text-red-700 hover:bg-red-100'
            }`}
          >
            Высокий ({priorityCounts.high})
          </button>
          <button
            onClick={() => setSelectedPriority('medium')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              selectedPriority === 'medium'
                ? 'bg-yellow-600 text-white'
                : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
            }`}
          >
            Средний ({priorityCounts.medium})
          </button>
          <button
            onClick={() => setSelectedPriority('low')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              selectedPriority === 'low'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            Низкий ({priorityCounts.low})
          </button>
        </div>
      </div>

      {/* Recommendations Grid */}
      {filteredRecommendations.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredRecommendations.map((recommendation) => (
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
              onApply={onApply}
              onDismiss={onDismiss}
              onLearnMore={onLearnMore}
            />
          ))}
        </div>
      ) : (
        // Empty State
        <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Нет рекомендаций с выбранным приоритетом
          </h3>
          <p className="text-gray-600 mb-4">
            {selectedPriority === 'all'
              ? 'Ваш портфель в отличном состоянии! Рекомендаций нет.'
              : `Нет рекомендаций с приоритетом "${selectedPriority === 'high' ? 'высокий' : selectedPriority === 'medium' ? 'средний' : 'низкий'}".`}
          </p>
          {selectedPriority !== 'all' && (
            <button
              onClick={() => setSelectedPriority('all')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Показать все рекомендации
            </button>
          )}
        </div>
      )}
    </div>
  );
}

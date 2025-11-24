'use client';

/**
 * Goal Recommendation Card
 * Displays goal-specific recommendations with progress tracking
 */

import { useEffect, useState } from 'react';
import { useRecommendationsStore } from '@/stores/recommendations';
import type { GoalRecommendation } from '@/lib/recommendations/goal-recommender';
import type { GoalAnalysis } from '@/lib/recommendations/goal-analyzer';

interface GoalRecommendationCardProps {
  goalId: string;
  className?: string;
}

export function GoalRecommendationCard({ goalId, className = '' }: GoalRecommendationCardProps) {
  const { goalRecommendations, goalAnalyses, isLoadingGoals, fetchGoalRecommendations, dismissGoalRecommendation } =
    useRecommendationsStore();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchGoalRecommendations(goalId);
  }, [goalId, fetchGoalRecommendations]);

  if (!mounted) return null;

  const analysis: GoalAnalysis | undefined = goalAnalyses[goalId];
  const recommendations: GoalRecommendation[] = goalRecommendations[goalId] || [];

  if (isLoadingGoals) {
    return (
      <div className={`rounded-lg border border-gray-200 bg-white p-6 shadow-sm ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 w-48 rounded bg-gray-200"></div>
          <div className="mt-4 h-4 w-full rounded bg-gray-200"></div>
          <div className="mt-2 h-4 w-3/4 rounded bg-gray-200"></div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className={`rounded-lg border border-gray-200 bg-white p-6 shadow-sm ${className}`}>
        <p className="text-gray-600">Нет данных по целям. Добавьте цель для получения рекомендаций.</p>
      </div>
    );
  }

  // Status badge colors
  const statusConfig = {
    on_track: { label: 'На пути', color: 'bg-green-100 text-green-800' },
    at_risk: { label: 'Риск', color: 'bg-yellow-100 text-yellow-800' },
    behind: { label: 'Отстаём', color: 'bg-red-100 text-red-800' },
  };

  const status = statusConfig[analysis.status];

  // Priority badge colors
  const priorityConfig = {
    1: { label: 'Высокий', color: 'bg-red-100 text-red-800' },
    2: { label: 'Средний', color: 'bg-yellow-100 text-yellow-800' },
    3: { label: 'Низкий', color: 'bg-blue-100 text-blue-800' },
    4: { label: 'Низкий', color: 'bg-blue-100 text-blue-800' },
    5: { label: 'Низкий', color: 'bg-blue-100 text-blue-800' },
  };

  return (
    <div className={`rounded-lg border border-gray-200 bg-white p-6 shadow-sm ${className}`}>
      {/* Goal Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{analysis.goalName}</h3>
          <p className="mt-1 text-sm text-gray-600">
            Цель: ₽{analysis.targetAmount.toLocaleString('ru-RU')} • Через {analysis.timeRemaining.years}л{' '}
            {analysis.timeRemaining.months}м
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.color}`}>{status.label}</span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-gray-600">Прогресс</span>
          <span className="font-medium text-gray-900">{(analysis.progress * 100).toFixed(1)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${Math.min(analysis.progress * 100, 100)}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
          <span>₽{analysis.currentAmount.toLocaleString('ru-RU')}</span>
          <span>₽{analysis.targetAmount.toLocaleString('ru-RU')}</span>
        </div>
      </div>

      {/* Completion Probability */}
      <div className="mb-4 rounded-lg bg-gray-50 p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Вероятность достижения</span>
          <span className="text-lg font-semibold text-gray-900">{analysis.completionProbability}%</span>
        </div>
        {analysis.requiredMonthlySavings > 0 && (
          <p className="mt-1 text-xs text-gray-600">
            Требуется ₽{analysis.requiredMonthlySavings.toLocaleString('ru-RU')}/месяц
          </p>
        )}
      </div>

      {/* Recommendations List */}
      {recommendations.length > 0 ? (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">Рекомендации</h4>
          {recommendations.map((rec) => (
            <div key={rec.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="mb-2 flex items-start justify-between">
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${priorityConfig[rec.priority].color}`}>
                  {priorityConfig[rec.priority].label}
                </span>
                <button
                  onClick={() => dismissGoalRecommendation(goalId, rec.id)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Dismiss recommendation"
                >
                  ✕
                </button>
              </div>
              <p className="mb-2 font-medium text-gray-900">{rec.description}</p>
              <p className="mb-2 text-sm text-gray-600">{rec.rationale}</p>
              <p className="text-xs font-medium text-blue-600">{rec.estimatedImpact}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
          ✓ Портфель оптимален для данной цели. Дополнительных действий не требуется.
        </div>
      )}
    </div>
  );
}
